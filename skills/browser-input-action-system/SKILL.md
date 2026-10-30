---
name: browser-input-action-system
description: Use for browser keyboard, mouse, gamepad or multitouch action mapping, rebinding and device lifecycle; not jump timing.
---
# Browser Input Action System (v1.0.0)

Build **one action layer**, never a second game loop. Named actions remain constant while hardware bindings change. Targets: Canvas 2D, WebGL/Three.js, DOM UI. Reuse the host game's update loop, renderer, physics, game-save system and menu navigation. This skill owns **collection and action state**, not jump physics or platformer forgiveness (`responsive-input-timing`) and not the menu UI (`game-menu-navigation-flow`).

## Start here

1. Inspect existing input and pause/menu/context ownership. Preserve all existing UX flows and control settings; avoid replacing their architecture without reason.
2. Define explicit `gameplay` / `menu` / `global` actions and binding records. Use `KeyboardEvent.code` for physical WASD and `KeyboardEvent.key` only when semantic text/shortcut identity is intended. Never intercept typing in text fields or IME composition.
3. Instantiate `InputActions` once using bindings. Use `attachBrowser({window,document,element})` exactly once and call `dispose()` during teardown. The element is the **game control surface**; it should have `touch-action:none`, not the entire document.
4. Poll `navigator.getGamepads?.() ?? []` **inside the existing update loop**, before game logic reads states. Gamepads are not browser keyboard events. Some pads are not exposed until deliberate interaction, and `getGamepads()` contains `null` slots.
5. Use `get(action)` for continuous held/axis; use `drain()` or `FixedStepEdgeQueue` for short edge actions. **Do not drain events in render and then again in physics.**
6. Call `setContext('menu')` on menu entry; it clears inputs/edges to avoid stuck controls. Use `releaseAll()` on blur, page hide, pause and device changes where needed. Treat `keyup` as a release even if focus moved into an editable field.
7. Rebind with `rebind(action,binding,now)`, handling exceptions and presenting conflicts. For held-vs-toggle accessibility configure `toggleActions:['aim','crouch']` at construction, or call `setToggleActions()` on settings changes; toggle flips only on genuine press edges and clears on blur/context loss. The `menu.back` action cannot be lost; provide reset to defaults and a known emergency UI escape route in the host game.
8. Store `exportProfile()` using the host project's save system; import with schema validation. Do not add ad-hoc competing `localStorage` saves.
9. Test keyboard, gamepad unplug, touch+button simultaneously, pointercancel, focus loss, rebinding, user settings and IME. Run `node --test tests/*.test.mjs` and `tsc --noEmit -p tsconfig.json`.

## Runtime contract

- `src/input.mjs` — actual JS runtime, zero dependencies.
- `src/input.d.mts` — TypeScript declarations for ESM consumers.
- `radialDeadzone(x,y,deadzone,sensitivity)` normalizes `(1,1)` to unit magnitude, rejects deadzone=1 and nonpositive sensitivity.
- `key(code,down,time,{repeat,editable,composing})`; `mouse(button,down,time)`; `touchDown(pointerId,zone,x,y,time)`; `touchMove`; `touchUp`; `pollGamepads(pads,time)`.
- Action `get(name)` returns `{held,value}`. `drain()` returns each press/release edge once; very short down/up is retained even if both occur between physics ticks.
- `touch-axis` bindings use normalized stick coordinates, and `touch-button` binds an independent touch zone. Multiple pointer IDs are concurrent; pointer end/cancel releases only that pointer.
- `validateBindings` checks all binding signatures and disallows different actions sharing a physical binding inside the same context. `global` bindings are shared deliberately; review conflicts with active-context bindings in host integration.
- Mouse, keyboard and gamepad values are combined on the action plane and clamped; analog axes below calibrated deadzone read as zero.
- Device prompt switching has a quiet period to prevent analog stick drift flapping prompts. Glyph mapping and localization belong to UI layer.

## Integration rules and caveats

- Browser `attachBrowser` is a focused reference adapter, not an all-purpose input middleware. `data-input-zone` must exist on target of touch pointerdown; if controls contain child nodes, add target resolution via `.closest('[data-input-zone]')` according to your DOM.
- `pollGamepads` aggregates connected pads across indexes; if multiplayer assigns one pad per player, introduce **per-player filtering**, not global aggregation.
- Browser Pointer Events are not guaranteed for some embedded WebViews; test hardware and offer keyboard fallbacks.
- Do not use `performance.now()` values and simulation timestamps interchangeably without conversion. Pass the same monotonic time origin across browser events and fixed-step queue.
- Context switch intentionally drops pending inputs; jump buffering is owned by the timing skill and should be canceled on scene transitions.
- Under the default accessibility policy do not require a multi-button chord for essential actions. Expose hold/toggle for aim/sprint and axis inversion as host-side **user settings**, not hidden physics behavior.

## Example, tests, references

- `examples/input-demo.html` — runnable page; serve using a local HTTP server rather than opening a module through `file://`.
- `typecheck/example.mts`, `tsconfig.json` — declaration consistency.
- `references/integration.md` — browser API details, C#/Godot/Unity equivalents, diagram and pitfalls.
- Integration with other skills: `responsive-input-timing`, `game-ui-accessibility-qa`, `game-menu-navigation-flow`, `browser-game-saves`, `physics-core`.

## Validation boundary

Passing pure Node.js tests and simulated browser events establishes the action-layer behavior. It does **not** certify hardware gamepad layout, system input latency, touch behavior on iOS, gameplay feel, or browser compatibility on all devices. Record those as separate manual/hardware QA tasks.
