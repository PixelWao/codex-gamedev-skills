# Telemetry schema and CLI

Examples of JSONL lines:
```jsonl
{"type":"hitstop_start","eventId":"hit-12","atMs":100,"untilMs":180}
{"type":"feedback_accepted","eventId":"hit-12","atMs":100,"channels":["audio","shake","hitstop"],"particles":0,"reducedMotion":false,"allowFlashes":true}
{"type":"hitstop_end","eventId":"hit-12","atMs":180}
{"type":"vfx_batch","atMs":180,"active":3,"capacity":128}
{"type":"camera_delta","atMs":180,"x":0.1,"y":-0.02,"roll":0.001}
```

Accepted effects need a stable eventId; `feedback_rejected` has eventId/reason. `hitstop_extended` requires an active matching start; end must release it. `reducedMotion` and `allowFlashes` are snapshots at dispatch time. The auditor only validates data present in the log, not omitted effects or actual physical camera orientation.

CLI:
```bash
python src/feel_qa.py trace.jsonl --max-events-100ms 32 --max-particles-100ms 120 --max-hitstop-ms 250 --out report.json
```

Programmatic API: `from feel_qa import load_trace, audit`; `report = audit(events)`. `report.ok` is boolean with counts and issue codes. Warnings do not set ok=false; inspect explicitly. No external Python dependencies.

Avoid private user information and arbitrary secrets in trace event IDs.
