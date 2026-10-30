---
name: save-schema-migrations-qa
description: Use to design, test and migrate versioned game save schemas and corruption fixtures; not platform-specific storage APIs.
---
# Save schema migrations and QA

## Process

1. Locate the real persisted wire format and enumerate **every shipped schema version**, not merely current runtime models. Do not rewrite real player saves to inspect them.
2. Define a strict version discriminator. Unknown, negative, boolean, non-integer and newer versions are rejected; never assume missing version means V1 unless documented by actual legacy builds.
3. Author migrations as pure transformations `N -> N+1` on a copied state. No mutable globals, no network, no RNG and no changes to the original save.
4. Validate input and output at **each step**. Refuse a gap in migration table. Preserve unknown fields only under a documented policy; never run arbitrary object deserialization for user-provided saves.
5. Track content compatibility separately: `schemaVersion` is not the generator version, entity catalog revision or build. For procedural worlds, persist generator identity + seed + changed chunks/objects so a generator update cannot quietly reshape old worlds.
6. Define failure classes (parse, checksum, legacy shape, future version, unsupported content, oversized resource, invalid type, depth limit) and a non-destructive recovery path.
7. Build fixtures for every released version, including boundary numbers, Unicode, incomplete saves, tampered saves and future-version refusal. Test **direct migration from each old version to current** and verify the input bytes remain intact.
8. Prepare release report: fixture pass rate, blocked migrations, compatibility decisions, replay invariants, hashes and any manual game-run checks.

## Runnable toolkit

- `scripts/schema_pipeline.py`: standalone Python example of three schema versions, safe JSON parsing, explicit transforms, bounded validation and no-NaN encoding.
- `scripts/audit_saves.py`: CLI fixture runner with success/failure manifest and JSON report.
- `scripts/tests/test_schema.py`: tests for migration chain, input immutability, future refusal, corruption, hostile type/shape and repeatability.
- `fixtures/`: versioned **synthetic** saves and an expectation manifest. Replace/extend with anonymized shipped fixtures before deploying.
- `references/schema-evolution.md`, `references/qa-playbook.md`, `references/sources.md`, `assets/qa-report.md`.

## Quality gate

Successful parsing is not equal to a valid game state. All migrations must be repeatable for identical inputs, bounded in time and size, and must not silently reset player progress. The toolkit demonstrates a sample schema — **it does not know your game's actual authoritative model**. Production acceptance requires loading and inspecting migrated saves in the running target game.
