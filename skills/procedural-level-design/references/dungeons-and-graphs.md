# Topology-driven dungeon and cave generation

## Think in graphs first

Represent `spawn -> entrance -> required rooms -> goal` and optional branches. Place a small number of beat types (safe, puzzle, enemy, reward, rest); assign objective prerequisites before mapping graph nodes to space. Connectivity and progression are separate checks: a room may be connected geographically but locked by a key that cannot be found.

## Rooms and corridors

Use bounded attempts: sample candidate rectangle only when it fits with border/clearance, reject overlap, carve floor, connect every accepted room to at least one already connected room. For variety, build a spanning tree over centers and selectively add cycles, then validate actual carved-grid reachability. The baseline `levelgen.py` uses a connected chain; it does **not** implement MST/BSP, which may be added as production algorithms.

Cave carving: cap steps, constrain to the **interior** `(width-2)*(height-2)`, and always check goal feasibility. A walk with a target fraction can stagnate even for an achievable target, so an explicit budget error is not an unexpected crash; an automatic retry, if required, must itself have bounded retries. Smoothing cellular automata can disconnect a carved path; rerun the connectivity and spawn checks afterward.

## Progression states

For simple one-key/one-door model use search state `(x,y,has_key)`. For multi-lock systems state extends to a bitset/inventory: `(position, acquired_keys, switches, destructible_state, portal_connections, ...)`. An apparently short path through a locked gate is not valid until the key state permits it. State explosion should be controlled through reachable-state dominance, abstraction, and explicit budgets; report UNKNOWN when a solver times out.

## Difficulty + diversity

Use measurable distribution targets with gameplay interpretation: critical path length, dead end ratio, loop count, distance between combat and recovery, mandatory resource amount, hazard exposure, generator rejection fraction. Record seed and algorithm version. Never claim a spatial metric alone guarantees fun, fairness or level quality.
