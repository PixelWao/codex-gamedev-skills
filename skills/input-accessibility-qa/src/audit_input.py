#!/usr/bin/env python3
"""Independent JSONL input trace auditor. MIT (c) 2026 Waldemar Soroka."""
from __future__ import annotations
import argparse
import csv
import json
import math
import sys
from collections import defaultdict
from pathlib import Path


def audit(events, *, press_timeout_ms=30_000, max_analog=1.000001):
    errors, warnings, held, pointers, consumed = [], [], {}, {}, set()
    last = -math.inf
    for line, event in enumerate(events, 1):
        if not isinstance(event, dict):
            errors.append({'line': line, 'code':'BAD_EVENT'}); continue
        t = event.get('time')
        if isinstance(t, bool) or not isinstance(t, (int, float)) or not math.isfinite(t) or t < 0:
            errors.append({'line':line,'code':'BAD_TIME'});continue
        if t < last: errors.append({'line':line,'code':'TIME_REVERSAL'})
        last = t
        kind=event.get('type')
        device=event.get('device','unknown')
        key=(str(device),str(event.get('control','')))
        if kind == 'down':
            if key in held:errors.append({'line':line,'code':'DOUBLE_DOWN','control':key[1]})
            else:held[key]=t
        elif kind == 'up':
            if key not in held:errors.append({'line':line,'code':'ORPHAN_UP','control':key[1]})
            else:held.pop(key)
        elif kind in ('blur','hidden','releaseAll'):
            if held:warnings.append({'line':line,'code':'FOCUS_RELEASE','count':len(held)})
            held.clear();pointers.clear()
        elif kind == 'pointerdown':
            pid=event.get('pointerId')
            if pid is None or pid in pointers:errors.append({'line':line,'code':'DUPLICATE_POINTER'})
            else:pointers[pid]=event.get('zone')
        elif kind in ('pointerup','pointercancel'):
            pid=event.get('pointerId')
            if pid not in pointers:errors.append({'line':line,'code':'ORPHAN_POINTER'})
            else:pointers.pop(pid)
        elif kind == 'axis':
            x,y=event.get('x'),event.get('y')
            if any(isinstance(n,bool) or not isinstance(n,(int,float)) or not math.isfinite(n) for n in (x,y)):
                errors.append({'line':line,'code':'BAD_AXIS'})
            elif math.hypot(x,y)>max_analog:errors.append({'line':line,'code':'ANALOG_OVERRANGE'})
        elif kind == 'consume':
            cid=event.get('inputId')
            if not isinstance(cid,str) or not cid:errors.append({'line':line,'code':'MISSING_CONSUME_ID'})
            elif cid in consumed:errors.append({'line':line,'code':'DOUBLE_CONSUME'})
            else:consumed.add(cid)
        elif kind == 'binding':
            if event.get('conflict'):errors.append({'line':line,'code':'BINDING_CONFLICT'})
        elif kind not in ('context','device','press','release','sample'):
            warnings.append({'line':line,'code':'UNKNOWN_EVENT'})
    if held:
        # A held control is not necessarily a bug in a truncated live capture.
        for key, start in held.items():
            warnings.append({'line':len(events),'code':'UNCLOSED_HELD','control':key[1],'heldMs':max(0,last-start)})
            if last-start>press_timeout_ms:errors.append({'line':len(events),'code':'STUCK_HELD','control':key[1]})
    for pid in pointers:warnings.append({'line':len(events),'code':'UNCLOSED_POINTER','pointerId':pid})
    return {'ok':not errors,'events':len(events),'errors':errors,'warnings':warnings,'counts':{'errors':len(errors),'warnings':len(warnings)}}


def read_events(path):
    p=Path(path)
    if p.suffix=='.jsonl':
        return [json.loads(line) for line in p.read_text(encoding='utf-8').splitlines() if line.strip()]
    if p.suffix=='.csv':
        with p.open(encoding='utf-8',newline='') as f:
            rows=list(csv.DictReader(f))
        for r in rows:
            if r.get('time','')!='':r['time']=float(r['time'])
            for k in ('x','y'):
                if r.get(k,'')!='':r[k]=float(r[k])
        return rows
    obj=json.loads(p.read_text(encoding='utf-8'))
    if not isinstance(obj,list):raise ValueError('JSON root must be a list of input events')
    return obj


def main(argv=None):
    ap=argparse.ArgumentParser(description='Input event trace QA')
    ap.add_argument('trace',help='JSON, JSONL or CSV trace')
    ap.add_argument('--report',help='Write JSON report')
    args=ap.parse_args(argv)
    try: result=audit(read_events(args.trace))
    except (OSError,ValueError,json.JSONDecodeError) as exc:
        print(json.dumps({'ok':False,'error':str(exc)}),file=sys.stderr);return 2
    output=json.dumps(result,indent=2,ensure_ascii=False)
    print(output)
    if args.report:Path(args.report).write_text(output+'\n',encoding='utf-8')
    return 0 if result['ok'] else 1
if __name__=='__main__':raise SystemExit(main())
