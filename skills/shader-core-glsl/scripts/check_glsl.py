#!/usr/bin/env python3
"""GLSL ES source heuristics. No claims of compilation. Python standard library."""
import argparse
import json
from pathlib import Path
import re

def analyze(source: str, suffix: str = '.frag') -> list[dict]:
    issues=[]
    def add(level, code, message): issues.append({'level':level,'code':code,'message':message})
    first=next((line.strip() for line in source.splitlines() if line.strip()),'')
    v300=first=='#version 300 es'
    if '#version 300 es' in source and not v300:
        add('error','version-order','GLSL ES 300 version directive must be the first nonempty line (prefer first line).')
    if v300 and re.search(r'\b(gl_FragColor|attribute|varying|texture2D)\b',source):
        add('error','es300-legacy','GLSL ES 300 uses explicit outputs / in-out / texture().')
    if not v300 and re.search(r'\b(layout\s*\(|texture\s*\()',source):
        add('warning','es100-feature','Detected GLSL ES 300 syntax or texture(); confirm a 300-es profile.')
    if suffix == '.frag' and not re.search(r'\bprecision\s+(lowp|mediump|highp)\s+float\s*;',source):
        add('warning','precision','Explicit fragment float precision is recommended for GLSL ES.')
    if re.search(r'\bsmoothstep\s*\(\s*([0-9]+(?:\.[0-9]+)?)\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*,',source):
        for m in re.finditer(r'\bsmoothstep\s*\(\s*([0-9]+(?:\.[0-9]+)?)\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*,',source):
            if float(m.group(1)) >= float(m.group(2)):
                add('error','smoothstep-order','Numeric smoothstep edges are not ascending.')
    if 'void main(' not in source: add('error','main-missing','No main entry point found.')
    return issues

def run():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('path',type=Path,help='GLSL file or directory')
    p.add_argument('--json',action='store_true')
    args=p.parse_args()
    paths=[args.path] if args.path.is_file() else sorted(x for x in args.path.rglob('*') if x.suffix in ('.vert','.frag','.glsl'))
    if not paths: p.error('No shader files found')
    results=[{'file':str(path),'issues':analyze(path.read_text('utf-8'),path.suffix)} for path in paths]
    if args.json: print(json.dumps(results,indent=2))
    else:
        for result in results:
            print(result['file'],':', result['issues'] if result['issues'] else 'no static findings')
    return int(any(i['level']=='error' for r in results for i in r['issues']))
if __name__=='__main__': raise SystemExit(run())
