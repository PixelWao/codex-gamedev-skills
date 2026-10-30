# Browser QA and accessibility evidence matrix

## Standards and meaning

- W3C WCAG 2.2 normative: https://www.w3.org/TR/WCAG22/
- WCAG 2.5.8 Target Size (Minimum), AA, 24 CSS px with exceptions:
  https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- WCAG 1.4.3 contrast (minimum): normal 4.5:1, large 3:1.
- WCAG 2.4.7 focus visible; focus must not be hidden behind menu overlay.
- Native dialog: https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal
- Input/gamepad: https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API

## Test matrix

| Scenario | Automated? | Must verify manually? |
|---|---|---|
| CSS viewport bounds and critical safe area | Yes with snapshot | Device notch / visual viewport |
| Target >=24 CSS px | Yes with geometry | WCAG spacing/equivalent exceptions |
| Preferred 44 CSS px app policy | Yes, warning | Ergonomic comfort |
| Opaque CSS text contrast | Yes | Gradients/composited/image text |
| Real keyboard focus traversal | Browser integration only | Reader focus order |
| Native `<dialog>` inert background | Chromium integration | Other supported browser versions |
| UI available to screen readers | Basic labels only | NVDA/VoiceOver and Canvas mirrors |
| Gamepad navigation | Synthetic state test | Actual controllers, mapping and disconnect |
| Two touch pointers | Synthetic test | Android/iOS touch gesture handling |
| 200% text scale, long strings | Browser render | Readability, target spacing |
| Reduced motion | CSS/setting inspection | Comfort and gameplay discoverability |

## Capture / report guidelines

Include exact CSS viewport, deviceScaleFactor, operating system, browser build and whether
CSS `env(safe-area-inset-*)` actually reflected phone hardware. Screenshots are evidence of
specific states only, not a global accessibility certificate. Never infer human usability
or true-screen-reader semantics from an image of a HUD.

## Example usage in a test harness

```js
import {snapshotUI} from './src/browser_probe.mjs';
const snapshot = snapshotUI({root:document, insets:{top:0,right:0,bottom:0,left:0}});
// Persist snapshot as JSON through your existing test harness, then run audit_ui.py.
```
