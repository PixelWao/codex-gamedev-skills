# Pacing and mechanic teaching

Author beats as `{type, intensity, mechanic?}` with types `teach`, `develop`, `twist`, `test`, `rest`, `combat`, `climax`. The lightweight validator reports `UNTAUGHT_MECHANIC` if a test/twist precedes explicit teaching, and `NO_REST_BEFORE_CLIMAX` if a climax is not directly preceded by rest. This is a **warning** heuristic, not a quality proof.

Blockout first: play with primitive geometry, then dress. Critical path / golden path may differ: test both, particularly a player who finds optional keys late. Use completion times, deaths, puzzle retries, UI confusion, camera visibility and navigation telemetry to revise actual beats. For multi-mechanic puzzles introduce each ingredient safely before requiring combination. Risk: late-game non-monotonic pressure events need a richer world-state model or actual engine replay.

Source study: https://book.leveldesignbook.com/process/blockout ; original Apache-2.0 pacing source attribution preserved in `attribution/upstream/`.
