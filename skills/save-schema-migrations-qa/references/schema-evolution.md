# Schema evolution contracts

Distinguish four versions: `schemaVersion` (wire-format migration), `generatorVersion` (world generation algorithm), `contentVersion` (catalog IDs) and `gameBuild` (runtime release). The latter three may require separate conversion policies; do not conflate them.

- Pure migration `vN -> vN+1`: take a deepcopy, return a new object; validate before and after each step.
- Maintain a corpus of real, anonymized legacy saves plus compact synthetic edge cases. Do not delete old migrations when a new version ships.
- Prefer stable IDs for items, quests and scenes. Renaming class paths or engine nodes must not invalidate saves.
- `seed` is insufficient after generator changes; store generator version, parameters, diffs of edited tiles/voxels, unique entity states and key simulation values.
- For physics-heavy simulations, record whether exact rigid-body resume is supported. Distinguish checkpoint reconstruction from bit-exact replay. Document nondeterministic limits.
- Treat size/depth budgets as format-contract choices. Avoid recursive transforms on attacker-controlled nested data without depth limits.
- Hashes detect accidental corruption, not intentional tampering. Never trust client progress for server-side competitive authority.

## Release gating

Every shipped version should migrate to current or explicitly decline with a documented message; do not silently discard data. Require successful round-trip for the current schema and smoke-test important invariants (unlocks, map edits, inventory, checkpoints). Fixture tests are necessary but do not replace full gameplay reloading.
