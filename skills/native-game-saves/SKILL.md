---
name: native-game-saves
description: Use for desktop game save files, atomic writes, backups, checksums and crash recovery on Windows/macOS/Linux; not IndexedDB.
---
# Native game saves

## Required workflow

1. Map deployment targets and **per-user data directories** (not install/game resources). Identify engines, mod support, save format, user profiles, write permissions, anti-virus and cloud-sync conflicts.
2. Define a versioned, platform-neutral pure-data envelope. Validate sizes, schema version, finite numeric values, paths, slots and checksums before constructing any live game objects.
3. Write to a **unique temporary file in the destination directory**; flush and `fsync` file. If the current primary is valid, copy to verified backup using its own temp+replace sequence. Replace primary with `os.replace` and attempt to sync parent directory where platform supports this.
4. Never promise that atomic replacement and flush provide full crash/power-loss durability on every filesystem, mount, OS or cloud-sync service. Document gaps and prove behavior on target platforms.
5. Use revision compare-and-swap for in-process safety, but **it does not solve multiple-process locking**. Production deployments need an OS/engine-appropriate lock or a single-writer service and conflict strategy.
6. Keep a separate autosave ring/manual slots, surface checksum failures and expose recovery from backup without overwriting corrupt originals by default.
7. Test real OS interrupted writes, forced termination, disk-full errors, permission failures, antivirus locks, cloud sync and re-opening the saved game in a clean process.
8. Record measured size/latency, platform matrix, snapshot fidelity and unresolved durability risks.

## Runnable toolkit

- `scripts/native_save_store.py`: safe Python reference implementation with unique-temp + fsync + backup + replace and checksum verification.
- `scripts/save_cli.py`: explicit command-line write/read/list/verify operations.
- `scripts/tests/test_native.py`: state, recovery, crash injection, path rejection, no-NaN, revision and checksum tests.
- `references/native-durability.md`, `references/platform-compat.md`, `references/sources.md`, `assets/qa-report.md`.

## Acceptance criteria

Do not acknowledge a successful write until the target file replacement completes. Old saves must remain available on pre-commit exceptions. Untrusted paths must never escape the configured save directory. A broken primary must not lead to a silent blank save, and a newer schema must not be downgraded. Test the actual release OS; standard-library samples are not universal transaction engines.
