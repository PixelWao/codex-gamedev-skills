#!/usr/bin/env python3
"""MIT © 2026 Waldemar Soroka. Validate JSONL combat trace; no runtime dependencies."""
import argparse, json, math, sys
from collections import Counter
from pathlib import Path

def analyze(rows, nominal_rate=None):
    counts=Counter(); issues=[]; last_time=-math.inf; seen_shots=set(); last_shots={}
    for line,row in enumerate(rows,1):
        if not isinstance(row,dict) or not isinstance(row.get('time'),(int,float)) or not math.isfinite(row['time']) or row['time']<0:
            issues.append({'line':line,'reason':'invalid time'});continue
        t=row['time']; typ=row.get('type');counts[str(typ)]+=1
        if t+1e-9<last_time:issues.append({'line':line,'reason':'nonmonotonic time'})
        last_time=max(last_time,t)
        if typ=='shot':
            key=(row.get('actor'),row.get('weapon'),row.get('shotId'))
            if any(v is None for v in key): issues.append({'line':line,'reason':'shot missing identifier'})
            elif key in seen_shots: issues.append({'line':line,'reason':'duplicate shot id'})
            else:seen_shots.add(key)
            scope=(row.get('actor'),row.get('weapon'))
            if nominal_rate and scope in last_shots and t-last_shots[scope] < 1/nominal_rate-1e-6:
                issues.append({'line':line,'reason':'fire rate exceeded'})
            last_shots[scope]=t
        if typ in ('hit','kill') and not row.get('shotId'):
            issues.append({'line':line,'reason':'hit/kill without shotId'})
    return {'ok':not issues,'events':sum(counts.values()),'counts':dict(counts),'issues':issues}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('input',type=Path);ap.add_argument('--rate',type=float);ap.add_argument('--output',type=Path)
    args=ap.parse_args()
    if args.rate is not None and (not math.isfinite(args.rate) or args.rate<=0):ap.error('--rate must be positive and finite')
    try:
        rows=[json.loads(line) for line in args.input.read_text(encoding='utf-8').splitlines() if line.strip()]
        report=analyze(rows,args.rate)
    except (ValueError,OSError) as e:
        print(str(e),file=sys.stderr);return 2
    result=json.dumps(report,indent=2,ensure_ascii=False)
    if args.output:args.output.write_text(result+'\n',encoding='utf-8')
    else:print(result)
    return 0 if report['ok'] else 1
if __name__=='__main__':sys.exit(main())
