# Algorithm selection and correctness

## Search matrix
| Goal | Algorithm | Notes |
|---|---|---|
| Unweighted discrete steps | BFS | Step count, not travel-time cost |
| Weighted terrain, reference optimum | Dijkstra (`heuristic=0`) | Nonnegative, finite edge weights required; this reference uses positive weights |
| Single target with geometric admissible heuristic | A* | Manhattan 4-way; octile 8-way; both scaled by minimum move cost |
| Many agents with one destination | Reverse Dijkstra / flow field | Reverse **directed** edges and preserve incoming-edge traversal costs |
| Very large maps | Hierarchical A* candidate | Profile partition costs and cache invalidation; not implemented by this reference runtime |

## Safety and failure policies
- Reject NaN, Infinity, negative or zero step costs; zero-cost links need a separately proven formulation.
- Prevent diagonal movement across blocked orthogonal side tiles unless the game's rules expressly allow it.
- Stop searches at `maxExpansions`; `budget` is not evidence that a goal is unreachable.
- Keep current revision on each route. Change to walkability or terrain weights invalidates cached paths and destination flow fields.
- Special portal links may undercut Manhattan/octile distance, so A* uses a zero heuristic with links rather than offering an incorrect guarantee.
- For path optimality comparison, use a separate Dijkstra reference (`navigation-debugging-qa`) and a numerical tolerance rather than matching exact paths.

## Performance policy
Batch requests, cache connected components where appropriate, invalidate changed chunks only when safe, and select flow fields for large crowds sharing a target. Record expanded nodes, frame budgets and graph revisions. HPA*/JPS are **research candidates**, not implemented by this script.

Further reading: https://www.redblobgames.com/pathfinding/a-star/implementation.html
