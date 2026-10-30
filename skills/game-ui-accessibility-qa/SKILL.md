---
name: game-ui-accessibility-qa
description: Use to audit game UI contrast, touch targets, safe areas, overflow, text clipping and focus; not to implement menus.
---
# Game UI Accessibility & QA

## Boundary

This skill supplies **test tooling and procedures**, not a substitute renderer or menu stack.
A passing geometry report is NOT proof of WCAG 2.2 compliance or physical-device usability.
Do not mark screen-reader, native gamepad, 200% text zoom, actual phone notch, high-DPI rendering
or Three.js graphics as verified unless they were observed and documented.

## Checklist-driven workflow

1. Inspect real UI routes, navigation and control labels, native DOM vs Canvas/WebGL HUD.
2. Generate a snapshot using `src/browser_probe.mjs` in browser. Alternatively export a JSON snapshot
   from existing engine using the format of `examples/snapshot.json`.
3. Run `python src/audit_ui.py examples/snapshot.json --output report.json` and review **errors and warnings**.
4. Fail on missing accessible names, interactable elements below 24×24 CSS px without proven
   exceptions, off-viewport critical controls, safe-area overlap, keyboard-inaccessible controls
   and text clipping. Warn on touch-target preference below 44 px.
5. Confirm text/background contrast from **composited pixels**. The built-in parser measures
   opaque RGB only and warns for transparent, gradients or background imagery. WCAG 2.2 AA:
   4.5:1 normal body text, 3:1 large text. Do not claim automated OCR or screenshot contrast
   from merely reading CSS colors.
6. Test: 390×844 portrait, 844×390 landscape, 1920×1080 desktop, 3440×1440 ultrawide;
   200% text zoom; keyboard/gamepad-only menu, device disconnect, simultaneous touch,
   short/long localization, overflow, focus-visible, screen-reader labels, reduced motion.
7. Distinguish `PASS` (actually executed), `FAIL` (executed and broken), `SKIP` (not available),
   `MANUAL` (human/device verification necessary). Include browser version and viewport/DPR.

## Provided code

- `src/audit_ui.py`: standard-library Python CLI, snapshots with `viewport`, `controls`.
- `src/browser_probe.mjs`: DOM/CSS snapshot; does **not** measure occlusion by canvas geometry,
  high-contrast system colors, full focus traversal or screen-reader spoken output.
- `tests/test_audit.py` and `tests/browser_probe.test.mjs`: deterministic regression tests.

## Minimal snapshot format

```json
{
  "viewport":{"width":390,"height":844,"insets":{"top":44,"bottom":24,"left":0,"right":0}},
  "controls":[{
    "id":"pause","name":"Pause","rect":{"x":310,"y":60,"width":60,"height":52},
    "visible":true,"interactive":true,"keyboardReachable":true,
    "focusIndicator":true,"critical":true,"text":"Pause",
    "foreground":"#ffffff","background":"#142e46","largeText":false
  }]
}
```

`targetException` is a **manual claim** and only produces warning instead of hard error; it does not
automatically demonstrate compliance with spacing/equivalent/inline exceptions in WCAG 2.5.8.
`focusIndicator` on unfocused elements should be left unknown until keyboard testing actually
checks `:focus-visible`. CSS presence alone cannot prove visible focus or unclipped focus rings.

## Commands

```sh
python -m unittest discover -s tests -p 'test_*.py'
node --test tests/*.mjs
python src/audit_ui.py examples/snapshot.json --output report.json
```

`audit_ui.py` exits with 0 for no hard errors, 2 when findings exist, 3 for failed input.
Run `references/browser-matrix.md` before calling accessibility complete.
