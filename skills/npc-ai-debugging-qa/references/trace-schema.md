# AI trace format v1

One JSON object per line (JSONL / NDJSON). Common fields:

- `agent`: nonempty identifier (string)
- `t`: finite monotonic simulation seconds per agent
- `kind`: `start`, `complete`, `abort`, `decision`, or `cost`
- `node`: required for lifecycle events; unique *per-agent running action id* (example `guard.patrol`)
- `action`: required for decision event, or `null` when no eligible action
- `ms`: required for cost event; wall-clock milliseconds, finite nonnegative
- `seed`, `scenario`, `build`: recommended for reproducibility

Lifecycle: `start(node)` -> exactly one `complete(node)` OR `abort(node)`. A second `start` of the same node before terminal means overlapping operation; a terminal without a start is suspicious. At trace end, unresolved running actions trigger warning (or error in `--strict-end`). The analyzer cannot know if the host produced a partial capture.

A decision changed within `--min-dwell` seconds counts as flip-flop. This may be legitimate in urgent situations; use `reason: emergency` to exempt deliberate emergency switches. Time reversal is an error. The analyzer does not consider two separate agents' clocks to be one global clock.

Example:
```json
{"agent":"a1","t":0,"kind":"start","node":"patrol"}
{"agent":"a1","t":0.3,"kind":"decision","action":"chase"}
{"agent":"a1","t":0.3,"kind":"abort","node":"patrol"}
{"agent":"a1","t":0.3,"kind":"start","node":"chase"}
{"agent":"a1","t":1.2,"kind":"complete","node":"chase"}
{"agent":"a1","t":1.2,"kind":"cost","ms":0.11}
```
