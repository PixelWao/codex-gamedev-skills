#!/usr/bin/env python3
"""Bounded deterministic demo: connected rooms or a carved cave. Stdlib only."""
from __future__ import annotations
import argparse
import hashlib
import json
import random
from collections import deque
from pathlib import Path

ALGORITHM = 'bounded-level-v1'
DIRECTIONS = ((1,0),(-1,0),(0,1),(0,-1))


def seeded_rng(seed, domain):
    key = hashlib.sha256(('level-v1|'+str(seed)+'|'+domain).encode()).digest()
    return random.Random(int.from_bytes(key[:16], 'big'))


def validate(width,height,min_room,max_room,attempts):
    if not isinstance(width,int) or not isinstance(height,int) or not (9<=width<=256 and 9<=height<=256 and width*height<=60000):
        raise ValueError('width and height must be 9..256 (max 60000 cells)')
    if not (3<=min_room<=max_room and max_room<=min(width,height)-2):
        raise ValueError('room sizes incompatible with map dimensions')
    if not (1<=attempts<=10000):
        raise ValueError('attempts must be 1..10000')


def carve_line(grid, ax,ay,bx,by):
    if ax != bx and ay != by:
        raise ValueError('axis-aligned corridor required')
    if ax==bx:
        for yy in range(min(ay,by),max(ay,by)+1): grid[yy][ax]='.'
    else:
        for xx in range(min(ax,bx),max(ax,bx)+1): grid[ay][xx]='.'


def touches(a,b,padding=1):
    x,y,w,h=a; xx,yy,ww,hh=b
    return not (x+w+padding<=xx or xx+ww+padding<=x or y+h+padding<=yy or yy+hh+padding<=y)


def rooms(seed, width, height, min_room=4,max_room=9,attempts=240):
    validate(width,height,min_room,max_room,attempts)
    rng=seeded_rng(seed,'rooms')
    grid=[['#']*width for _ in range(height)]
    rectangles=[]
    for _ in range(attempts):
        w=rng.randint(min_room, min(max_room,width-2))
        h=rng.randint(min_room, min(max_room,height-2))
        if width-w-1<1 or height-h-1<1: continue
        x=rng.randint(1,width-w-1); y=rng.randint(1,height-h-1)
        candidate=(x,y,w,h)
        if any(touches(candidate, old) for old in rectangles): continue
        for yy in range(y,y+h):
            for xx in range(x,x+w): grid[yy][xx]='.'
        if rectangles:
            ox,oy,ow,oh=rectangles[-1]
            prev=(ox+ow//2,oy+oh//2); now=(x+w//2,y+h//2)
            if rng.randrange(2):
                carve_line(grid, prev[0],prev[1],now[0],prev[1])
                carve_line(grid, now[0],prev[1],now[0],now[1])
            else:
                carve_line(grid,prev[0],prev[1],prev[0],now[1])
                carve_line(grid,prev[0],now[1],now[0],now[1])
        rectangles.append(candidate)
    if not rectangles: raise ValueError('no room fits: reduce room size or enlarge the map')
    x,y,w,h=rectangles[0]
    return grid, (x+w//2,y+h//2), len(rectangles)


def cave(seed,width,height,target=0.40, max_steps=None):
    if not (9<=width<=256 and 9<=height<=256 and width*height<=60000): raise ValueError('invalid cave dimensions')
    interior=(width-2)*(height-2)
    if not (0<target<=1) or not isinstance(target,float|int):
        raise ValueError('target must be in (0,1]')
    goal=max(1,round(interior*target))
    steps_limit=max_steps if max_steps is not None else interior * 80
    if not isinstance(steps_limit,int) or not 1<=steps_limit<=10000000: raise ValueError('invalid max_steps')
    rng=seeded_rng(seed,'cave')
    grid=[['#']*width for _ in range(height)]
    x,y=width//2,height//2; carved=0
    # Steps are cardinal and bounded; no diagonal out-of-bounds or infinite loop.
    for _ in range(steps_limit):
        if grid[y][x]=='#':
            grid[y][x]='.'; carved+=1
            if carved>=goal: break
        dx,dy=rng.choice(DIRECTIONS)
        x=min(width-2,max(1,x+dx)); y=min(height-2,max(1,y+dy))
    if carved<goal:
        raise RuntimeError(f'cave attempt budget exhausted: {carved}/{goal} cells; change seed/budget')
    return grid,(width//2,height//2),carved


def flood(grid,start,locked=None,has_key=False):
    height=len(grid);width=len(grid[0]);q=deque([start]);distance={start:0}
    while q:
        x,y=q.popleft()
        for dx,dy in DIRECTIONS:
            nx,ny=x+dx,y+dy
            if not (0<=nx<width and 0<=ny<height) or (nx,ny) in distance:continue
            if grid[ny][nx]=='#' or ((nx,ny)==locked and not has_key):continue
            distance[(nx,ny)]=distance[(x,y)]+1;q.append((nx,ny))
    return distance


def validate_grid(grid,start,exit_):
    if not grid or not grid[0] or any(len(r)!=len(grid[0]) for r in grid):return False
    w,h=len(grid[0]),len(grid)
    for x,y in (start,exit_):
        if not (0<=x<w and 0<=y<h and grid[y][x]!='#'):return False
    open_count=sum(ch!='#' for row in grid for ch in row)
    reachable=flood(grid,start)
    return len(reachable)==open_count and exit_ in reachable


def generate(seed='demo',width=48,height=32,mode='rooms',min_room=4,max_room=9,
             attempts=240,target=0.40,max_steps=None):
    if mode=='rooms':grid,start,count=rooms(seed,width,height,min_room,max_room,attempts)
    elif mode=='cave':grid,start,count=cave(seed,width,height,target,max_steps)
    else:raise ValueError('unsupported level mode')
    distances=flood(grid,start)
    # Select the farthest floor tile; avoid placing exit at spawn when possible.
    exit_=max(distances,key=lambda pos:(distances[pos],pos[1],pos[0]))
    if not validate_grid(grid,start,exit_):raise RuntimeError('generator internal error: disconnected map')
    n=sum(ch!='#' for row in grid for ch in row)
    return {'schema':'pcg-map-v1','kind':'level','algorithm':ALGORITHM,'seed':str(seed),
            'metadata':{'mode':mode,'width':width,'height':height,
                         'tile_legend':{'#':'solid','.':'walkable'},'movement':'cardinal 4-neighbor'},
            'grid':[''.join(row) for row in grid],
            'spawn':list(start),'exit':list(exit_),
            'metrics':{'accessible_tiles':n,'walkable_fraction':round(n/(width*height),6),
                       'shortest_path_steps':distances[exit_], 'primary_features':count}}


def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--seed',default='demo');p.add_argument('--width',type=int,default=48)
    p.add_argument('--height',type=int,default=32);p.add_argument('--mode',choices=['rooms','cave'],default='rooms')
    p.add_argument('--min-room',type=int,default=4);p.add_argument('--max-room',type=int,default=9)
    p.add_argument('--attempts',type=int,default=240);p.add_argument('--target',type=float,default=0.40)
    p.add_argument('--max-steps',type=int);p.add_argument('--output')
    a=p.parse_args(argv)
    try:r=generate(a.seed,a.width,a.height,a.mode,a.min_room,a.max_room,a.attempts,a.target,a.max_steps)
    except (ValueError,RuntimeError) as e:p.error(str(e))
    s=json.dumps(r,ensure_ascii=False,separators=(',',':'),allow_nan=False)
    if a.output:Path(a.output).write_text(s+'\n',encoding='utf-8')
    else:print(s)

if __name__=='__main__':main()
