#!/usr/bin/env python3
"""Independent navigation audit. MIT (c) 2026 Waldemar Soroka.
Usage: python scripts/navigation_qa.py --routes examples/routes.json --trace examples/trace.jsonl --output qa.json
"""
import argparse, csv, heapq, json, math
from collections import defaultdict, deque
from pathlib import Path


def number(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x)


def position(p):
    if not isinstance(p, (list, tuple)) or len(p) != 2 or any(not isinstance(v, int) or isinstance(v, bool) for v in p):
        raise ValueError('coordinate must be integer [x,y]')
    return tuple(p)


def analyze_route(data, epsilon=1e-6):
    problems = []
    def add(msg): problems.append(msg)
    w, h = data.get('width'), data.get('height')
    if not isinstance(w, int) or isinstance(w, bool) or not isinstance(h, int) or isinstance(h, bool) or not 0 < w <= 4096 or not 0 < h <= 4096:
        raise ValueError('invalid width or height')
    walls = {position(c) for c in data.get('walls', [])}
    for p in walls:
        if not (0 <= p[0] < w and 0 <= p[1] < h):
            raise ValueError('wall outside grid')
    costs = {}
    for cell in data.get('costs', []):
        p, c = position(cell['cell']), cell['cost']
        if not number(c) or c <= 0: raise ValueError('invalid positive terrain cost')
        costs[p] = c
    links = {}
    for edge in data.get('links', []):
        a, b = position(edge['from']), position(edge['to'])
        c = edge['cost']
        if not number(c) or c <= 0: raise ValueError('invalid portal cost')
        links[(a, b)] = c
    diagonal = data.get('diagonal', False)
    if not isinstance(diagonal, bool): raise ValueError('invalid diagonal flag')
    start, goal = position(data['start']), position(data['goal'])
    def traversable(p): return 0 <= p[0] < w and 0 <= p[1] < h and p not in walls
    def neighbors(a):
        for dx, dy in ((1,0), (-1,0),(0,1),(0,-1), (1,1),(-1,1),(1,-1),(-1,-1)) if diagonal else ((1,0),(-1,0),(0,1),(0,-1)):
            b = (a[0]+dx, a[1]+dy)
            if not traversable(b): continue
            if dx and dy and (not traversable((a[0]+dx,a[1])) or not traversable((a[0],a[1]+dy))): continue
            yield b, costs.get(b,1.0) * (math.sqrt(2) if dx and dy else 1)
        for (aa,b), c in links.items():
            if aa == a and traversable(b): yield b,c
    # Independent reference Dijkstra for small test grids. Not a benchmark of engine navmesh.
    optimal = None
    if traversable(start) and traversable(goal):
        q = [(0, start)]; dist = {start: 0}
        while q:
            d, a = heapq.heappop(q)
            if d > dist[a]: continue
            if a == goal: optimal = d; break
            for b, c in neighbors(a):
                nd = d + c
                if nd < dist.get(b, math.inf): dist[b]=nd;heapq.heappush(q,(nd,b))
    raw = data.get('path')
    if raw is None:
        if optimal is not None: add('missing_path_to_reachable_goal')
        return dict(ok=not problems, problems=problems, optimalCost=optimal, pathCost=None)
    if not isinstance(raw,list): raise ValueError('path must be list or null')
    path = [position(p) for p in raw]
    if not path: add('empty_path')
    if path and path[0] != start: add('wrong_start')
    if path and path[-1] != goal: add('wrong_goal')
    total = 0
    for p in path:
        if not traversable(p):add('blocked_or_out_of_bounds_path_node')
    for a,b in zip(path,path[1:]):
        match = [c for n,c in neighbors(a) if n==b] if traversable(a) else []
        if not match: add('invalid_path_edge')
        else: total += min(match)
    if optimal is None: add('path_but_goal_unreachable')
    elif total > optimal+epsilon: add('nonoptimal_path')
    reported=data.get('reportedCost')
    if reported is not None and (not number(reported) or abs(reported-total)>epsilon):add('incorrect_reported_cost')
    return dict(ok=not problems, problems=sorted(set(problems)), optimalCost=optimal, pathCost=total)


