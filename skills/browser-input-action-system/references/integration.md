# Browser input integration, pitfalls and references

## Unified flow

DOM events -> physical tokens -> binding rules -> action state/edge queue -> existing game physics/controller; gamepad state -> poll in existing loop -> same binding rules; touch zones -> pointer IDs -> same binding rules.

When paused or focused on menu, switch `gameplay` to `menu` and **discard stale held and edge state**. Menu UI still owns modal focus and active control semantics.

## Keyboard and user text

Use `code` for spatial control, `key` for characters and localized shortcut labeling. Ignore repeated `keydown` for one-shot actions. Ignore keydown in `input`, `textarea`, `select`, editable nodes and composition. Always clear captured keys on blur / document.hidden. Respect keyboard navigation and Escape fallback; never call preventDefault indiscriminately.

## Browser Pointer Events

`pointerId` distinguishes concurrent fingers. Capture per finger on a suitable target; handle pointerup, pointercancel, lostpointercapture. Element-level `touch-action:none` prevents browser gestures taking over a virtual control, but avoid global `touch-action:none` on all UI. The sample listener uses the target `data-input-zone`. Nested HTML can resolve with `event.target.closest` if used in your actual UI.

## Gamepad axes

Poll `navigator.getGamepads()` in the existing frame loop. Ignore null slots and disconnected pads, never retain a Gamepad object as an eternal snapshot, and handle re-used indexes. `mapping:'standard'` is not universal. Input aggregation across multiple pads is single-player oriented; for local multiplayer route gamepad indexes to separate action instances.

## Settings integration

Save profile JSON using the existing versioned save system. Validate on import; show the user conflicts; provide default resets. Do not steal profile persistence responsibility from saves. Remap *every* action where practical, but reserve an accessible and documented way to open menu/recover from bad bindings.

## Reference mappings to other engines

- Godot 4.x: `InputMap`, `InputEvent.is_match()`, `Input.is_action_just_pressed()` and physics input synchronization. When storing custom bindings, serialize action/events safely.
- Unity Input System: `InputActionMap`, action phases, rebinding interactions, device hot-swap; avoid legacy `Input.GetKey` for new action-map projects.
- Unreal Enhanced Input: Input Mapping Contexts and Input Actions; do not create multiple owner input subsystems.

## Up-to-date source documentation

- MDN Gamepad API https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
- MDN KeyboardEvent.code https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
- MDN Pointer Events https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
- MDN touch-action https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
- Xbox XAG 107 https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/107

Web API behavior must be rechecked against supported browsers when deploying. Latest docs do not guarantee older WebView behavior.
