# Durability semantics and sequence

Recommended sequence (same-volume temp files):

1. Serialize and validate state, compute integrity checksum on canonical payload.
2. Read/verify current primary. If invalid, stop and require explicit recovery; do not overwrite the only potentially salvageable file.
3. Write existing **valid** primary bytes to a unique `.bak` temp file, flush/fsync and replace previous backup (note: backup rotation may need multiple generations for production).
4. Write new payload to unique temp file in same directory; flush/fsync; then `os.replace(temp, primary)`.
5. On POSIX, try `fsync` on the directory after replacements. Directory `fsync` is not generally available via the same APIs on Windows. On network/cloud filesystems the guarantees vary.
6. Remove orphaned temporary files after a caught exception, but do not delete primary or backup on failure.

Atomic replacement protects against **partial visibility** on supported same-filesystem implementations; it does not guarantee no loss after abrupt power failure. An OS/antivirus/cloud process can reject replacement. A transactional database may be more appropriate for multiple active writers or large datasets.

Checksum/sha256 gives integrity detection, not an anti-cheat signature. Concurrency: the sample checks revision without cross-process locks. Do not use it as a multi-writer production protocol.
