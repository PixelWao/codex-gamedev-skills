#!/usr/bin/env python3
"""Dependency-free structural validation for the threejs-scene-setup skill."""
from __future__ import annotations
import pathlib, re, sys, json

def validate(root: pathlib.Path) -> list[str]:
    errors = []
    required = [
        'SKILL.md', 'LICENSE', 'PROVENANCE.md', 'CHANGELOG.md', 'README.md',
        'attribution/upstream/LICENSE', 'attribution/upstream/NOTICE',
        'references/version-and-integration.md', 'references/frame-loop-and-lifecycle.md',
        'references/viewports-cameras-input.md', 'references/scenegraph-and-editor.md',
        'references/resource-ownership.md', 'references/qa-protocol.md', 'references/sources.md',
        'scripts/frame-coordinator.mjs', 'scripts/viewport-controller.mjs',
        'scripts/resource-scope.mjs', 'scripts/scenegraph-helpers.mjs', 'scripts/version-audit.mjs',
        'tests/scene-runtime.test.mjs', 'tests/version-audit.test.mjs', 'tests/real-three-optional.test.mjs', 'examples/demo/main.mjs', 'examples/demo/index.html',
        'assets/QA_REPORT_TEMPLATE.md',
    ]
    for filename in required:
        if not (root / filename).is_file(): errors.append(f'missing: {filename}')
    if errors: return errors
    text = (root / 'SKILL.md').read_text(encoding='utf-8')
    match = re.match(r'\A---\n(.*?)\n---\n', text, flags=re.S)
    if not match: errors.append('SKILL.md YAML frontmatter missing')
    else:
        header = match.group(1)
        if not re.search(r'^name:\s*threejs-scene-setup\s*$', header, flags=re.M): errors.append('invalid skill name')
        if not re.search(r'^description:\s*(?:>|\|)?-?\s*$', header, flags=re.M): errors.append('missing folded description')
    for markdown in root.rglob('*.md'):
        body = markdown.read_text(encoding='utf-8')
        for target in re.findall(r'(?<!!)\[[^\]]+\]\(([^)]+)\)', body):
            target = target.split('#')[0].split('?')[0]
            if not target or re.match(r'^(?:https?:|mailto:)', target): continue
            if not (markdown.parent / target).exists(): errors.append(f'dead local link: {markdown.relative_to(root)} -> {target}')
    license_text = (root / 'LICENSE').read_text()
    if 'MIT License' not in license_text or '2026 Waldemar Soroka' not in license_text: errors.append('MIT/copyright missing')
    notice = (root / 'attribution/upstream/NOTICE').read_text()
    if 'Abhishek Barali' not in notice: errors.append('upstream NOTICE missing author')
    html = (root / 'examples/demo/index.html').read_text()
    if html.count('three@0.180.0') != 2: errors.append('demo import map must pin two matching three@0.180.0 URLs')
    if 'new THREE.Timer(' in (root / 'examples/demo/main.mjs').read_text(): errors.append('r180 demo uses Timer')
    return errors

if __name__ == '__main__':
    root = pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
    errors = validate(root)
    print(json.dumps({'skill': root.name, 'passed': not errors, 'issues': errors}, indent=2))
    raise SystemExit(1 if errors else 0)
