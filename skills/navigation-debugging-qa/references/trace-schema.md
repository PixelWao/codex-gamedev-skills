# Navigation telemetry schema

## Independent route fixture (JSON object or list)
```json
{"width":3,"height":2,"diagonal":false,"walls":[],"costs":[{"cell":[1,0],"cost":2}],"links":[],"start":[0,0],"goal":[2,0],"path":[[0,0],[1,0],[2,0]],"reportedCost":3}
```
- Costs are **destination-cell** positive numeric weights, with diagonal travel multiplying by `sqrt(2)`. Links contain `from`, `to`, `cost` and are directed. Inaccessible cells are `walls`.
- `path: null` represents no route. A route absent in a reachable world is a failure; a route crossing a wall is a failure.
- `optimalCost` is calculated separately via Dijkstra. It assumes a static 2D grid matching this schema, not clearance against actual 3D geometry.

## Trace event (JSONL row, JSON array entry, CSV row)
```json
{"agent":"guard-1","t":0,"x":0,"z":0,"goalX":5,"goalZ":0,"state":"moving","revision":1,"pathRevision":1}
```
- `t`: seconds, monotonic within each agent. `x/z`: world horizontal coordinate. `state`: `moving`, `idle`, `waiting`, `teleporting`, or project-specific.
- `revision`: most recent relevant navigation topology. `pathRevision`: revision on which the followed path was computed.
- `stuck`: the agent remains sufficiently far from the goal with negligible movement over `stuck_seconds`. Reports may require review for deliberate waiting/animation lock.
- `movement_speed_spike`: derived speed between consecutive samples above `max_speed`; adapt thresholds to gameplay units and special events.
- `stale_route_in_use`: do not assume all older paths are unsafe in an incremental navmesh implementation. Use as a conservative regression alarm.
