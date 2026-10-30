# Snapshot audit example

From the skill folder:

```bash
python src/audit_ui.py examples/snapshot.json --output examples/generated-report.json
python -m unittest discover -s tests -p 'test_*.py'
node --test tests/*.mjs
```

A `0` process exit means no *hard failures in supplied snapshot*, not WCAG certification.
Use `src/browser_probe.mjs` to collect real DOM element geometry in the browser.
Document manual outcomes separately for screen readers, controller devices, software keyboard,
visual viewport and focus navigation. See `references/browser-matrix.md`.
