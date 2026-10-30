# Weapon state machine: deterministic updates

## Explicit state

`WeaponController` uses an authoritative timeline: `time`, `nextFireAt`, `reloadEndsAt`, `ammo`, `reserve`, `shotCount`, `heat`, and flags for current equipment and burst. The public `state` is derived, not manually mutated.

**Input semantics**: `triggerDown` is sampled each simulation tick; `semi` and `burst` start on a rising edge, `auto` can keep firing while held. Scheduled shots use absolute times (first shot at t=0), not a `fire()` call every rendered frame. If the weapon is not ready when a semi trigger occurs, the input is rejected rather than silently queued. A burst that starts runs to completion unless interrupted by reload/switch. `cancel()` holsters the weapon, cancels burst and reload; caller owns switch animation and equipment tracking.

**Reload**: only a partial magazine with reserve ammo may reload. Reload consumes reserve at completion; shots are not generated while reloading. Switching cancels reload rather than awarding ammunition. Change that policy deliberately if the game uses staged reloads.

**Overheat**: optional positive `heatPerShot`, `heatCapacity`, `coolPerSecond`; lockout recovers below 35% of capacity (hysteresis). Tune in a full simulated run and in gameplay; it is a reference policy, not a universal weapon balance rule.

**Event order**: process reload completion, then eligible scheduled fire times. The last boundary exactly equal to tick end is fired at the start of the next tick to avoid duplicates. Suppress catch-up bursts after suspended tabs: the sample explicitly rejects `dt > 0.25s`, and real projects should clamp accumulated time.

**Production considerations**: animations/weapon switching can carry richer states (`equipping`, `unequipping`, `charging`, `jammed`, `venting`). Do not add states without explicit transition tests. Inventory, save-system persistence, and ammo pickups should own their existing authoritative systems.

## QA

Test trigger press/release within and across frames, interrupted reload, empty magazine, no reserve, zero-length recoil pattern, burst after release, weapon switch, time-step limits, and overheated recovery.
