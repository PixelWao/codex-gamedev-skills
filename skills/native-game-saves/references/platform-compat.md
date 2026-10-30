# Desktop platform checklist

| Platform | Inspect | Risk |
|---|---|---|
| Windows | Known Folder per-user data, antivirus and locked files, `os.replace` results | Rename may fail with open handles; directory fsync portability |
| macOS | Application Support path, app sandbox, user permissions | Bundle/resource directory read-only; sandbox restrictions |
| Linux | XDG_DATA_HOME default and user permissions, filesystem mount | Directory sync, network fs variation |
| Cloud sync | External sync client and files being merged | Conflicting slots, duplicates, stale writers |
| Portable games | Custom chosen data directory | Avoid traversals, permissions, drive removal |

The sample CLI accepts an explicit `--dir` and intentionally does not guess platform user-data directories. Integrations must choose these based on release packaging and user profiles. Use a single-process writer or reliable cross-process file lock/service; do not assume file rename prevents logical lost updates. Always test on release builds.
