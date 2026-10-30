---
name: browser-game-saves
description: Use for reliable browser game saves, IndexedDB, slots, autosave, cross-tab conflicts and import/export; not desktop file saves.
---
# Browser game saves — diagnostic and implementation workflow

## Boundaries

- Preserve the existing game loop, physics, progression rules, storage compatibility and existing save slots. Discover the actual on-disk schema before editing.
- Identify the source of truth: snapshots of pure JSON data, not DOM nodes, scene objects, class prototypes, WebGL resources, or closures. Never store secrets or assume local saves are authoritative for online multiplayer.
- If an existing game uses localStorage, plan a **non-destructive** migration; do not delete legacy data until a new save has been written, read and validated.
- Confirm browser origin and context: `file://` or sandboxed frames may behave differently; test on a localhost/HTTPS origin and on target browsers.

## Mandatory workflow

1. Inventory saves, slot naming, size, write frequency, autosave boundaries, schema versions, generator identity and all external persistence layers.
2. Define save data: `schemaVersion`, game/build identifier, generator version, seed, **world edits**, quest/unlock state, player state, user settings, monotonically increasing revision. Validate upper bounds and finite numbers.
3. Choose IndexedDB for structured saves; use OPFS only when binary access patterns justify it. Treat all browser-local storage as potentially evictable and offer user-exportable backups.
4. Implement transactional writes **without unrelated awaits inside an IDB transaction**, bind success to `transaction.oncomplete` rather than `request.onsuccess`, and propagate `abort`/quota errors.
5. Prevent stale tab overwrite: transactionally check `expectedRevision` before updating primary and rotating last-good backup; consider Web Locks for coordinating compound cross-store operations. A BroadcastChannel notification alone is not a lock.
6. Add autosave on safe checkpoints and periodic dirty-state snapshots, bounded by rate; `visibilitychange` is a last-chance hint, not a guarantee. Never depend on `unload`.
7. Verify primary + backup recovery, new schema refusal, corrupted checksum, quota errors, multiple tabs, refresh, abrupt termination, private mode and device-specific storage behavior.
8. Report measured save latency, payload size, schema/version compatibility, test matrix and unresolved platform risks.

## Runnable reference implementation

- `scripts/indexeddb_save_store.mjs`: IndexedDB key/value saves, per-slot backup, revision CAS, canonical JSON payload, SHA-256 corruption detection, import/export, guarded load.
- `scripts/tests/browser_tests.html`: executable tests in a real browser on localhost; `scripts/tests/run_browser_tests.py` starts local test server and Chrome/Chromium when installed.
- `references/indexeddb-architecture.md`, `references/browser-recovery.md`, `references/sources.md`.
- `assets/qa-report.md`: evidence-based audit handoff. Copy only the parts that match the current game's schema.

## Acceptance conditions

A save must be committed before success is reported. Re-loading must reconstruct equivalent authoritative state. A stale revision must fail without damage. A broken primary should be recoverable from **verified** backup without automatic destructive promotion. Loading a newer schema must fail explicitly, not guess. A failed migration must leave the original intact. Do not represent browser-level deletion or power-loss durability as impossible.
