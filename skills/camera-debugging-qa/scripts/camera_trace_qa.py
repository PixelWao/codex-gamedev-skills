#!/usr/bin/env python3
"""Analyze JSONL camera traces with deterministic, falsifiable metrics. MIT (c) 2026 Waldemar Soroka."""
import argparse
import csv
import json
import math
import sys
from pathlib import Path


def positive(v, label, allow_zero=False):
    if type(v) not in (float, int) or not math.isfinite(v) or (v < 0 if allow_zero else v <= 0):
        raise ValueError(f'{label} must be finite and {"nonnegative" if allow_zero else "positive"}')
    return float(v)


def xyz(v, name, dim):
    if not isinstance(v, dict):
        raise ValueError(f'{name} must be an object')
    keys = ('x', 'y') if dim == 2 else ('x', 'y', 'z')
    out = []
    for k in keys:
        x = v.get(k)
        if type(x) not in (float, int) or not math.isfinite(x):
            raise ValueError(f'{name}.{k} must be finite')
        out.append(float(x))
    return tuple(out)


def distance(a, b):
    return math.sqrt(sum((x-y)**2 for x,y in zip(a,b)))


def read_records(path):
    path = Path(path)
    if not path.is_file():
        raise ValueError(f'not a file: {path}')
    if path.suffix.lower() == '.json':
        obj = json.loads(path.read_text(encoding='utf-8'))
        data = obj['records'] if isinstance(obj,dict) and 'records' in obj else obj
        if not isinstance(data,list):
            raise ValueError('JSON must be records array or object with records array')
        return data
    if path.suffix.lower() == '.jsonl':
        return [json.loads(s) for s in path.read_text(encoding='utf-8').splitlines() if s.strip()]
    if path.suffix.lower() == '.csv':
        with path.open(encoding='utf-8',newline='') as f:
            rows=list(csv.DictReader(f))
        # flat CSV schema: t,target_x,target_y,camera_x,camera_y,(target_z,camera_z),teleport,occluded
        result=[]
        for row in rows:
            if not row.get('t'):
                raise ValueError('CSV missing t')
            dim=3 if 'target_z' in row and 'camera_z' in row else 2
            axes=['x','y','z'][:dim]
            r={'t':float(row['t']),'target':{a:float(row['target_'+a]) for a in axes},
               'camera':{a:float(row['camera_'+a]) for a in axes},
               'teleport':str(row.get('teleport','')).lower() in ('true','1','yes'),
               'occluded':str(row.get('occluded','')).lower() in ('true','1','yes')}
            result.append(r)
        return result
    raise ValueError('expected .json, .jsonl or .csv')


