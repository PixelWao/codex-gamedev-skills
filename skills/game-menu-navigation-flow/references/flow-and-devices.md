# Menu flow, focus, controller and touch — integration reference

## Native HTML modal

```html
<dialog id="confirm" aria-labelledby="confirm-title">
  <h2 id="confirm-title">Quit game?</h2>
  <form method="dialog"><button value="cancel">Cancel</button><button value="quit">Quit</button></form>
</dialog>
```

`showModal()` uses the native top layer, accessible dialog semantics and background inertness.
Ensure the first meaningful control has focus; restore the opener on `close`. On loss of
application focus, decide whether gameplay should pause through the **existing game pause owner**.

## Keyboard and gamepad

`createInputRouter()` defaults to Enter/Space=confirm, Escape/Backspace=back, arrows=navigation,
buttons 0/1 and D-pad 12–15. Map axis deadzone to avoid noisy sticks. Emit a new press only on the
rising edge and clear previous state on disconnect. Custom repeat cadence and international
mappings belong to the game's input owner, not this helper.

Docs: https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API

## Multi-touch

Two held pointers must not overwrite one another. `pointercancel` can happen during device
interruptions, native gestures or overlay changes; always release the corresponding action.
`setPointerCapture()` keeps pointer stream on its target until release; remember to free listeners.

Docs: https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture

## Godot / Unity references

- Godot `Control.grab_focus()` and explicit focus neighbors. Restore owner after pop. Keep modal
  input and outside GUI input from firing simultaneously. Docs:
  https://docs.godotengine.org/en/stable/classes/class_control.html
- Unity uGUI: `EventSystem.current.SetSelectedGameObject(playButton)`; set explicit navigation
  for complex grids; lock outside input while modal active. Docs:
  https://docs.unity3d.com/ScriptReference/EventSystems.EventSystem.SetSelectedGameObject.html

## Integration contract

If the user already has an input abstraction, use its `Confirm`, `Back` and `Navigate`
events instead of instantiating another `createInputRouter`. Add controls to its device map.
If a modal closes while gameplay is paused, it should return to the **pause** screen, not resume
gameplay implicitly. UI doesn't decide restart/resume timing outside a documented callback.
