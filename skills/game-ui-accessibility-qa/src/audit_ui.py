"""Game UI audit: geometry, color, focus and labels. MIT © 2026 Waldemar Soroka.
Input: JSON snapshot from src/browser_probe.mjs or from a test harness.
Does NOT independently certify WCAG conformance. Run browser + human tests too.
"""
from __future__ import annotations
import argparse, json, math, re, sys
from pathlib import Path


def linear_channel(v: float) -> float:
    v /= 255.0
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def parse_rgb(value: str) -> tuple[int, int, int]:
    match = re.fullmatch(r'#([0-9a-fA-F]{6})', value)
    if match:
        s = match.group(1)
        return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))
    match = re.fullmatch(r'rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,/\s]+(?:[\d.]+))?\s*\)', value)
    if match:
        parts = tuple(int(match.group(i)) for i in (1, 2, 3))
        if all(0 <= x <= 255 for x in parts):
            if value.startswith('rgba'):
                alpha = re.search(r'[,/]\s*([0-9.]+)\s*\)$', value)
                if alpha and float(alpha.group(1)) < 1:
                    raise ValueError('Translucent color requires compositing')
            return parts
    raise ValueError(f'Unsupported opaque RGB color: {value}')


def contrast_ratio(a: str, b: str) -> float:
    def lum(v: str):
        r, g, bl = [linear_channel(n) for n in parse_rgb(v)]
        return .2126 * r + .7152 * g + .0722 * bl
    l1, l2 = sorted((lum(a), lum(b)), reverse=True)
    return (l1 + .05) / (l2 + .05)


def audit(snapshot: dict, *, minimum_target: float = 24, preferred_target: float = 44) -> dict:
    errors, warnings = [], []

    def add(arr, code, ident, detail):
        arr.append({'code': code, 'id': str(ident), 'detail': detail})

    view = snapshot.get('viewport') or {}
    w, h = view.get('width', 0), view.get('height', 0)
    if not all(isinstance(v, (int, float)) and math.isfinite(v) and v > 0 for v in (w, h)):
        add(errors, 'INVALID_VIEWPORT', 'viewport', 'width/height must be finite, positive');
        return {'ok': False, 'errors': errors, 'warnings': warnings, 'stats': {'controls': 0}}
    insets = view.get('insets') or {}
    left, top = float(insets.get('left', 0)), float(insets.get('top', 0))
    right, bottom = float(insets.get('right', 0)), float(insets.get('bottom', 0))
    if min(left, top, right, bottom) < 0 or left + right > w or top + bottom > h:
        add(errors, 'INVALID_SAFE_AREA', 'viewport', 'invalid insets')
        left = top = right = bottom = 0
    seen = set()
    controls = snapshot.get('controls', [])
    for i, c in enumerate(controls):
        if c.get('visible', True) is False:
            continue
        ident = c.get('id') or f'control-{i}'
        if ident in seen:
            add(errors, 'DUPLICATE_ID', ident, 'id appears more than once')
        seen.add(ident)
        rect = c.get('rect') or {}
        x, y, rw, rh = (rect.get(k, 0) for k in ('x', 'y', 'width', 'height'))
        if not all(isinstance(v, (int, float)) and math.isfinite(v) for v in (x, y, rw, rh)) or rw < 0 or rh < 0:
            add(errors, 'INVALID_RECT', ident, 'rect must be finite and nonnegative')
            continue
        if x < -0.5 or y < -0.5 or x + rw > w + .5 or y + rh > h + .5:
            add(errors, 'VIEWPORT_OVERFLOW', ident, 'control outside CSS viewport')
        if c.get('critical', False) and (x < left - .5 or y < top - .5 or x + rw > w - right + .5 or y + rh > h - bottom + .5):
            add(errors, 'SAFE_AREA', ident, 'critical control overlaps unsafe area')
        is_interactive = bool(c.get('interactive', False))
        if is_interactive:
            if not c.get('name', '').strip():
                add(errors, 'MISSING_NAME', ident, 'interactive control missing accessible name')
            # Spacing/equivalent/inline exceptions need human validation; allow explicit exception flag but warn.
            if rw < minimum_target or rh < minimum_target:
                if c.get('targetException'):
                    add(warnings, 'TARGET_EXCEPTION_REVIEW', ident, 'check WCAG 2.5.8 exception manually')
                else:
                    add(errors, 'TARGET_TOO_SMALL', ident, f'{rw:g}x{rh:g} below {minimum_target:g}px')
            elif rw < preferred_target or rh < preferred_target:
                add(warnings, 'TARGET_BELOW_PREFERRED', ident, f'below {preferred_target:g}px app target')
            if c.get('keyboardReachable') is False:
                add(errors, 'NOT_KEYBOARD_REACHABLE', ident, 'no keyboard path to control')
            if c.get('focusIndicator') is False:
                add(errors, 'NO_FOCUS_INDICATOR', ident, 'no visible keyboard focus indicator')
        if c.get('text') and c.get('foreground') and c.get('background'):
            try:
                ratio = contrast_ratio(c['foreground'], c['background'])
                min_ratio = 3.0 if c.get('largeText') else 4.5
                if ratio + 1e-9 < min_ratio:
                    add(errors, 'LOW_TEXT_CONTRAST', ident, f'{ratio:.2f}:1 below {min_ratio}:1')
            except ValueError:
                add(warnings, 'COLOR_NEEDS_COMPOSITE', ident, 'transparent or unsupported color, inspect actual pixels')
        if c.get('textOverflow'):
            add(errors, 'TEXT_OVERFLOW', ident, 'text clipped or overflowed')
    return {'ok': not errors, 'errors': errors, 'warnings': warnings, 'stats': {'controls': len(controls), 'visibleControls': sum(c.get('visible', True) for c in controls)}}


def main(argv=None):
    p = argparse.ArgumentParser(description='Audit game UI snapshots (geometry, contrast, focus, accessible names)')
    p.add_argument('snapshot', type=Path)
    p.add_argument('--output', type=Path)
    args = p.parse_args(argv)
    try:
        report = audit(json.loads(args.snapshot.read_text(encoding='utf-8')))
    except (OSError, ValueError, TypeError) as exc:
        print(f'Cannot read snapshot: {exc}', file=sys.stderr)
        return 3
    data = json.dumps(report, ensure_ascii=False, indent=2)
    if args.output:
        args.output.write_text(data + '\n', encoding='utf-8')
    print(data)
    return 0 if report['ok'] else 2


if __name__ == '__main__':
    raise SystemExit(main())
