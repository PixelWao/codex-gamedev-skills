---
name: game-hud-responsive-layout
description: Use for responsive HUD placement, safe areas, DPR, Canvas/DOM overlays and world-space labels; not screen navigation.
---
# Responsive Game HUD Engineering

## Scope and non-goals

Own **HUD layout and state presentation**. Never create a second renderer, physics simulation, game loop,
input system, or global camera. Preserve existing canvas, Three.js renderer and project state store.
Don't overwrite existing visual style or install a framework unrequested. Use simple HTML/CSS for
semantically interactive UI where possible; Canvas 2D HUD for drawing-intensive overlays.

## Execution workflow

1. Inspect the existing HUD DOM/canvas, game state interface, CSS scaling and render loop.
2. Identify coordinates: CSS pixels, backing-store pixels, simulation/world coordinates and
   WebGL normalized device coordinates are **different**. Draw an explicit conversion boundary.
3. Decide safe-area policy: `env(safe-area-inset-*)` in CSS for edge inset, OR viewport-relative
   numeric `safeRect()` if placement is computed in JS. Do not apply both twice.
4. CSS: root `position:absolute;inset:0`, flex/grid and content-driven sizing; `pointer-events:none`
   for decoration, `pointer-events:auto` only on real controls. Avoid absolute design-resolution offsets.
5. For Canvas, resize backing pixels using `devicePixelRatio`, then call `ctx.setTransform(dpr,0,0,dpr,0,0)`;
   never repeatedly multiply transforms. The game/scene remains renderer owner.
6. Bind UI after subscribing to the state, then render current snapshot immediately. Unsubscribe
   on scene disposal. Don't poll HP/score every frame; gamepad state is different and must be polled.
7. Three.js markers: call `scene.updateMatrixWorld(true)` / `camera.updateMatrixWorld()` only if
   appropriate to the existing scene owner. `world.clone().project(camera)` or supplied matrices;
   hide clipped/behind-camera markers. Never add markers directly to the 3D update loop's ownership.
8. Test viewport sizes **390×844, 844×390, 1920×1080, 3440×1440**, DPR 1/2/3, locale expansion,
   notches, software keyboard and 200% browser text scale. Record observed vs not run.

## Provided library

`src/hud.mjs`, `src/hud.d.mts`, `src/hud.d.ts` and `src/hud.css`:

- `safeRect({width,height}, insets)` only takes **viewport CSS-pixel insets**; never pass
  unconverted Godot desktop-screen safe rects.
- `layoutForViewport` returns safe CSS bounds, scale and physical backing size.
- `configureCanvas` sets absolute DPR transform, no extra animation loop.
- `makeHudStore` + `bindHud` demonstrate push-driven subscription and initial snapshot.
- `projectThreeToCss` accepts a supplied `Vector3` constructor and live camera matrices;
  Three.js remains an optional peer dependency, never bundled into this skill.
- `watchViewport` uses a supplied/available `ResizeObserver` and tracks viewport resizing; caller owns cleanup.

```js
import {makeHudStore,bindHud,healthFraction} from './src/hud.mjs';
const store=makeHudStore({hp:80,maxHp:100});
const stop=bindHud({store,select:s=>healthFraction(s.hp,s.maxHp),render:f=>{
  document.getElementById('hp-fill').style.width=`${(f*100).toFixed(1)}%`;
}});
// ... scene disposal: stop()
```

## Critical regression guards

- Initial HP value present without waiting for next damage event.
- `maxHp=0` never divides by zero; values outside [0,max] clamp.
- `ResizeObserver` disconnect and subscription unsubscribe are mandatory on scene unload.
- Pixel art requires integer scaling policy separate from the continuous layout example.
- Safe area of a window must not be subtracted directly from OS full-screen coordinates.
- Canvas 2D input targets may need an accessible DOM mirror; raw pixels are not accessible buttons.
- `visualViewport` may be smaller than layout viewport when a keyboard is open; decide if controls
  should follow the keyboard, and test on device.

## Verification commands

`node --test tests/*.mjs` and `tsc --project tsconfig.json`. Cross-skill integration demo in
aggregate package: `integration/demo.html` and `integration/browser_check.py`.

Read `references/integration.md` for Godot/Unity equivalents and 2D/3D adapter details.
