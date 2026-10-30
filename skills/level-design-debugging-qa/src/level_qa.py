"""Independent, finite level-design validator. Schema documented in references/level-schema.md.
Requires only Python 3.10+ stdlib. Models persistent actions, pickups once, consumable keys.
The QA result is inconclusive for unmodeled physical puzzles or state-budget truncation.
"""
from __future__ import annotations
import argparse
from collections import defaultdict, deque
import json
import math
from pathlib import Path
import sys


def issue(code, **kwargs):
    return {'code': code, **kwargs}


def validate_schema(level):
    errors = []
    if not isinstance(level, dict) or not isinstance(level.get('rooms'), dict):
        return [issue('INVALID_ROOMS')]
    rooms = level['rooms']
    for field in ('start','goal'):
        if level.get(field) not in rooms:
            errors.append(issue('MISSING_'+field.upper(), room=level.get(field)))
    produced = {'abilities':set(level.get('startingAbilities', [])), 'flags':set(level.get('startingFlags', [])),
                'destroyed':set(level.get('startingDestroyed', [])), 'keys':set(level.get('startingKeys', {}))}
    for name, room in rooms.items():
        if not isinstance(room, dict) or not isinstance(room.get('exits'), list):
            errors.append(issue('INVALID_ROOM',room=name));continue
        for r,source in [('abilities','grants'),('flags','flags'),('destroyed','destroys')]:
            produced[r].update(room.get(source,[]))
        produced['keys'].update(room.get('keys',{}))
        if any(not isinstance(v,int) or isinstance(v,bool) or v<0 for v in room.get('keys',{}).values()):errors.append(issue('INVALID_KEY_COUNT',room=name))
        for i,ex in enumerate(room['exits']):
            if not isinstance(ex,dict) or ex.get('to') not in rooms:
                errors.append(issue('MISSING_TARGET', room=name,index=i,target=ex.get('to') if isinstance(ex,dict) else None));continue
            produced['flags'].update(ex.get('setFlags', []));produced['destroyed'].update(ex.get('destroy', []))
            for f in ('requiresKeys','consumesKeys'):
                if any(not isinstance(v,int) or isinstance(v,bool) or v<0 for v in ex.get(f,{}).values()):errors.append(issue('INVALID_KEY_COUNT',room=name,index=i))
    for name,room in rooms.items():
        if not isinstance(room,dict):continue
        for i,ex in enumerate(room.get('exits',[])):
            if not isinstance(ex,dict):continue
            for f,r,k in [('requiresAbilities','abilities','UNOBTAINABLE_ABILITY'),('requiresFlags','flags','UNOBTAINABLE_FLAG'),('requiresDestroyed','destroyed','UNOBTAINABLE_DESTRUCTION')]:
                for val in ex.get(f,[]):
                    if val not in produced[r]:errors.append(issue(k,room=name,index=i,resource=val))
            for f in ('requiresKeys','consumesKeys'):
                for val in ex.get(f,{}):
                    if val not in produced['keys']:errors.append(issue('UNOBTAINABLE_KEY',room=name,index=i,resource=val))
    return errors


def freeze(state):
    return (state['room'],state['checkpoint'],tuple(sorted(state['abilities'])),tuple(sorted(state['flags'])),
            tuple(sorted(state['destroyed'])),tuple(sorted(state['collected'])),tuple(sorted((k,v)for k,v in state['keys'].items() if v>0)))


def enter(level, state, room):
    out={**state,'room':room,'abilities':set(state['abilities']),'flags':set(state['flags']),
         'destroyed':set(state['destroyed']),'collected':set(state['collected']),'keys':dict(state['keys'])}
    spec=level['rooms'][room]
    if room not in out['collected']:
        out['collected'].add(room)
        out['abilities'].update(spec.get('grants',[]));out['flags'].update(spec.get('flags',[]));out['destroyed'].update(spec.get('destroys',[]))
        for key,qty in spec.get('keys',{}).items():out['keys'][key]=out['keys'].get(key,0)+qty
    if spec.get('checkpoint'):out['checkpoint']=room
    return out


