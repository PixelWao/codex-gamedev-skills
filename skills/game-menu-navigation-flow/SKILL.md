---
name: game-menu-navigation-flow
description: Use for game menus, screen stacks, dialogs, focus restoration, pause UI and gamepad menu navigation; not gameplay input mapping.
---
# Game Menu & Navigation Flow

## Responsibility

Own the menu stack and presentation of UI action navigation. Don't add another global game loop,
scene graph, input subsystem or physics engine. Integrate the exported router with the existing
per-frame gamepad poll. Use DOM-native elements where accessible semantics are important.

## Implementation procedure

1. Inventory existing screens, popups, pause owners and input bindings. Identify the **single owner**
   of each screen. Do not rewrite an established screen system without first mapping dependencies.
2. Implement screen transitions with `ScreenStack` (`activate/deactivate`, optional `dispose`),
   not uncontrolled global `isPaused && inSettings` flags. Empty `pop()` is a no-op.
3. **Pause belongs to the game**: the menu can request pause via an injected callback, never
   blindly assign `timeScale=1` or override active hit-stop/slow motion.
4. Use native `<dialog>.showModal()` for real modality. It places a dialog in the top layer and
   makes the rest of the document inert. Return focus to the trigger on close; handle Escape,
   Cancel/Close, and lifecycle cleanup.
5. For keyboard, dispatch semantic actions (up/down/left/right/confirm/back), respecting text
   inputs, `event.repeat`, editable fields, and browser keyboard conventions.
6. For gamepad, **poll** `navigator.getGamepads()` inside existing render/input tick and emit only
   rising edges; reset on disconnect. Controller layouts are not identical on every platform;
   provide project-specific mappings and allow remapping.
7. For touch controls, use Pointer Events with pointer ID tracking and `setPointerCapture`,
   `pointercancel`, `lostpointercapture`. Apply `touch-action:none` only to dedicated gameplay
   surfaces; allow page gestures on other controls.
8. Verify nested pause→settings→back→resume, focus return, two simultaneous pointers, unplugged
   controller, disabled controls, mobile orientation and screen-reader labels.

## Library API

`src/menu.mjs` exports `ScreenStack`, `domScreen`, `createModalController`,
`createInputRouter`, `bindPointerActions`; `src/menu.d.mts` provides strict TypeScript declarations.

```js
import {ScreenStack,domScreen,createModalController,createInputRouter} from './src/menu.mjs';
const screens=new ScreenStack();
const pauseScreen=domScreen(document.querySelector('#pause-panel'));
const settings=createModalController(document.querySelector('#settings-dialog'));
const router=createInputRouter({onAction(action){
  if(action==='back'){if(settings.isOpen)settings.close();else screens.pop();}
}});
// Called by EXISTING render/input tick: router.poll();
// On teardown: router.dispose(); settings.dispose(); screens.clear();
```

`createModalController` is a modest helper, not a general replacement for `<dialog>` state,
form semantics, or complex nested dialogs. Don't show dialogs from a detached node.

## Pitfalls fixed

- No undocumented `grab_focus_default()` on bare Godot Control. Call `grab_focus()` on a concrete
  focusable child. Godot focus-neighbor settings alone do not enforce a true modal focus trap.
- Unity uGUI `EventSystem.current.SetSelectedGameObject(button)` instead of an instance-less
  static invocation.
- Disabling general input processing does not automatically disable all GUI controls.
- When a modal is open, the content behind it is inert; don't simulate a modal with z-index alone.
- The same pointer event can involve multiple identifiers; never model touch as one global Boolean.

## Validation

Run `node --test tests/*.mjs` and `tsc --project tsconfig.json`. Read `references/flow-and-devices.md`
for integration nuances. Real browser examples in aggregate `integration/` are supplemental.
