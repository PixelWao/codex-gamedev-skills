# Codex Game Development Skills

49 focused agent skills for building and testing games, engines and editors.
The collection covers Three.js, Rapier, browser input, audio, NPC AI,
procedural generation, destructible worlds, performance profiling and QA.

The skill instructions are in English. Each folder contains its entrypoint
and the supporting references, scripts, fixtures, templates and licenses.

## Install

Choose individual folders from [`skills/`](skills/). Copy each whole folder
into the skills location used by your agent; keep its references, assets,
scripts, provenance and licenses together.

With Codex's skill installer, you can request for example:

```text
Use $skill-installer to install skills/fps-shooter from PixelWao/codex-gamedev-skills.
```

After installation, use the skill by name, for example `$fps-shooter` or
`$rapier-physics-3d`. Individual helpers document their own input and dependency
requirements. The collection is a set of agent workflows and helper tools,
not a game engine dependency.

## Catalog

| Skill | Scope |
| --- | --- |
| [`adaptive-music-systems`](skills/adaptive-music-systems/SKILL.md) | Use for beat- or bar-synced adaptive game music, Web Audio stem layers, intensity transitions and music scheduling; not ordinary SFX playback. |
| [`audio-mixing-qa`](skills/audio-mixing-qa/SKILL.md) | Use to audit game audio loudness, WAV peaks, loops, clipping, silence or audio event logs; not to implement the playback engine. |
| [`behavior-tree-runtime`](skills/behavior-tree-runtime/SKILL.md) | Use to implement or debug Behavior Tree nodes, blackboards, abort cleanup and NPC task lifecycle; not Utility AI scoring or navigation. |
| [`browser-camera-2d`](skills/browser-camera-2d/SKILL.md) | Use for Canvas 2D or pixel-art camera follow, deadzones, look-ahead, zoom, bounds and teleport handling; not 3D camera rigs. |
| [`browser-game-audio`](skills/browser-game-audio/SKILL.md) | Use for HTML5 Web Audio SFX playback, buses, spatial sound, autoplay unlock, pause and voice limits; not adaptive composition. |
| [`browser-game-saves`](skills/browser-game-saves/SKILL.md) | Use for reliable browser game saves, IndexedDB, slots, autosave, cross-tab conflicts and import/export; not desktop file saves. |
| [`browser-input-action-system`](skills/browser-input-action-system/SKILL.md) | Use for browser keyboard, mouse, gamepad or multitouch action mapping, rebinding and device lifecycle; not jump timing. |
| [`camera-debugging-qa`](skills/camera-debugging-qa/SKILL.md) | Use to measure camera jitter, follow errors, bounds, occlusion and teleport regressions from traces; not to build a camera rig. |
| [`destructible-world-engineering`](skills/destructible-world-engineering/SKILL.md) | Use for structural damage graphs, collapsing supports and dirty navigation regions in destructible worlds; not rigid-body solver tuning. |
| [`dynamic-navmesh-steering`](skills/dynamic-navmesh-steering/SKILL.md) | Use for 3D NavMesh navigation, dynamic obstacle invalidation, crowd steering and Rapier movement adapters; not grid A*. |
| [`fps-shooter`](skills/fps-shooter/SKILL.md) | Use to implement or debug FPS weapons, hitscan, projectiles, ammo, reload, spread, damage and Rapier raycasts; not camera controls. |
| [`game-build-release-engineering`](skills/game-build-release-engineering/SKILL.md) | Use to package and verify browser game releases, HTML5 assets, ZIPs, hashes and platform requirements; not gameplay development. |
| [`game-e2e-integration-qa`](skills/game-e2e-integration-qa/SKILL.md) | Use to run browser game Playwright scenarios, screenshots and full-flow regression checks after changes; not unit-level tests. |
| [`game-editor-authoring-tools`](skills/game-editor-authoring-tools/SKILL.md) | Use to build game level editors with object IDs, snapping, undo/redo, prefab edits and Three.js tooling; not procedural generation. |
| [`game-feel-debugging-qa`](skills/game-feel-debugging-qa/SKILL.md) | Use to audit hit-stop, camera impulse, VFX budgets, flash accessibility and feedback traces; not to create visual effects. |
| [`game-feel-event-orchestration`](skills/game-feel-event-orchestration/SKILL.md) | Use to coordinate hit-stop, camera impulses and prioritized feedback events without owning camera, audio or physics systems. |
| [`game-hud-responsive-layout`](skills/game-hud-responsive-layout/SKILL.md) | Use for responsive HUD placement, safe areas, DPR, Canvas/DOM overlays and world-space labels; not screen navigation. |
| [`game-menu-navigation-flow`](skills/game-menu-navigation-flow/SKILL.md) | Use for game menus, screen stacks, dialogs, focus restoration, pause UI and gamepad menu navigation; not gameplay input mapping. |
| [`game-ui-accessibility-qa`](skills/game-ui-accessibility-qa/SKILL.md) | Use to audit game UI contrast, touch targets, safe areas, overflow, text clipping and focus; not to implement menus. |
| [`gltf-asset-pipeline-qa`](skills/gltf-asset-pipeline-qa/SKILL.md) | Use to inspect, validate and optimize glTF/GLB files, compression, assets and export pipeline; not runtime animations. |
| [`grid-pathfinding-strategy`](skills/grid-pathfinding-strategy/SKILL.md) | Use for grid A*, Dijkstra, BFS, flow fields, terrain costs and tactical movement routes; not 3D NavMesh steering. |
| [`impact-animation-vfx`](skills/impact-animation-vfx/SKILL.md) | Use for hit flashes, squash/stretch, tweens, damage numbers, particles and Canvas/Three.js impact effects; not hit-stop timing. |
| [`input-accessibility-qa`](skills/input-accessibility-qa/SKILL.md) | Use to audit keyboard/gamepad/multitouch input traces, stuck buttons, rebinding conflicts and accessibility; not implement controls. |
| [`level-blockout-playability`](skills/level-blockout-playability/SKILL.md) | Use for 2D/3D blockouts, player movement metrics, jump reachability and physical space validation; not story progression. |
| [`level-design-debugging-qa`](skills/level-design-debugging-qa/SKILL.md) | Use to test level solvability, unreachable goals, soft-locks, invalid rooms and progression regressions; not author level pacing. |
| [`level-progression-pacing`](skills/level-progression-pacing/SKILL.md) | Use to design key/ability gates, puzzle progression, critical routes, challenge pacing and checkpoints; not geometry collision metrics. |
| [`native-game-saves`](skills/native-game-saves/SKILL.md) | Use for desktop game save files, atomic writes, backups, checksums and crash recovery on Windows/macOS/Linux; not IndexedDB. |
| [`navigation-debugging-qa`](skills/navigation-debugging-qa/SKILL.md) | Use to validate agent routes, path costs, navigation versions and stuck movement from telemetry; not to implement pathfinding. |
| [`npc-ai-debugging-qa`](skills/npc-ai-debugging-qa/SKILL.md) | Use to audit NPC decisions, Behavior Tree traces, abort cleanup and action oscillation; not to implement NPC decision models. |
| [`performance-optimization`](skills/performance-optimization/SKILL.md) | Use to profile and improve game FPS, CPU/GPU cost, frame pacing, memory, Canvas or Three.js rendering without gameplay changes. |
| [`physics-core`](skills/physics-core/SKILL.md) | Use to diagnose general fixed-step physics, collision timing, interpolation, determinism and jitter; not engine-specific joints. |
| [`planck-custom-physics-2d`](skills/planck-custom-physics-2d/SKILL.md) | Use for Planck.js 2D bodies, contacts, ropes, buoyancy, tiles and coupled particle simulations; not Rapier 3D. |
| [`procedural-generation-qa`](skills/procedural-generation-qa/SKILL.md) | Use to test procedural seeds, map validity, connectivity, reachability and generator regressions; not write generators. |
| [`procedural-level-design`](skills/procedural-level-design/SKILL.md) | Use to generate seeded playable levels, rooms, corridors, caves and puzzle layouts; not whole-world terrain or QA reports. |
| [`procedural-world-generation`](skills/procedural-world-generation/SKILL.md) | Use for seeded terrain, biomes, islands, heightmaps, chunks and large game worlds; not room-by-room level pacing. |
| [`rapier-physics-3d`](skills/rapier-physics-3d/SKILL.md) | Use for Rapier 3D rigid bodies, contacts, joints, CCD, cranes, ropes and mass tuning in Three.js; not 2D Planck physics. |
| [`responsive-input-timing`](skills/responsive-input-timing/SKILL.md) | Use for jump buffering, coyote time, subframe input edges and fixed-timestep input replay; not browser device bindings. |
| [`save-schema-migrations-qa`](skills/save-schema-migrations-qa/SKILL.md) | Use to design, test and migrate versioned game save schemas and corruption fixtures; not platform-specific storage APIs. |
| [`shader-core-glsl`](skills/shader-core-glsl/SKILL.md) | Use to write or debug GLSL shaders, uniforms, ShaderMaterial and WebGL color/UV bugs; not WebGPU TSL or shader QA. |
| [`shader-effects-qa`](skills/shader-effects-qa/SKILL.md) | Use to validate visual shader effects, screenshots, color correctness, regressions and GPU budgets; not write base GLSL pipelines. |
| [`threejs-animation-systems`](skills/threejs-animation-systems/SKILL.md) | Use for Three.js AnimationMixer, clips, skeletal animation, blending and runtime animation lifecycle; not GLB export validation. |
| [`threejs-camera-rigs-3d`](skills/threejs-camera-rigs-3d/SKILL.md) | Use for Three.js orbit, third-person, RTS, cinematic framing, collision-aware 3D cameras and Rapier adapters; not Canvas 2D. |
| [`threejs-environment-color-qa`](skills/threejs-environment-color-qa/SKILL.md) | Use for Three.js HDR environments, PMREM, exposure, tone mapping and color QA; not individual PBR surface design. |
| [`threejs-gltf-runtime`](skills/threejs-gltf-runtime/SKILL.md) | Use to load, clone, dispose and manage glTF/GLB assets in a Three.js scene; not skeletal blending or file compression. |
| [`threejs-lighting-shadows`](skills/threejs-lighting-shadows/SKILL.md) | Use for Three.js light placement, shadow maps, shadow acne and lighting performance; not material or environment QA. |
| [`threejs-pbr-materials`](skills/threejs-pbr-materials/SKILL.md) | Use for Three.js PBR materials, metalness, roughness, transmission and texture role debugging; not light placement. |
| [`threejs-scene-setup`](skills/threejs-scene-setup/SKILL.md) | Use to configure or debug Three.js renderer, scene, camera defaults, resize handling, render loop and resource ownership. |
| [`threejs-tsl-webgpu`](skills/threejs-tsl-webgpu/SKILL.md) | Use for Three.js TSL nodes, WebGPURenderer, WGSL and WebGL fallback migration; not WebGL GLSL-only effects. |
| [`utility-ai-decision-systems`](skills/utility-ai-decision-systems/SKILL.md) | Use for NPC Utility AI considerations, scores, stable softmax, seeded choice and hysteresis; not Behavior Tree execution. |

The machine-readable index is [`catalog.json`](catalog.json).

## Validate this snapshot

Python 3.10+ and PyYAML are used for package validation:

```sh
python -m pip install -r requirements-dev.txt
python scripts/validate.py
```

The check parses every skill's YAML frontmatter, checks folder names and
licenses, and verifies every packaged file against [`MANIFEST.json`](MANIFEST.json).
It does not execute every runtime helper or replace project-level testing.

After intentionally updating skill files, regenerate the catalog and manifest:

```sh
python scripts/build_catalog.py
python scripts/validate.py
```

## License and attribution

Original contributions by **Waldemar Soroka** are distributed under the
[MIT license](LICENSE), to the extent protectable and owned. This collection
includes adaptations prepared with reference to `awesome-gamedev-agent-skills`
by Abhishek Barali and contributors (Apache-2.0). Existing upstream rights and
terms remain in force for the material they cover.

Read the root [NOTICE](NOTICE) and each skill's `LICENSE`, `PROVENANCE.md`,
`attribution/`, `LICENSES/`, `third_party/` and additional notices where present.
The root MIT notice does not relicense third-party material.

Publication snapshot: **2026-10-30**. Skill files are preserved from the
installed collection; repository packaging and validation tools were added.
