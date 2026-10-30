# Validation

Run `python -m unittest discover -s tests -p "test_*.py"; node --test tests/*.test.mjs` and `tsc -p tsconfig.json --noEmit`. Executable helpers use built-in runtime and do not need package downloads. Node 22+, Python 3.10+, TypeScript 5.8.3 were available during packaging.

Covered: unit logic, invalid input, regression fixtures, deterministic state exploration. The aggregated ZIP build also tests post-extraction syntax/types and runs JS/Python integration.

**Not claimed:** hardware input, actual Rapier/Planck collider simulation, GPU/WebGL rendering, complete exhaustive puzzle verification in arbitrary physics worlds, player enjoyment or manual playtest. For missing external dependencies, mark integration **not run**, never PASS.
