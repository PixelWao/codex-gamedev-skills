"""Validated E2E game scenario models. MIT © 2026 Waldemar Soroka."""
import json
from pathlib import Path

SUPPORTED = {'goto', 'click', 'key_down', 'key_up', 'wait', 'assert_text', 'assert_js', 'screenshot', 'tap', 'mouse_move'}

def load_scenario(path):
    scenario = json.loads(Path(path).read_text(encoding='utf-8'))
    return validate_scenario(scenario)

def validate_scenario(scenario):
    if not isinstance(scenario, dict):
        raise ValueError('scenario must be an object')
    steps = scenario.get('steps')
    if not isinstance(steps, list) or not steps or len(steps) > 500:
        raise ValueError('steps must be a nonempty list <=500')
    dims = scenario.get('viewport', {'width': 1280, 'height': 720})
    if not isinstance(dims,dict) or not all(isinstance(dims.get(k),int) and not isinstance(dims[k],bool) and 100 <= dims[k] <= 8000 for k in ('width','height')):
        raise ValueError('invalid viewport')
    for n, step in enumerate(steps):
        if not isinstance(step,dict) or step.get('action') not in SUPPORTED:
            raise ValueError(f'invalid action step {n}')
        action=step['action']
        if action in ('click','tap','assert_text') and not isinstance(step.get('selector'),str):
            raise ValueError(f'{action} needs selector at step {n}')
        if action in ('key_down','key_up') and not isinstance(step.get('key'),str):
            raise ValueError('key action missing key')
        if action in ('goto',) and step.get('path','/').startswith(('http:','https:','//')):
            raise ValueError('goto supports only same-origin relative paths')
        if action == 'assert_js' and not isinstance(step.get('expression'),str):
            raise ValueError('assert_js needs JS expression; use only trusted local scenarios')
        if action == 'wait':
            ms=step.get('ms',0)
            if not isinstance(ms,(int,float)) or not 0<=ms<=30000:raise ValueError('invalid wait')
        if action == 'screenshot':
            target=step.get('name','step')
            if not isinstance(target,str) or not target.replace('-','').replace('_','').isalnum():
                raise ValueError('unsafe screenshot name')
    scenario['viewport']=dims
    return scenario