def reachable_states(level,max_states=20000):
    if not isinstance(max_states,int) or max_states<1:raise ValueError('max_states must be positive')
    errors=validate_schema(level)
    if errors:return {'status':'invalid','errors':errors,'goalReachable':False,'states':0,'softlocks':[], 'witness':None}
    start=level['start']
    base={'room':start,'checkpoint':start,'abilities':set(level.get('startingAbilities',[])),'flags':set(level.get('startingFlags',[])),
          'destroyed':set(level.get('startingDestroyed',[])),'collected':set(),'keys':dict(level.get('startingKeys',{}))}
    states=[enter(level,base,start)]; paths=[[start]];visited={freeze(states[0]):0};reverse=defaultdict(list)
    truncated=False
    for i,state in enumerate(states):
        if state['room']==level['goal']:continue
        for ex in level['rooms'][state['room']]['exits']:
            if ex['to'] not in level['rooms']:continue
            if not set(ex.get('requiresAbilities',[]))<=state['abilities']:continue
            if not set(ex.get('requiresFlags',[]))<=state['flags']:continue
            if not set(ex.get('requiresDestroyed',[]))<=state['destroyed']:continue
            needed={k:max(ex.get('requiresKeys',{}).get(k,0),ex.get('consumesKeys',{}).get(k,0)) for k in set(ex.get('requiresKeys',{}))|set(ex.get('consumesKeys',{}))}
            if any(state['keys'].get(k,0)<n for k,n in needed.items()):continue
            before={**state,'flags':state['flags']|set(ex.get('setFlags',[])),'destroyed':state['destroyed']|set(ex.get('destroy',[])),'keys':dict(state['keys'])}
            for k,n in ex.get('consumesKeys',{}).items():before['keys'][k]-=n
            nxt=enter(level,before,ex['to']);f=freeze(nxt)
            if f not in visited:
                if len(states)>=max_states:truncated=True;break
                visited[f]=len(states);states.append(nxt);paths.append(paths[i]+[ex['to']]);
            reverse[visited[f]].append(i)
        if truncated:break
    winners=[i for i,s in enumerate(states)if s['room']==level['goal']]
    can=set(winners);q=deque(winners)
    while q:
        for prior in reverse[q.popleft()]:
            if prior not in can:can.add(prior);q.append(prior)
    softlocks=[] if truncated else [{'room':s['room'],'path':paths[i]} for i,s in enumerate(states) if i not in can]
    return {'status':'inconclusive' if truncated else 'solvable' if winners else 'unsolvable',
            'goalReachable':bool(winners),'states':len(states),'softlocks':softlocks,'witness':paths[winners[0]] if winners else None,
            'errors':[],'reason':'STATE_BUDGET_EXCEEDED' if truncated else None,
            'coverage':{'visitedRooms':sorted({s['room'] for s in states}), 'goalStates':len(winners)}}


def validate_jump(j):
    try:
        speed=float(j['runSpeed']);vertical=float(j['jumpSpeed']);g=float(j['gravity']);dx=float(j['deltaX']);dy=float(j.get('deltaY',0))
        if not all(map(math.isfinite,(speed,vertical,g,dx,dy))) or min(speed,vertical,g)<=0:raise ValueError()
    except (ValueError,KeyError,TypeError):return issue('INVALID_JUMP_SPEC')
    d=vertical**2-2*g*dy
    if d<0:return issue('UNREACHABLE_JUMP',fromId=j.get('from'),toId=j.get('to'),reason='HEIGHT_UNREACHABLE')
    reach=speed*(vertical+math.sqrt(d))/g
    return None if abs(dx)<=reach+1e-9 else issue('UNREACHABLE_JUMP',fromId=j.get('from'),toId=j.get('to'),maxDistance=reach)


def analyze(level,max_states=20000):
    prog=reachable_states(level,max_states)
    phys=[e for e in (validate_jump(j) for j in level.get('jumps',[])) if e is not None]
    warnings=[]
    taught=set();beats=level.get('beats',[])
    for i,b in enumerate(beats):
        if not isinstance(b,dict):warnings.append(issue('INVALID_BEAT',index=i));continue
        if not isinstance(b.get('intensity'),(int,float)) or not (0<=b['intensity']<=1):warnings.append(issue('INVALID_INTENSITY',index=i))
        if b.get('type')=='teach' and b.get('mechanic'):taught.add(b['mechanic'])
        if b.get('type') in ('test','twist') and b.get('mechanic') not in taught:warnings.append(issue('UNTAUGHT_MECHANIC',index=i))
        if b.get('type')=='climax' and (i==0 or beats[i-1].get('type')!='rest'):warnings.append(issue('NO_REST_BEFORE_CLIMAX',index=i))
    warnings += phys
    if prog['status']=='inconclusive':warnings.append(issue('STATE_BUDGET_EXCEEDED'))
    if prog['softlocks']:warnings.append(issue('SOFTLOCK_STATES',count=len(prog['softlocks'])))
    return {**prog,'issues':warnings,'validatedBy':'independent-python-state-search','physicsPolicy':'ballistic estimates only; engine-integrated physics not verified'}


def main(argv=None):
    parser=argparse.ArgumentParser(description='Offline independent level validator; no external dependencies')
    parser.add_argument('level',type=Path);parser.add_argument('--max-states',type=int,default=20000)
    parser.add_argument('--strict-softlocks',action='store_true');parser.add_argument('--out',type=Path)
    args=parser.parse_args(argv)
    result=analyze(json.loads(args.level.read_text(encoding='utf-8')),args.max_states)
    formatted=json.dumps(result,indent=2,ensure_ascii=False)
    if args.out:args.out.write_text(formatted+'\n',encoding='utf-8')
    else:print(formatted)
    if result['status']=='inconclusive':return 2
    if result['status'] in ('invalid','unsolvable') or (args.strict_softlocks and result['softlocks']) or any(x['code'] in ('UNREACHABLE_JUMP','INVALID_JUMP_SPEC') for x in result['issues']):return 1
    return 0

if __name__=='__main__':sys.exit(main())
