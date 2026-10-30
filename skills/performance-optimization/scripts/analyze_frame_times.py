#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Waldemar Soroka
"""Describe already-captured frame intervals (ms); does NOT measure CPU or GPU time.

Inputs: JSON [positive-number, ...] or {"frameIntervalsMs": [...]}, or CSV with `frame_ms`.
Optional --baseline compares descriptive statistics only; no significance assertion.
Python standard library only. Example:
    python scripts/analyze_frame_times.py frames.json --target-fps 60 --json
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import statistics
import sys
from pathlib import Path


def _valid_number(value: object, source: str, index: int) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float, str)):
        raise ValueError(f"{source}: nonnumeric interval at index {index}")
    try:
        result = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{source}: invalid interval at index {index}: {value!r}") from exc
    if not math.isfinite(result) or result <= 0:
        raise ValueError(f"{source}: interval must be finite and > 0 at index {index}")
    return result


def load_intervals(path: Path, skip_first: int = 0) -> list[float]:
    if not path.is_file():
        raise ValueError(f"Missing input file: {path}")
    try:
        if path.suffix.lower() == '.json':
            data = json.loads(path.read_text(encoding='utf-8'))
            if isinstance(data, dict):
                data = data.get('frameIntervalsMs')
            if not isinstance(data, list):
                raise ValueError(f"{path}: expected array or object with frameIntervalsMs array")
            entries = data
        elif path.suffix.lower() == '.csv':
            with path.open('r', newline='', encoding='utf-8-sig') as stream:
                reader = csv.DictReader(stream)
                if not reader.fieldnames or 'frame_ms' not in reader.fieldnames:
                    raise ValueError(f"{path}: CSV must include a frame_ms column")
                entries = [row['frame_ms'] for row in reader]
        else:
            raise ValueError(f"{path}: supported extensions: .json, .csv")
    except (UnicodeError, OSError, json.JSONDecodeError, csv.Error) as exc:
        raise ValueError(f"{path}: cannot read valid input ({exc})") from exc
    cleaned = [_valid_number(value, str(path), i) for i, value in enumerate(entries)]
    if skip_first >= len(cleaned):
        raise ValueError(f"{path}: no observations remain after skipping {skip_first}")
    return cleaned[skip_first:]


def nearest_rank(sorted_values: list[float], quantile: float) -> float:
    if not sorted_values or not (0 < quantile <= 1):
        raise ValueError('nearest_rank needs sorted observations and 0 < quantile <= 1')
    return sorted_values[math.ceil(len(sorted_values) * quantile) - 1]


def summarize(values: list[float], target_fps: float) -> dict[str, float | int]:
    if not values or not math.isfinite(target_fps) or target_fps <= 0:
        raise ValueError('Need frame observations and a positive finite target FPS')
    sorted_values = sorted(values)
    n = len(values)
    budget = 1000.0 / target_fps
    mean = statistics.fmean(values)
    return {
        'count': n,
        'targetFps': target_fps,
        'budgetMs': budget,
        'meanIntervalMs': mean,
        'effectiveCadenceFps': 1000.0 / mean,
        'p50Ms': nearest_rank(sorted_values, .50),
        'p95Ms': nearest_rank(sorted_values, .95),
        'p99Ms': nearest_rank(sorted_values, .99),
        'worstMs': sorted_values[-1],
        'overBudgetPct': 100.0 * sum(v > budget for v in values) / n,
        'over1_5xBudgetPct': 100.0 * sum(v > 1.5 * budget for v in values) / n,
        'over2xBudgetPct': 100.0 * sum(v > 2 * budget for v in values) / n,
    }


def compare(baseline: dict[str, float | int], candidate: dict[str, float | int]) -> dict[str, dict[str, float]]:
    result = {}
    for key in ('p50Ms', 'p95Ms', 'p99Ms', 'worstMs', 'meanIntervalMs', 'overBudgetPct'):
        old, new = float(baseline[key]), float(candidate[key])
        result[key] = {'difference': new - old, 'relativePct': 100.0 * (new - old) / old if old != 0 else None}
    return result


def print_summary(name: str, stats: dict[str, float | int]) -> None:
    print(f'{name} ({stats["count"]} frame intervals, target {stats["targetFps"]:g} fps):')
    for key in ('budgetMs', 'meanIntervalMs', 'effectiveCadenceFps', 'p50Ms', 'p95Ms', 'p99Ms',
                'worstMs', 'overBudgetPct', 'over1_5xBudgetPct', 'over2xBudgetPct'):
        print(f'  {key}: {stats[key]:.3f}')


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('candidate', type=Path, help='CSV (frame_ms) or JSON (frameIntervalsMs)')
    parser.add_argument('--baseline', type=Path, help='Optional comparison CSV/JSON')
    parser.add_argument('--target-fps', type=float, default=60.0)
    parser.add_argument('--skip-first', type=int, default=0,
                        help='Skip the same number of initial recorded intervals in both inputs')
    parser.add_argument('--json', action='store_true', help='Output JSON instead of text')
    args = parser.parse_args(argv)
    if args.skip_first < 0 or not math.isfinite(args.target_fps) or args.target_fps <= 0:
        parser.error('--skip-first must be >= 0 and --target-fps finite and positive')
    try:
        candidate = summarize(load_intervals(args.candidate, args.skip_first), args.target_fps)
        baseline = (summarize(load_intervals(args.baseline, args.skip_first), args.target_fps)
                    if args.baseline else None)
    except ValueError as exc:
        parser.error(str(exc))
    data = {'metricType': 'frame intervals, not GPU or CPU timings',
            'percentiles': 'nearest-rank',
            'candidate': candidate,
            'baseline': baseline,
            'differenceCandidateMinusBaseline': compare(baseline, candidate) if baseline else None}
    if args.json:
        print(json.dumps(data, indent=2, allow_nan=False))
    else:
        if baseline:
            print_summary('Baseline', baseline)
        print_summary('Candidate', candidate)
        if baseline:
            print('Difference candidate - baseline (negative ms is improvement):')
            for key, delta in data['differenceCandidateMinusBaseline'].items():
                pct = 'n/a' if delta['relativePct'] is None else f'{delta["relativePct"]:+.2f}%'
                print(f'  {key}: {delta["difference"]:+.3f} ({pct})')
        print('NOTE: describes pacing samples only; cannot establish GPU time or causality.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
