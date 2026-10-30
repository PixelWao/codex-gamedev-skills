# Navigation QA matrix

| Class | Scenario | Observable |
|---|---|---|
| Static grid | uniform weights; weighted detour; disconnected goal | exact/optimal costs vs independent Dijkstra |
| Grid geometry | diagonal corner; large-unit clearance; multiple costs | no illegal step/edge and valid traversal |
| Portals | one-way low-cost shortcut; unreachable exit | directed-edge routing and admissibility |
| Dynamic destruction | wall removed/added while agent moves | stale routes invalidated; no collision bypass |
| Navmesh | narrow passages, multiple radii, steep slopes, off-mesh link | version-specific engine integration required |
| Group movement | 100–500 agents on representative scene | CPU time, path queue latency, stuck count, crowd behavior |
| Physics | Rapier collision correction, rubble, moving door | real solver/world tests required |
| Determinism | repeated snapshot/seed/build | identical cost and legal behavior; ties may differ |

Never convert a skipped GPU or Rapier integration test into a passing unit test. Do not silently change AI decisions to satisfy navigation tests. A test budget exhaustion is not evidence of unreachable territory.
