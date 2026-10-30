# Run the auditor

```bash
python3 src/audit_input.py examples/trace.jsonl --report report.json
python3 -m unittest discover -s tests -v
node --test tests/*.test.mjs
```

Records should be **logical input** rather than raw private keystrokes. Do not transmit captured inputs to third-party services. The example should report no warnings/errors.
