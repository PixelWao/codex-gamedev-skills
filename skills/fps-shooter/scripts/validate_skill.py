#!/usr/bin/env python3
"""Offline structural validation for this Codex skill."""
from pathlib import Path
import re, json, subprocess, sys
root=Path(__file__).resolve().parents[1]
errors=[]
text=(root/'SKILL.md').read_text(encoding='utf-8')
if not text.startswith('---\n'):errors.append('no YAML frontmatter')
else:
    parts=text.split('---',2)
    fields={}
    for line in parts[1].splitlines():
        if ':' in line: k,v=line.split(':',1);fields[k.strip()]=v.strip()
    if fields.get('name')!='fps-shooter':errors.append('wrong name')
    if not fields.get('description'):errors.append('missing description')
for match in re.findall(r'`((?:src|references|examples|scripts|assets|tests)/[^`\n]+?)`',text):
    # Ignore src/ballistics.mjs#symbol type suffix
    rel=match.split('#')[0].split(' ')[0]
    if not (root/rel).is_file():errors.append('missing referenced file: '+rel)
for important in ['LICENSE','PROVENANCE.md','CHANGELOG.md','README.md','attribution/upstream/LICENSE-APACHE-2.0','attribution/upstream/NOTICE']:
    if not (root/important).is_file():errors.append('missing: '+important)
for f in (root/'src').glob('*.mjs'):
    q=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
    if q.returncode:errors.append('syntax '+f.name+':'+q.stderr)
print(json.dumps({'ok':not errors,'errors':errors},ensure_ascii=False,indent=2))
sys.exit(0 if not errors else 1)
