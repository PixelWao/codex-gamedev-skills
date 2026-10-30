# Authored level JSON contract v1

```json
{ "start":"entry", "goal":"boss", "rooms": {"entry":{"exits":[{"to":"hall"}]}, "hall":{"exits":[]},"boss":{"exits":[]}} }
```

Top-level `startingAbilities:string[]`, `startingFlags:string[]`, `startingDestroyed:string[]`, `startingKeys:{name:int}` are optional. Each room requires `exits:[]`; optional `grants:string[]` (permanent abilities), `keys:{name:positive-int}` (consumable stock; **acquired once per room**), `flags:string[]`, `destroys:string[]`, `checkpoint:boolean`. Each **directed** edge requires `to:string` and may have `requiresAbilities:string[]`, `requiresFlags:string[]`, `requiresDestroyed:string[]`, `requiresKeys:{name:int}`, `consumesKeys:{name:int}`, `setFlags:string[]`, `destroy:string[]`. `requiresKeys` checks current inventory; `consumesKeys` deducts stock on every crossing. Keep `red_key` items separate from ability flags. All exits are directed. Add reverse exits explicitly. Each state key tracks current room, inventory, collected rooms, flags and destruction.

The code intentionally does not model analog timing, physics-controlled gates, moving platforms, water pressure, pushable crates, fluctuating conditions, resource regeneration, enemy interference or unbounded counters. Represent those in a bounded discrete state space **only if** semantics are equivalent; otherwise use live physics replay and mark unresolved. Persistent world switches are monotonic here; use another solver for on/off toggles that reset on re-entry.

Graph search enumerates reachable states and reverse-reachability to goal. `softlocks` means states reachable by some legal choices with no modeled path to goal; optional deliberate traps may be reported. `inconclusive` from budget exhaustion is not a proof. The witness is one shortest-by-edges route among modeled states, not necessarily shortest distance/time. Before shipping, check checkpoint death policy separately and integrate actual save schema.
