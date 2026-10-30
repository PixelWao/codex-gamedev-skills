# IndexedDB save architecture

1. Use separate records for `primary` and `backup`. Both may be modified within **one readwrite transaction**; an abort must affect both. The provided reference uses one `records` store with composite string keys.
2. A read-modify-write with an expected revision must happen **in one readwrite transaction**. Reading an old revision in a separate transaction and later overwriting it is not safe across tabs.
3. Only schedule IDB requests when the transaction is active; do not await fetch, crypto, IndexedDB promises or other asynchronous work between `transaction()` and its requests. Precompute JSON and digest before opening the transaction. Inside IDB request callbacks it is safe to queue related requests.
4. Resolve the user-facing write promise after `transaction.oncomplete`. A successful individual `.put()` request is not a committed transaction.
5. `transaction(...,{durability:'strict'})` is only a **hint** and may be unsupported or ignored; feature detect and measure. Do not claim immunity to OS/power failure. Keep export/backup options.
6. Prefer `navigator.storage.estimate()` for advisory quota usage; `navigator.storage.persist()` may be denied. `QuotaExceededError` can appear even after an encouraging estimate. Incognito storage often disappears when the session ends.
7. A save slot holds **one revision chain**, with separate autosave/manual identifiers. Use strict slot-name validation to avoid accidental mixing of namespaces.
8. Large dynamic worlds: store generator seed + generator version + per-chunk modification logs and/or authoritative snapshots. Replaying only the seed after a generator change will mutate established worlds.
9. Keep recovery non-destructive: expose backup to the player, never silently overwrite a primary with a backup that may be older.

## Common production enhancements

- Optionally snapshot in Worker to avoid blocking UI; don't serialize cyclic live-engine objects.
- Provide save/export via Blob and a user gesture. Validate imported files before writing; enforce size ceilings.
- Use `navigator.locks` when supported for compound workflows across databases and UI tabs, but still use revision CAS in the data store.
- If you add migrations, integrate with the companion's concepts without requiring another skill: explicit schema version, sequential pure transformations, full validation and old fixture preservation.
