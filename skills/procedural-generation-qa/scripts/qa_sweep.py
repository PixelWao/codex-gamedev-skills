#!/usr/bin/env python3
"""Audit procedural JSON maps or run multi-seed generator commands without a shell.

This validates discrete grids and simplified cardinal movement, not continuous
physics, player abilities, or real-world navigability.
"""
from __future__ import annotations
import argparse
import csv
import hashlib
import json
import math
import statistics
import subprocess
import sys
import tempfile
from collections import Counter, deque
from pathlib import Path

MAX_CELLS=250000
MAX_INPUT_BYTES=25_000_000
VECTORS=((1,0),(-1,0),(0,1),(0,-1))
WORLD_TILES=set('WSDGFHMTI')
LEVEL_TILES=set('#.SKDE')


def read_map(path):
    p=Path(path)
    if p.stat().st_size>MAX_INPUT_BYTES:raise ValueError('input exceeds size limit')
    with p.open('r',encoding='utf-8') as f:
        return json.load(f, parse_constant=lambda x: (_ for _ in ()).throw(ValueError('non-finite JSON constant: '+x)))


def grid_check(data):
    if not isinstance(data,dict) or data.get('schema')!='pcg-map-v1':
        raise ValueError('expected pcg-map-v1 JSON object')
    kind=data.get('kind');grid=data.get('grid')
    if kind not in ('world','level'):raise ValueError('kind must be world or level')
    if not isinstance(grid,list) or not grid or not isinstance(grid[0],str):raise ValueError('grid must be nonempty list of strings')
    width=len(grid[0]);height=len(grid)
    if not width or width*height>MAX_CELLS or any(not isinstance(r,str) or len(r)!=width for r in grid):
        raise ValueError('ragged, empty or oversized grid')
    allowed=WORLD_TILES if kind=='world' else LEVEL_TILES
    if any(ch not in allowed for row in grid for ch in row):raise ValueError('unknown tile symbol')
    meta=data.get('metadata',{})
    if not isinstance(meta,dict) or meta.get('width')!=width or meta.get('height')!=height:
        raise ValueError('metadata width/height mismatch')
    if kind=='world':
        for field in ('heightfield','moisture'):
            matrix=data.get(field)
            if not isinstance(matrix,list) or len(matrix)!=height:
                raise ValueError(f'{field} matrix missing or incorrect height')
            if any(not isinstance(r,list) or len(r)!=width or any(type(v) not in (int,float) or not math.isfinite(v) or not 0<=v<=1 for v in r) for r in matrix):
                raise ValueError(f'{field} has invalid values')
    return kind,grid,width,height


def _position(data,label,width,height,grid):
    pos=data.get(label)
    if (not isinstance(pos,list) or len(pos)!=2 or any(type(v)!=int for v in pos)):
        raise ValueError(f'{label} coordinate missing or invalid')
    x,y=pos
    if not (0<=x<width and 0<=y<height):raise ValueError(f'{label} outside grid')
    if grid[y][x]=='#':raise ValueError(f'{label} on wall')
    return (x,y)


def level_reachability(grid, start, exit_):
    w,h=len(grid[0]),len(grid)
    has_key=any('K' in row for row in grid)
    has_door=any('D' in row for row in grid)
    if has_door and not has_key:return False,0,0,'door without key'
    initial_key=(grid[start[1]][start[0]]=='K')
    q=deque([(start[0],start[1],initial_key,0)])
    seen={(start[0],start[1],initial_key)}
    floor={(x,y) for y in range(h) for x in range(w) if grid[y][x]!='#'}
    accessible=set()
    shortest=None
    while q:
        x,y,key,d=q.popleft();accessible.add((x,y))
        if (x,y)==exit_ and shortest is None:shortest=d
        for dx,dy in VECTORS:
            nx,ny=x+dx,y+dy
            if not (0<=nx<w and 0<=ny<h):continue
            c=grid[ny][nx]
            if c=='#' or (c=='D' and not key):continue
            nkey=key or c=='K'
            state=(nx,ny,nkey)
            if state not in seen:
                seen.add(state);q.append((nx,ny,nkey,d+1))
    if shortest is None:return False,len(accessible),0,'exit unreachable under key-door rules'
    if accessible != floor:return False,len(accessible),shortest,'unreachable traversable tiles'
    return True,len(accessible),shortest,None


def evaluate(data, min_path=0):
    kind,grid,w,h=grid_check(data)
    cells=w*h
    charcounts=Counter(''.join(grid))
    findings=[]
    result={'kind':kind,'seed':str(data.get('seed','')),'size':[w,h],
            'tile_histogram':dict(sorted(charcounts.items())),
            'coverage':round(sum(v for k,v in charcounts.items() if k not in ('W','S','#'))/cells,6),
            'success':True,'errors':findings}
    if kind=='level':
        spawn=_position(data,'spawn',w,h,grid)
        end=_position(data,'exit',w,h,grid)
        ok,reached,length,reason=level_reachability(grid,spawn,end)
        result['reachable_tiles']=reached;result['path_steps']=length
        if not ok:findings.append(reason)
        if length<min_path:findings.append(f'path {length} below configured minimum {min_path}')
    result['success']=len(findings)==0
    return result


def digest(data):
    kind,grid,_,_=grid_check(data)
    core={'kind':kind,'grid':grid}
    if kind=='level':core.update(spawn=data.get('spawn'),exit=data.get('exit'))
    else:core.update(heightfield=data.get('heightfield'),moisture=data.get('moisture'))
    serialized=json.dumps(core,sort_keys=True,separators=(',',':'),allow_nan=False)
    return hashlib.sha256(serialized.encode()).hexdigest()


