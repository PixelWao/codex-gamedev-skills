---
name: input-accessibility-qa
description: Use to audit keyboard/gamepad/multitouch input traces, stuck buttons, rebinding conflicts and accessibility; not implement controls.
---
# Input Accessibility & QA (v1.0.0)

Independent instrumentation/auditing skill. Observe the existing input system. Do not overwrite core input, save, UI or physics subsystems. The runnable CLI checks JSON, JSONL and CSV event traces, and the JS recorder produces JSONL.

## Workflow

1. Read the project's action map and current contexts; identify critical escape and confirmation actions, gamepad index ownership, touch zones, lifecycle events, user profiles.
2. Instrument **physical** down/up and pointer events plus **logical** action consumption. Use anonymized device labels, not serial numbers or persistent raw hardware identifiers. Do not log keystrokes typed into chat/text fields.
3. Capture normalized events with strictly nondecreasing millisecond time; `InputTraceRecorder` is reference instrumentation only (`src/recorder.mjs`).
4. Run `python3 src/audit_input.py trace.jsonl --report report.json`. Exit status `0` = no errors, `1` = invariant failures, `2` = invalid input/read errors. Warnings are deliberately separate from errors.
5. Test keyboard pointer and gamepad simulated sequences, then real mobile device/multiple fingers, unplug/hot-plug and remap when hardware is available. Check hold-vs-toggle, deadzone sensitivity and axis inversion settings plus ability to recover from a bad bind.
6. Verify browser/focus behavior: `blur`, `visibilitychange`, composition, editable inputs, `pointercancel`, lost pointer capture, gamepad disconnect and index reuse.
7. For UI-based accessibility verify WCAG input modalities, no mandatory complex touch chords, alternate controls for time-sensitive repetitive actions. Review actual prompts and accessible labels; a trace alone cannot certify accessibility.
8. Execute `python3 -m unittest discover -s tests -v`, `node --test tests/*.test.mjs`, `tsc --noEmit -p tsconfig.json`.

## Trace event schema

Common: `{time:number,type:string,device?:string,control?:string}`. Use monotonic ms and event-specific fields:

- `down` / `up`: `device`, `control`. Duplicate down and orphan up are errors.
- `pointerdown` / `pointerup` / `pointercancel`: `pointerId`, optional `zone`. Unknown pointer or reused live pointer is an error.
- `axis`: normalized `x,y`; radius must be <= 1 after calibration. Raw unsanitized joystick values should be logged separately to avoid false positives.
- `blur` / `hidden` / `releaseAll`: clears held and active pointers (emits a warning if held was cleared). A missing physical up **before** blur is expected; do not classify it as a failure.
- `consume`: `inputId` must be unique per action consumption.
- `binding`: optional `conflict:true` for violations detected by host action map.
- `context`, `device`, `press`, `release`, `sample`: accepted telemetry.

An unfinished short trace produces **warnings**, not automatic failures, because a trace can stop while a control is deliberately held. Stuck input exceeding configured timeout is an error. No system should trust `event.type` fields supplied by untrusted remote clients without validation.

## Limitations and references

CLI observes one trace. It cannot infer held-state latency against screen photons, network timing, physical button accessibility or whether a user can comfortably perform a gesture. Use real-device playtests with disabled/reduced mobility options.

Source docs: Xbox XAG 107 https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/107 ; WCAG 2.2 input modalities https://www.w3.org/WAI/WCAG22/Understanding/input-modalities ; MDN Pointer Events https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events ; MDN Gamepad API https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API

Files: `src/audit_input.py`, `src/recorder.mjs`, `src/recorder.d.mts`, `tests/`, `examples/`, `references/test-matrix.md`.
