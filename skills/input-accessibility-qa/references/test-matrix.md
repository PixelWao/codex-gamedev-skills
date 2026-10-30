# Device and accessibility test matrix

## Automated tests

- 30/60/144 Hz: short press+release between steps consumed once.
- Analog `(1,1)` is normalized to magnitude <= 1; deadzone=1 and negative sensitivity are rejected.
- Multiple active touch pointers can operate movement stick and separate button; pointercancel and lost capture release the correct pointer only.
- Gamepad null slots, disconnect while held, reused indexes and axis noise.
- Keyboard repeat, IME composition, editable elements, refocus and visibilitychange.
- Rebind conflict, schema validation, reset defaults, menu escape fallback.
- Hold/toggle action alternative, axis inversion, aim sensitivity (host settings QA).

## Hardware tests not replaceable by synthetic events

- Android Chrome and iOS Safari with real thumbs, virtual keyboards, tab switch, screen rotation.
- Xbox/PlayStation/Nintendo-style and nonstandard gamepads; haptics and analog deadzone drift; disconnect/reconnect.
- Assistive controllers, one-handed mode, touch targets, remappable menu access, multilingual keyboard layout.
- Latency on display from user input to actual rendered action (high-speed footage or calibrated equipment).

## QA reporting

Log platform, browser version, device model, observed frame rate, game version, controller mapping, reproduction instructions and severity. When measurements are synthetic, label them synthetic. Avoid claiming WCAG or console platform certification from unit tests alone.