def percentile(numbers,pct):
    if not numbers:return None
    ordered=sorted(numbers);point=(len(ordered)-1)*pct/100
    lower=math.floor(point);upper=math.ceil(point)
    return ordered[lower]*(upper-point)+ordered[upper]*(point-lower) if upper!=lower else ordered[lower]


def audit(items,min_path=0,max_fail_rate=0.0,max_duplicate_rate=1.0):
    rows=[];sig_counts=Counter()
    for seed,thing in items:
        try:
            obj=read_map(thing) if isinstance(thing,(str,Path)) else thing
            if isinstance(obj,dict) and 'error' in obj:raise ValueError(str(obj['error']))
            record=evaluate(obj,min_path)
            sig=digest(obj)
            record['fingerprint']=sig
            sig_counts[sig]+=1
        except (OSError,ValueError,TypeError,KeyError,json.JSONDecodeError) as e:
            record={'seed':str(seed),'success':False,'errors':[str(e)]}
        rows.append(record)
    size=len(rows);fails=sum(not r['success'] for r in rows)
    good_hash=sum(sig_counts.values())
    dupe=sum(c-1 for c in sig_counts.values())
    fail_rate=(fails/size if size else 1.0)
    dupe_rate=(dupe/good_hash if good_hash else 0.)
    paths=[r['path_steps'] for r in rows if r.get('success') and 'path_steps' in r]
    summary={'schema':'pcg-qa-report-v1','count':size,'passed':size-fails,'failed':fails,
             'failure_rate':round(fail_rate,6),'unique_fingerprints':len(sig_counts),
             'duplicate_rate':round(dupe_rate,6),
             'p50_path_steps':percentile(paths,50),'p95_path_steps':percentile(paths,95),
             'verdict':('PASS' if size>0 and fail_rate<=max_fail_rate and dupe_rate<=max_duplicate_rate else 'FAIL'),
             'thresholds':{'max_failure_rate':max_fail_rate,'max_duplicate_rate':max_duplicate_rate,'min_path':min_path},
             'cases':rows}
    return summary


def run_generator(command,count,start,timeout,output_dir):
    if not command:raise ValueError('empty command')
    if '{seed}' not in ' '.join(command) or '{output}' not in ' '.join(command):
        raise ValueError('--exec command must contain {seed} and {output} placeholders')
    rows=[]
    for seed in range(start,start+count):
        out=output_dir/f'map_{seed}.json'
        cmd=[arg.replace('{seed}',str(seed)).replace('{output}',str(out)) for arg in command]
        try:
            proc=subprocess.run(cmd,capture_output=True,text=True,timeout=timeout,check=False)
            if proc.returncode!=0:
                rows.append((seed,{'error':f'generator exit {proc.returncode}: {proc.stderr[-400:] or proc.stdout[-400:]}' }))
            elif not out.exists():rows.append((seed,{'error':'generator did not create output file'}))
            else:rows.append((seed,out))
        except (OSError,subprocess.TimeoutExpired) as e:
            rows.append((seed,{'error':f'generator launch failed or timed out: {e}'}))
    return rows


def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__)
    source=p.add_mutually_exclusive_group(required=True)
    source.add_argument('--input-dir',type=Path,help='folder containing map JSON files')
    source.add_argument('--exec',nargs=argparse.REMAINDER,help='argv; use {seed} and {output} tokens; MUST be last')
    p.add_argument('--count',type=int,default=20);p.add_argument('--start-seed',type=int,default=0)
    p.add_argument('--timeout',type=float,default=10.)
    p.add_argument('--min-path',type=int,default=0)
    p.add_argument('--max-failure-rate',type=float,default=0.)
    p.add_argument('--max-duplicate-rate',type=float,default=1.)
    p.add_argument('--report',type=Path,default=Path('pcg-qa-report.json'))
    p.add_argument('--csv',type=Path,help='optional per-seed CSV')
    a=p.parse_args(argv)
    if not (1<=a.count<=500 and 0<a.timeout<=300 and a.min_path>=0 and
            0<=a.max_failure_rate<=1 and 0<=a.max_duplicate_rate<=1):p.error('invalid limits')
    if a.exec is not None:
        with tempfile.TemporaryDirectory(prefix='pcg-qa-') as folder:
            try:items=run_generator(a.exec,a.count,a.start_seed,a.timeout,Path(folder))
            except ValueError as e:p.error(str(e))
            result=audit(items,a.min_path,a.max_failure_rate,a.max_duplicate_rate)
    else:
        if not a.input_dir.is_dir():p.error('input directory not found')
        paths=sorted(a.input_dir.glob('*.json'))[:500]
        if not paths:p.error('input directory has no JSON files')
        result=audit([(str(path.name),path) for path in paths],a.min_path,a.max_failure_rate,a.max_duplicate_rate)
    a.report.parent.mkdir(parents=True,exist_ok=True)
    a.report.write_text(json.dumps(result,indent=2,ensure_ascii=False,allow_nan=False)+'\n',encoding='utf-8')
    if a.csv:
        a.csv.parent.mkdir(parents=True,exist_ok=True)
        with a.csv.open('w',newline='',encoding='utf-8') as f:
            out=csv.DictWriter(f,fieldnames=['seed','success','path_steps','coverage','fingerprint','errors'])
            out.writeheader()
            for r in result['cases']:
                out.writerow({k:('; '.join(r.get(k,[])) if k=='errors' else r.get(k,'')) for k in out.fieldnames})
    print(f"{result['verdict']}: {result['passed']}/{result['count']} passed; duplicates={result['duplicate_rate']:.3f}; report={a.report}")
    return 0 if result['verdict']=='PASS' else 2

if __name__=='__main__':sys.exit(main())
