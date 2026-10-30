# Testing and validation boundary

```sh
node --test tests/*.test.mjs
tsc --noEmit -p tsconfig.json
```

The input-accessibility-qa skill additionally has Python tests:

```sh
python3 -m unittest discover -s tests -v
python3 src/audit_input.py examples/trace.jsonl
```

Unit tests validate mathematics and logic; browser integration is separately validated in the complete package; physical gamepads, touchscreen hardware, input latency and live game physics have NOT been tested and require project-specific QA.
