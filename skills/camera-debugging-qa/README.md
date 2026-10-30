# camera-debugging-qa — 1.0.0

Standalone Codex skill with a pure Python 3 camera trace auditor and no external packages. Install in `.agents/skills/` or `$HOME/.agents/skills/`.

Run tests: `python -m unittest discover -s tests -v`

Example: `python scripts/camera_trace_qa.py examples/trace.jsonl --max-follow-error 1 --max-speed 30 --output report.json`

Results: exit code 0 when criteria met, 2 on threshold failures, 3 for invalid input. See `references/trace-schema.md` for required fields and units. The tool does not measure GPU timing or visual comfort.
