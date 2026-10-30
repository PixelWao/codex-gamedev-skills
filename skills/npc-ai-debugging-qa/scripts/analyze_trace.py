#!/usr/bin/env python3
"""Validate lifecycle and decision traces (JSON Lines), with stdlib only."""
import argparse
import hashlib
import json
import math
import statistics
import sys
from pathlib import Path

KINDS = {'start', 'complete', 'abort', 'decision', 'cost'}

def parse_rows(path):
    rows = []
    def bad_constant(value):
        raise ValueError(f'nonfinite JSON constant {value}')
    with open(path, encoding='utf-8') as handle:
        for number, line in enumerate(handle, 1):
            if line.strip():
                try:
                    record = json.loads(line, parse_constant=bad_constant)
                except (json.JSONDecodeError, ValueError) as exc:
                    raise ValueError(f'line {number}: {exc}') from exc
                if not isinstance(record, dict):
                    raise ValueError(f'line {number}: JSON object expected')
                rows.append(record)
    return rows

def percentile(values, percent):
    if not values:
        return None
    ordered = sorted(values)
    point = (len(ordered)-1)*percent/100
    lower, upper = math.floor(point), math.ceil(point)
    return ordered[lower] + (ordered[upper]-ordered[lower])*(point-lower)

def analyze(rows, *, min_dwell=0.2, strict_end=False, max_p95=None):
    if not math.isfinite(min_dwell) or min_dwell < 0:
        raise ValueError('min dwell must be >=0')
    errors, warnings = [], []
    active = set()
    latest_time = {}
    decisions = {}
    transitions = 0
    flips = 0
    latencies = []
    agents = set()
    event_counts = {kind: 0 for kind in KINDS}
    for lineno, row in enumerate(rows, 1):
        a, kind, when = row.get('agent'), row.get('kind'), row.get('t')
        if not isinstance(a, str) or not a or kind not in KINDS or isinstance(when,bool) or not isinstance(when, (int, float)) or not math.isfinite(when):
            errors.append(f'line {lineno}: invalid agent, kind or time')
            continue
        event_counts[kind] += 1
        agents.add(a)
        if a in latest_time and when < latest_time[a]:
            errors.append(f'line {lineno}: time reversed for {a}')
        latest_time[a] = max(latest_time.get(a, -math.inf), when)
        if kind in {'start', 'complete', 'abort'}:
            node = row.get('node')
            if not isinstance(node,str) or not node:
                errors.append(f'line {lineno}: node required')
                continue
            key = (a, node)
            if kind == 'start':
                if key in active: errors.append(f'line {lineno}: duplicate running node {a}/{node}')
                active.add(key)
            else:
                if key not in active: errors.append(f'line {lineno}: unmatched {kind} {a}/{node}')
                active.discard(key)
        elif kind == 'decision':
            action = row.get('action')
            if action is not None and (not isinstance(action, str) or not action):
                errors.append(f'line {lineno}: action must be nonempty string or null')
                continue
            previous = decisions.get(a)
            if previous is not None and action != previous[0]:
                transitions += 1
                if when-previous[1] < min_dwell and row.get('reason') != 'emergency':
                    flips += 1
                    warnings.append(f'line {lineno}: rapid decision change {a} ({previous[0]} -> {action})')
            decisions[a] = (action, when)
        elif kind == 'cost':
            cost = row.get('ms')
            if isinstance(cost,bool) or not isinstance(cost,(int,float)) or not math.isfinite(cost) or cost < 0:
                errors.append(f'line {lineno}: invalid nonnegative ms cost')
            else:
                latencies.append(cost)
    if active:
        messages = [f'unfinished {a}/{node}' for a,node in sorted(active)]
        (errors if strict_end else warnings).extend(messages)
    p95 = percentile(latencies, 95)
    if max_p95 is not None:
        if not math.isfinite(max_p95) or max_p95<0: raise ValueError('max-p95 >= 0')
        if p95 is not None and p95>max_p95: errors.append(f'p95 {p95:.5f} ms > budget {max_p95:.5f} ms')
    canonical = '\n'.join(json.dumps(row,sort_keys=True,ensure_ascii=False,separators=(',',':')) for row in rows)
    return {
        'schema':'npc-ai-qa-v1','agent_count':len(agents),'events':len(rows),'event_counts':event_counts,
        'decision_switches':transitions,'rapid_flips':flips,'open_nodes':len(active),
        'decision_cost_ms':{'p50':percentile(latencies,50),'p95':p95,'p99':percentile(latencies,99)},
        'trace_sha256':hashlib.sha256(canonical.encode('utf-8')).hexdigest(),
        'errors':errors,'warnings':warnings,'status':'FAIL' if errors else 'WARN' if warnings else 'PASS'
    }

def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('trace',type=Path)
    parser.add_argument('--json',dest='output',type=Path)
    parser.add_argument('--min-dwell',type=float,default=.2)
    parser.add_argument('--max-p95',type=float)
    parser.add_argument('--strict-end',action='store_true')
    args=parser.parse_args(argv)
    try: result=analyze(parse_rows(args.trace),min_dwell=args.min_dwell,strict_end=args.strict_end,max_p95=args.max_p95)
    except (ValueError,OSError) as exc:
        print(f'ERROR: {exc}',file=sys.stderr);return 2
    encoded=json.dumps(result,ensure_ascii=False,indent=2,allow_nan=False)
    if args.output: args.output.write_text(encoded+'\n',encoding='utf8')
    print(encoded)
    return 1 if result['errors'] else 0
if __name__=='__main__': sys.exit(main())
