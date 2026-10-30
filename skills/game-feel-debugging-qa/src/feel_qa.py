#!/usr/bin/env python3
"""MIT Copyright (c) 2026 Waldemar Soroka. Deterministic game-feel trace audit."""
import argparse
import csv
import json
import math
from collections import deque
from pathlib import Path


def load_trace(path):
    path=Path(path)
    if path.suffix=='.json':
        x=json.loads(path.read_text(encoding='utf-8'))
        values=x['events'] if isinstance(x,dict) else x
    elif path.suffix=='.csv':
        with path.open(encoding='utf-8',newline='') as f:values=list(csv.DictReader(f))
        for e in values:
            if 'channels' in e and isinstance(e['channels'],str):e['channels']=[x.strip() for x in e['channels'].split('|') if x.strip()]
    else:
        values=[json.loads(x) for x in path.read_text(encoding='utf-8').splitlines() if x.strip()]
    if not isinstance(values,list) or any(not isinstance(x,dict) for x in values):raise ValueError('expected list of event objects')
    return values


def audit(events, max_events_100ms=32, max_particles_100ms=120, max_hitstop_ms=250):
    if min(max_events_100ms,max_particles_100ms,max_hitstop_ms)<0:raise ValueError('invalid limits')
    issues=[];counts={};active={};accepted=set();recent=deque();particle_recent=deque();last=-math.inf
    def add(code,severity,index,detail=''):issues.append({'code':code,'severity':severity,'index':index,'detail':str(detail)})
    for i,e in enumerate(events):
        t=e.get('type');counts[t]=counts.get(t,0)+1
        try:ms=float(e.get('atMs',e.get('tsMs')))
        except (TypeError,ValueError):add('invalid_timestamp','error',i);continue
        if not math.isfinite(ms):add('invalid_timestamp','error',i);continue
        if ms<last:add('out_of_order','error',i)
        last=max(last,ms)
        eid=e.get('eventId')
        if t in {'hitstop_start','hitstop_end','hitstop_extended','feedback_accepted'} and not isinstance(eid,str):add('invalid_event_id','error',i);continue
        if t=='feedback_accepted':
            if eid in accepted:add('duplicate_accepted','error',i,eid)
            accepted.add(eid)
            channels=e.get('channels',[])
            if not isinstance(channels,list):add('invalid_channels','error',i);channels=[]
            if e.get('reducedMotion') and set(channels)&{'shake','flash','particles'}:add('reduced_motion_violation','error',i)
            if e.get('allowFlashes') is False and 'flash' in channels:add('flashes_disabled_violation','error',i)
            while recent and ms-recent[0]>=100:recent.popleft()
            recent.append(ms)
            if len(recent)>max_events_100ms:add('event_budget_exceeded','warning',i)
            try:particles=int(e.get('particles',0))
            except (TypeError,ValueError):particles=-1
            if particles<0:add('bad_particle_count','error',i);particles=0
            while particle_recent and ms-particle_recent[0][0]>=100:particle_recent.popleft()
            particle_recent.append((ms,particles))
            if sum(n for _,n in particle_recent)>max_particles_100ms:add('particle_budget_exceeded','warning',i)
        elif t=='hitstop_start':
            if eid in active:add('hitstop_double_start','error',i,eid)
            try:end=float(e['untilMs'])
            except (KeyError,TypeError,ValueError):add('invalid_deadline','error',i);continue
            if not math.isfinite(end) or end<ms:add('invalid_deadline','error',i);continue
            if end-ms>max_hitstop_ms:add('hitstop_excessive','warning',i)
            active[eid]=end
        elif t=='hitstop_extended':
            if eid not in active:add('hitstop_extend_without_start','error',i,eid)
            else:
                try:active[eid]=max(active[eid],float(e['untilMs']))
                except (KeyError,TypeError,ValueError):add('invalid_deadline','error',i)
        elif t=='hitstop_end':
            if eid not in active:add('hitstop_orphan_end','error',i,eid)
            else:del active[eid]
        elif t=='camera_delta':
            for k in ('x','y','roll'):
                try:okay=math.isfinite(float(e[k]))
                except (ValueError,TypeError,KeyError):okay=False
                if not okay:add('camera_nonfinite','error',i,k)
        elif t=='vfx_batch':
            try:n=int(e['active']);cap=int(e['capacity'])
            except (TypeError,ValueError,KeyError):add('invalid_vfx_count','error',i);continue
            if n<0 or cap<0:add('invalid_vfx_count','error',i)
            elif n>cap:add('vfx_capacity_exceeded','error',i)
        elif t not in ('feedback_rejected','setting_changed'):add('unknown_type','warning',i,t)
    for eid in active:add('hitstop_not_released','error',len(events),eid)
    return {'ok':not any(x['severity']=='error' for x in issues),'events':len(events),'errors':sum(x['severity']=='error' for x in issues),'warnings':sum(x['severity']=='warning' for x in issues),'counts':counts,'issues':issues}


def main():
    p=argparse.ArgumentParser(description='Audit game-feel JSON/JSONL/CSV traces')
    p.add_argument('file',type=Path);p.add_argument('--out',type=Path)
    p.add_argument('--max-events-100ms',type=int,default=32);p.add_argument('--max-particles-100ms',type=int,default=120);p.add_argument('--max-hitstop-ms',type=float,default=250)
    a=p.parse_args();r=audit(load_trace(a.file),a.max_events_100ms,a.max_particles_100ms,a.max_hitstop_ms)
    data=json.dumps(r,indent=2,ensure_ascii=False);print(data)
    if a.out:a.out.write_text(data+'\n',encoding='utf-8')
    return 0 if r['ok'] else 1

if __name__=='__main__':raise SystemExit(main())
