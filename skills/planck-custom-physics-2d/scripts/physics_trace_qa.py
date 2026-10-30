#!/usr/bin/env python3
"""Validate generic rigid-body trace data; no engine bindings or third-party deps.

Schema: JSON array or {"samples": [...]} or CSV rows with `tick`, `body`, `x`, `y`.
Optional fields: z, vx, vy, vz, joint_error, penetration, step_ms.
All step_ms values are per tick; duplicates on that tick must match or mark invalid.
Missing optional metrics are reported as unmeasured, never silently inferred as zero.
Exit: 0 PASS, 1 threshold/regression FAIL, 2 malformed input.
"""
import argparse
import csv
import json
import math
from pathlib import Path
import sys

METRICS = ('joint_error', 'penetration', 'step_ms')
NUMERIC = ('x', 'y', 'z', 'vx', 'vy', 'vz') + METRICS


def percentile(values, fraction):
    if not values:
        return None
    s = sorted(values)
    return s[max(0, math.ceil(len(s) * fraction) - 1)]


def load(path):
    p = Path(path)
    if p.suffix.lower() == '.json':
        content = json.loads(p.read_text(encoding='utf-8'))
        rows = content['samples'] if isinstance(content, dict) and 'samples' in content else content
    elif p.suffix.lower() == '.csv':
        with p.open(encoding='utf-8-sig', newline='') as f:
            rows = list(csv.DictReader(f))
    else:
        raise ValueError('Expected .json or .csv input')
    if not isinstance(rows, list) or not rows:
        raise ValueError('Input must be a nonempty list of samples')
    result = []
    seen = set()
    seen_time = {}
    last_tick_per_body = {}
    for i, row in enumerate(rows):
        if not isinstance(row, dict):
            raise ValueError(f'Row {i} is not an object')
        for field in ('tick', 'body', 'x', 'y'):
            if field not in row or row[field] in ('', None):
                raise ValueError(f'Row {i} missing {field}')
        raw_tick = str(row['tick'])
        if not raw_tick.isdigit():
            raise ValueError(f'Row {i} invalid tick: {raw_tick}')
        tick = int(raw_tick)
        if tick < 0:
            raise ValueError(f'Row {i} negative tick')
        body = str(row['body']).strip()
        if not body:
            raise ValueError(f'Row {i} blank body')
        key = (tick, body)
        if key in seen:
            raise ValueError(f'Duplicate body/tick: {key}')
        seen.add(key)
        if body in last_tick_per_body and tick <= last_tick_per_body[body]:
            raise ValueError(f'Non-increasing tick for body {body}')
        last_tick_per_body[body] = tick
        data = {'tick': tick, 'body': body}
        for field in NUMERIC:
            value = row.get(field)
            if value in ('', None):
                continue
            try:
                number = float(value)
            except (ValueError, TypeError):
                raise ValueError(f'Row {i} nonnumeric {field}') from None
            if not math.isfinite(number):
                raise ValueError(f'Row {i} nonfinite {field}')
            if field in METRICS and number < 0:
                raise ValueError(f'Row {i} negative {field}')
            data[field] = number
        if 'step_ms' in data:
            if tick in seen_time and seen_time[tick] != data['step_ms']:
                raise ValueError(f'Conflicting step_ms within tick {tick}')
            seen_time[tick] = data['step_ms']
        result.append(data)
    if len({r['body'] for r in result}) == 0:
        raise ValueError('No bodies')
    return result


def summarize(rows):
    d = {'samples': len(rows), 'bodies': len({r['body'] for r in rows}),
         'ticks': len({r['tick'] for r in rows}), 'measured': {}, 'metrics': {}}
    for m in METRICS:
        if m == 'step_ms':
            per_tick = {}
            for r in rows:
                if m in r:
                    per_tick[r['tick']] = r[m]
            values = list(per_tick.values())
        else:
            values = [r[m] for r in rows if m in r]
        d['measured'][m] = bool(values)
        d['metrics'][m] = (dict(n=len(values), max=max(values), p95=percentile(values, .95))
                            if values else None)
    return d


def evaluate(candidate, baseline, a):
    issues = []
    policies = {'joint_error': a.max_joint_error,
                'penetration': a.max_penetration,
                'step_ms': a.max_step_ms_p95}
    for metric, limit in policies.items():
        vals = candidate['metrics'][metric]
        if limit is not None:
            if vals is None:
                issues.append(f'UNMEASURED: {metric} required for threshold')
            elif (vals['p95'] if metric == 'step_ms' else vals['max']) > limit:
                issues.append(f'THRESHOLD: {metric} above {limit}')
    if baseline:
        for metric in METRICS:
            current = candidate['metrics'][metric]
            prior = baseline['metrics'][metric]
            if current is None or prior is None:
                continue
            c = current['p95'] if metric == 'step_ms' else current['max']
            b = prior['p95'] if metric == 'step_ms' else prior['max']
            if b > 0 and c > b * (1 + a.regression_tolerance):
                issues.append(f'REGRESSION: {metric} {c:.6g} vs baseline {b:.6g}')
            elif b == 0 and c > 0:
                issues.append(f'NEW_NONZERO: {metric} {c:.6g} vs baseline 0; inspect')
    return issues


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True)
    parser.add_argument('--baseline')
    parser.add_argument('--output')
    parser.add_argument('--max-joint-error', type=float)
    parser.add_argument('--max-penetration', type=float)
    parser.add_argument('--max-step-ms-p95', type=float)
    parser.add_argument('--regression-tolerance', type=float, default=0.15)
    args = parser.parse_args(argv)
    if args.regression_tolerance < 0 or any(v is not None and v < 0 for v in (
            args.max_joint_error, args.max_penetration, args.max_step_ms_p95)):
        parser.error('Limits and tolerance must be nonnegative')
    try:
        current = summarize(load(args.input))
        original = summarize(load(args.baseline)) if args.baseline else None
    except (ValueError, KeyError, TypeError, json.JSONDecodeError, OSError) as exc:
        print(f'INVALID TRACE: {exc}', file=sys.stderr)
        return 2
    issues = evaluate(current, original, args)
    result = {'status': 'FAIL' if issues else 'PASS', 'candidate': current,
              'baseline': original, 'issues': issues,
              'note': 'Observational telemetry only; no physics engine was executed.'}
    output = json.dumps(result, indent=2, sort_keys=True, allow_nan=False)
    if args.output:
        Path(args.output).write_text(output + '\n', encoding='utf-8')
    print(output)
    return 1 if issues else 0


if __name__ == '__main__':
    sys.exit(main())
