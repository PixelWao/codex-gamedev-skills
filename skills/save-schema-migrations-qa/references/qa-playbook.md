# Migration QA playbook

1. Inventory actual source schemas and introduce a fixture naming policy: `save_v1_story_a.json`, `save_v2_midgame.json`, etc.
2. Test malformed UTF-8, invalid JSON, non-object root, boolean-as-version, zero/negative/future version, NaN/Infinity, huge payload, nested depth and invalid character identifiers.
3. Enforce deterministic migration outputs for a fixed input; call twice and compare canonical JSON, and compare the original in-memory input before/after.
4. Assert semantic invariants before gameplay: XP not negative, valid item IDs, expected world seed and edited-chunk provenance.
5. Measure p95 migration wall time and peak input size for the target device. Record every failure; no silent fallback to blank progress.
6. Test any cloud merge, multiple writer and rollback flow separately; save-schema QA cannot make storage atomic.
7. Use `python scripts/audit_saves.py --manifest fixtures/manifest.json --root fixtures --output audit.json` and `python -m unittest discover -s scripts/tests`.

False promise to avoid: "all previous saves will load" without keeping fixtures for every shipped format and reviewing changed gameplay semantics.
