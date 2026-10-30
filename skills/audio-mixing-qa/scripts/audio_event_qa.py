#!/usr/bin/env python3
"""Deterministic JSONL event trace QA for game audio. MIT (c) 2026 Waldemar Soroka."""
import argparse
import json
import math
from collections import defaultdict
from pathlib import Path


def audit_events(events, *, max_voices=32, timing_tolerance_sec=.035):
    if max_voices < 1 or timing_tolerance_sec < 0: raise ValueError('Invalid budgets')
    voices={}; issues=[]; counts=defaultdict(int); peak_voices=0; prev_time=-math.inf
    def issue(line,code,detail,severity='error'):
        issues.append({'line':line,'severity':severity,'code':code,'detail':detail})
    for line,e in enumerate(events,1):
        if not isinstance(e,dict): issue(line,'NOT_OBJECT','Expected JSON object');continue
        t=e.get('time');kind=e.get('event');identifier=e.get('id')
        if not isinstance(t,(int,float)) or not math.isfinite(t) or t < 0:
            issue(line,'INVALID_TIME','Timestamp must be finite and nonnegative');continue
        if t < prev_time: issue(line,'NON_MONOTONIC','Events must be chronological')
        prev_time=t;counts[str(kind)]+=1
        if kind=='voice_start':
            if identifier is None: issue(line,'MISSING_ID','Voice start needs id');continue
            if identifier in voices: issue(line,'DUPLICATE_START',f'{identifier} already active')
            voices[identifier]=t; peak_voices=max(peak_voices,len(voices))
            if len(voices)>max_voices: issue(line,'VOICE_BUDGET_EXCEEDED',f'{len(voices)} > {max_voices}')
        elif kind in ('voice_stop','voice_end'):
            if identifier not in voices: issue(line,'ORPHAN_STOP',f'{identifier} was not active')
            else: del voices[identifier]
        elif kind=='music_event':
            scheduled=e.get('scheduled');actual=e.get('actual')
            if not all(isinstance(v,(int,float)) and math.isfinite(v) for v in (scheduled,actual)):
                issue(line,'MISSING_MUSIC_TIMING','Need scheduled and actual AudioContext times')
            elif abs(actual-scheduled)>timing_tolerance_sec:
                issue(line,'TIMING_DRIFT',f'{actual-scheduled:.6f} s',severity='warning')
        elif kind=='duck':
            amount=e.get('gain')
            if not isinstance(amount,(int,float)) or not math.isfinite(amount) or not 0<=amount<=1:
                issue(line,'INVALID_DUCK_GAIN','gain must be 0..1')
        else: issue(line,'UNKNOWN_EVENT',str(kind),severity='warning')
    for vid in voices: issue(len(events),'UNCLOSED_VOICE',str(vid))
    return {'events':len(events),'peak_simultaneous_voices':peak_voices,'event_counts':dict(counts),
            'errors':sum(i['severity']=='error' for i in issues),'warnings':sum(i['severity']=='warning' for i in issues),'issues':issues,
            'limitations':['Trace validates reported events only; cannot prove audible timing or loudness']}


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('jsonl',type=Path)
    parser.add_argument('--max-voices',type=int,default=32);parser.add_argument('--out',type=Path)
    ns=parser.parse_args();events=[]
    for number,raw in enumerate(ns.jsonl.read_text(encoding='utf-8').splitlines(),1):
        if not raw.strip():continue
        try: events.append(json.loads(raw))
        except json.JSONDecodeError as ex:
            raise SystemExit(f'Invalid JSON at line {number}: {ex}')
    result=audit_events(events,max_voices=ns.max_voices);payload=json.dumps(result,indent=2,ensure_ascii=False)
    if ns.out: ns.out.write_text(payload+'\n',encoding='utf-8')
    else: print(payload)
    return 2 if result['errors'] else 0
if __name__=='__main__': raise SystemExit(main())
