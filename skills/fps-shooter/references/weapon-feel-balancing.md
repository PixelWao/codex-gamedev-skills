# Weapon feel, TTK, recoil and spread

## TTK

`idealTtk({hp,damage,roundsPerSecond})` returns the ideal first-hit-at-zero, perfect-accuracy TTK; valid only if HP, damage, and fire rate are positive and there is no armor, reload, projectile travel, cover, DOT, or healing. For production balance, record effective TTK by distance and skill level, including travel time and shot probability.

## Damage falloff

`damageFalloff(distance, near, far, floor)` requires `far > near >= 0` and floor in [0,1]. These numbers are **tuning parameters**, not universal defaults. Tune with weapon class and map size. Walls always take precedence over target damage.

## Recoil

Treat patterned recoil as a separate event from spread. The sample FSM emits `recoil` based on a nonempty pattern per shot; apply camera kick through existing camera rig, clamp pitch and recover with real time. A visual camera kick must not silently alter your authoritative shot direction after the shot has fired. For aim assistance, respect user settings, especially motion/sensitivity options.

## Performance and game feel

Avoid allocating enormous particle pools, updating every decal forever, or creating redundant physics worlds. Audio, hit markers, flashes, and impact visuals should subscribe to unique shot/hit events; visual feedback does not decide whether a hit happened.

## Balancing QA

For each weapon store seed, version, FPS simulation step, impact distance, shots fired, hits, headshots, reload counts, observed TTK, time-to-first-shot, and post-pause behavior. Make acceptance ranges explicit per weapon archetype; report distributions, not a single average.
