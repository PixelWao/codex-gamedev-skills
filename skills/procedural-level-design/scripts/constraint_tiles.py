#!/usr/bin/env python3
"""Bounded adjacency constraint solver (simple-tiled CSP, not overlapping-image WFC)."""
from __future__ import annotations
import argparse
import hashlib
import json
import random
from pathlib import Path

DIRECTIONS={'N':(0,-1,'S'),'E':(1,0,'W'),'S':(0,1,'N'),'W':(-1,0,'E')}
PORTS={'empty':'', 'ew':'EW', 'ns':'NS', 'ne':'NE', 'es':'ES', 'sw':'SW','wn':'WN',
       'cross':'NESW', 'n':'N','e':'E','s':'S','w':'W'}

class Contradiction(Exception):pass
class BudgetExhausted(Exception):pass


def _rng(seed):
    h=hashlib.sha256(('tiles-v1|'+str(seed)).encode()).digest()
    return random.Random(int.from_bytes(h[:16],'big'))


def check_layout(rows):
    if not rows or not rows[0] or any(len(row)!=len(rows[0]) for row in rows):return False
    w,h=len(rows[0]),len(rows)
    for y,row in enumerate(rows):
        for x,tile in enumerate(row):
            if tile not in PORTS:return False
            for direction,(dx,dy,opposite) in DIRECTIONS.items():
                nx,ny=x+dx,y+dy
                has_port=direction in PORTS[tile]
                if 0<=nx<w and 0<=ny<h:
                    if has_port!=(opposite in PORTS[rows[ny][nx]]):return False
                elif has_port:return False
    return True


def solve(width=5,height=5,seed='demo',fixed=None,max_nodes=20000):
    if not (1<=width<=20 and 1<=height<=20 and width*height<=200):raise ValueError('invalid constraints grid size')
    if not (1<=max_nodes<=200000):raise ValueError('invalid search node budget')
    fixed=fixed or {}
    if not isinstance(fixed,dict):raise ValueError('fixed must be a mapping of "x,y" to tile type')
    for k,v in fixed.items():
        try:x,y=(int(a) for a in k.split(','))
        except (ValueError,AttributeError) as e:raise ValueError('invalid fixed coordinate') from e
        if not (0<=x<width and 0<=y<height and v in PORTS):raise ValueError('invalid fixed cell')
    rng=_rng(seed)
    domains={(x,y):({fixed[f'{x},{y}']} if f'{x},{y}' in fixed else set(PORTS))
             for y in range(height) for x in range(width)}
    nodes=0

    def propagate(ds):
        changed=True
        while changed:
            changed=False
            for (x,y),choices in ds.items():
                rejected=[]
                for t in choices:
                    valid=True
                    for d,(dx,dy,op) in DIRECTIONS.items():
                        nx,ny=x+dx,y+dy
                        if not (0<=nx<width and 0<=ny<height):
                            if d in PORTS[t]:valid=False;break
                        elif not any((d in PORTS[t])==(op in PORTS[other]) for other in ds[(nx,ny)]):
                            valid=False;break
                    if not valid:rejected.append(t)
                if rejected:
                    choices.difference_update(rejected);changed=True
                if not choices:raise Contradiction()

    def visit(ds):
        nonlocal nodes
        nodes+=1
        if nodes>max_nodes:raise BudgetExhausted()
        propagate(ds)
        unresolved=[key for key,choices in ds.items() if len(choices)>1]
        if not unresolved:return ds
        size=min(len(ds[k]) for k in unresolved)
        candidates=[k for k in unresolved if len(ds[k])==size]
        key=rng.choice(candidates)
        options=sorted(ds[key])
        rng.shuffle(options)
        for choice in options:
            nxt={k:set(v) for k,v in ds.items()}
            nxt[key]={choice}
            try:return visit(nxt)
            except Contradiction:continue
        raise Contradiction()

    try:result=visit(domains)
    except Contradiction as e:raise ValueError('unsatisfiable adjacency constraints') from e
    except BudgetExhausted as e:raise RuntimeError('search budget exhausted') from e
    layout=[[next(iter(result[(x,y)])) for x in range(width)] for y in range(height)]
    assert check_layout(layout)
    return {'schema':'pcg-constraint-tiles-v1','algorithm':'adjacency-csp-v1',
            'seed':str(seed),'width':width,'height':height,'tiles':layout,
            'metrics':{'search_nodes':nodes,'fixed_count':len(fixed)},
            'warning':'Local adjacency validity only; global connectivity/gameplay NOT guaranteed.'}


def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--seed',default='demo');p.add_argument('--width',type=int,default=5)
    p.add_argument('--height',type=int,default=5);p.add_argument('--fixed',default='{}',help='JSON dict, e.g. {"1,1":"ew"}')
    p.add_argument('--max-nodes',type=int,default=20000);p.add_argument('--output')
    a=p.parse_args(argv)
    try:r=solve(a.width,a.height,a.seed,json.loads(a.fixed),a.max_nodes)
    except (ValueError,RuntimeError,json.JSONDecodeError) as e:p.error(str(e))
    s=json.dumps(r,separators=(',',':'))
    if a.output:Path(a.output).write_text(s+'\n',encoding='utf-8')
    else:print(s)

if __name__=='__main__':main()