def read_trace(path):
    file = Path(path)
    if file.suffix.lower() == '.csv':
        with file.open(encoding='utf-8-sig',newline='') as f:
            for r in csv.DictReader(f): yield r
    elif file.suffix.lower() == '.json':
        data=json.loads(file.read_text(encoding='utf-8'))
        if not isinstance(data,list): raise ValueError('trace JSON must be a list')
        yield from data
    else:
        for line in file.read_text(encoding='utf-8').splitlines():
            if line.strip(): yield json.loads(line)


def analyze_trace(rows, *, stuck_seconds=2., movement_epsilon=.05, goal_tolerance=.5, max_speed=25.):
    agents=defaultdict(list);problems=[];count=0
    for r in rows:
        count+=1
        if not isinstance(r,dict):raise ValueError('trace entry not object')
        try:
            name=str(r['agent']); t=float(r['t']);x=float(r['x']);z=float(r['z']);gx=float(r['goalX']);gz=float(r['goalZ'])
        except (TypeError, ValueError, KeyError) as e: raise ValueError('invalid trace fields') from e
        if not all(map(math.isfinite,(t,x,z,gx,gz))):raise ValueError('nonfinite trace data')
        state = str(r.get('state','moving'))
        revision=int(r.get('revision',0)); path_revision=int(r.get('pathRevision',revision))
        if path_revision>revision:problems.append(dict(agent=name,issue='future_route_revision',t=t))
        if state=='moving' and path_revision<revision:problems.append(dict(agent=name,issue='stale_route_in_use',t=t))
        agents[name].append((t,x,z,gx,gz,state))
    for name,points in agents.items():
        points.sort(key=lambda a:a[0]);window=deque()
        for i,p in enumerate(points):
            t,x,z,gx,gz,state=p
            if i:
                prev=points[i-1];dt=t-prev[0]
                if dt<=0:problems.append(dict(agent=name,issue='duplicate_or_reversed_time',t=t))
                elif math.hypot(x-prev[1],z-prev[2])/dt>max_speed:problems.append(dict(agent=name,issue='movement_speed_spike',t=t))
            if state!='moving' or math.hypot(x-gx,z-gz)<=goal_tolerance:window.clear();continue
            window.append(p)
            while window and t-window[0][0]>stuck_seconds:window.popleft()
            if window and t-window[0][0]>=stuck_seconds-1e-9:
                travel=sum(math.hypot(b[1]-a[1],b[2]-a[2]) for a,b in zip(window,list(window)[1:]))
                if travel<movement_epsilon:
                    problems.append(dict(agent=name,issue='stuck',t=t));window.clear()
    return dict(ok=not problems,events=count,agents=len(agents),issues=problems)


def main(argv=None):
    parser=argparse.ArgumentParser()
    parser.add_argument('--routes',type=Path)
    parser.add_argument('--trace',type=Path)
    parser.add_argument('--output',type=Path)
    args=parser.parse_args(argv)
    if not (args.routes or args.trace):parser.error('supply --routes or --trace')
    report={'schemaVersion':1}
    try:
        if args.routes:
            source=json.loads(args.routes.read_text(encoding='utf-8'))
            routes=source if isinstance(source,list) else [source]
            report['routes']=[analyze_route(route) for route in routes]
        if args.trace:report['trace']=analyze_trace(read_trace(args.trace))
    except (ValueError, KeyError, TypeError, OSError, json.JSONDecodeError) as error:
        report['error']=str(error)
    report['ok']='error' not in report and all(item['ok'] for item in report.get('routes',[])) and report.get('trace',{'ok':True})['ok']
    encoded=json.dumps(report,indent=2,ensure_ascii=False,allow_nan=False)
    if args.output:args.output.write_text(encoded+'\n',encoding='utf-8')
    print(encoded)
    return 0 if report['ok'] else 1

if __name__=='__main__':raise SystemExit(main())