def evaluate(records, *, dim=2, max_follow_error=None, max_speed=None, max_jitter=None,
             max_occlusion_rate=None, teleport_grace=0.2, bounds=None, viewport=None, zoom=1.0):
    if dim not in (2,3): raise ValueError('dim must be 2 or 3')
    if not isinstance(records, list) or not records: raise ValueError('records cannot be empty')
    for label, val in [('max_follow_error',max_follow_error),('max_speed',max_speed),
                       ('max_jitter',max_jitter),('max_occlusion_rate',max_occlusion_rate)]:
        if val is not None: positive(val,label,allow_zero=True)
    positive(teleport_grace,'teleport_grace',allow_zero=True)
    positive(zoom,'zoom')
    if max_occlusion_rate is not None and max_occlusion_rate>1: raise ValueError('occlusion rate > 1')
    if bounds is not None and dim !=2: raise ValueError('world bounds check implemented only for 2D')
    if bounds is not None:
        if not isinstance(bounds,dict) or any(k not in bounds for k in ('minX','maxX','minY','maxY')): raise ValueError('bounds missing fields')
        for k in ('minX','maxX','minY','maxY'):
            x=bounds[k]
            if type(x) not in (int,float) or not math.isfinite(x):raise ValueError('invalid bounds')
        if bounds['minX']>bounds['maxX'] or bounds['minY']>bounds['maxY']:raise ValueError('invalid bounds')
        if not isinstance(viewport,dict) or not all(k in viewport for k in ('width','height')):raise ValueError('viewport required')
        positive(viewport['width'],'viewport width');positive(viewport['height'],'viewport height')

    errors=[];bad_frames=[];max_err=0.0;max_v=0.0;max_dv=0.0;occluded=0;bounds_violation=0
    last_t=None;last_camera=None;last_velocity=None;warm_until=-float('inf');count_velocity=0
    for i,r in enumerate(records):
        if not isinstance(r,dict):raise ValueError(f'record {i} is not an object')
        t=r.get('t');
        if type(t) not in (int,float) or not math.isfinite(t):raise ValueError(f'record {i}: nonfinite t')
        if last_t is not None and t <= last_t:raise ValueError(f'record {i}: timestamps not strictly increasing')
        target=xyz(r.get('target'),f'record {i}.target',dim)
        camera=xyz(r.get('camera'),f'record {i}.camera',dim)
        if r.get('teleport',False): warm_until=t+teleport_grace;last_velocity=None
        if r.get('occluded',False):occluded+=1
        if t>=warm_until:
            err=distance(target,camera);max_err=max(max_err,err);errors.append(err)
            if max_follow_error is not None and err>max_follow_error:bad_frames.append({'frame':i,'kind':'follow_error','value':round(err,6)})
        if last_t is not None and last_camera is not None and t>=warm_until:
            dt=t-last_t
            v=tuple((camera[j]-last_camera[j])/dt for j in range(dim))
            speed=math.sqrt(sum(x*x for x in v));max_v=max(max_v,speed);count_velocity+=1
            if max_speed is not None and speed>max_speed:bad_frames.append({'frame':i,'kind':'speed','value':round(speed,6)})
            if last_velocity is not None:
                # velocity jump norm, not true jerk; labels deliberately separate.
                jump=distance(v,last_velocity);max_dv=max(max_dv,jump)
                if max_jitter is not None and jump>max_jitter:bad_frames.append({'frame':i,'kind':'velocity_jump','value':round(jump,6)})
            last_velocity=v
        if bounds is not None:
            hx=viewport['width']/(2*zoom);hy=viewport['height']/(2*zoom)
            for axis, half, lo, hi in [(0,hx,bounds['minX'],bounds['maxX']),(1,hy,bounds['minY'],bounds['maxY'])]:
                if hi-lo <= 2*half:
                    # Small maps legitimately letterbox; camera must remain centered on that axis.
                    valid=abs(camera[axis]-(hi+lo)/2)<1e-4
                else:valid=(camera[axis]>=lo+half-1e-4 and camera[axis]<=hi-half+1e-4)
                if not valid:bounds_violation+=1;bad_frames.append({'frame':i,'kind':'bounds','axis':axis})
        last_t=t;last_camera=camera
    occ_rate=occluded/len(records)
    if max_occlusion_rate is not None and occ_rate>max_occlusion_rate:bad_frames.append({'kind':'occlusion_rate','value':round(occ_rate,6)})
    ordered=sorted(errors)
    def percentile(p):
        if not ordered:return None
        x=(len(ordered)-1)*p;a=int(x);b=min(a+1,len(ordered)-1);return round(ordered[a]+(ordered[b]-ordered[a])*(x-a),6)
    report={'schema':'camera-qa/1','dimension':dim,'frames':len(records),'measured_frames':len(errors),
            'duration_seconds':round(float(records[-1]['t']-records[0]['t']),6),
            'follow_error':{'max':round(max_err,6),'p50':percentile(.5),'p95':percentile(.95)},
            'max_camera_speed':round(max_v,6),'max_velocity_jump':round(max_dv,6),
            'occlusion_rate':round(occ_rate,6),'bounds_violations':bounds_violation,
            'failures':bad_frames[:100], 'failure_count':len(bad_frames),'passed':not bad_frames,
            'notes':['velocity_jump is frame-to-frame change in speed vector, not physical jerk',
                     'follow error is only meaningful for a camera intended to center on its target',
                     'thresholds must be chosen for each camera design; no global defaults']}
    return report


def main(argv=None):
    ap=argparse.ArgumentParser(description='Camera trace QA. No external dependencies.')
    ap.add_argument('trace');ap.add_argument('--dimension',type=int,choices=[2,3],default=2)
    ap.add_argument('--max-follow-error',type=float);ap.add_argument('--max-speed',type=float)
    ap.add_argument('--max-velocity-jump',type=float);ap.add_argument('--max-occlusion-rate',type=float)
    ap.add_argument('--teleport-grace',type=float,default=.2);ap.add_argument('--bounds-json');ap.add_argument('--viewport-json')
    ap.add_argument('--zoom',type=float,default=1);ap.add_argument('--output')
    args=ap.parse_args(argv)
    try:
        rep=evaluate(read_records(args.trace),dim=args.dimension,max_follow_error=args.max_follow_error,
            max_speed=args.max_speed,max_jitter=args.max_velocity_jump,max_occlusion_rate=args.max_occlusion_rate,
            teleport_grace=args.teleport_grace,bounds=json.loads(args.bounds_json) if args.bounds_json else None,
            viewport=json.loads(args.viewport_json) if args.viewport_json else None,zoom=args.zoom)
        out=json.dumps(rep,indent=2,ensure_ascii=False,allow_nan=False)+'\n'
        if args.output:Path(args.output).write_text(out,encoding='utf-8')
        else:print(out,end='')
        return 0 if rep['passed'] else 2
    except (ValueError,TypeError,KeyError,json.JSONDecodeError) as e:
        print(f'camera QA input error: {e}',file=sys.stderr);return 3

if __name__=='__main__':sys.exit(main())
