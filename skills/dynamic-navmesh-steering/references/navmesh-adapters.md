# NavMesh integration — dependency-verified adapters

The reference JS exports a **callback contract**, not a hidden navmesh generator. The names below are generic adapter variables: use the project's verified APIs to implement them.

```js
import {TileNavCoordinator} from '../scripts/nav-steering.mjs';
const nav = new TileNavCoordinator({
  rebuildTile: async tileId => {
    // Project-owned navmesh pipeline: rebuild the named tile.
    await projectNavmesh.rebuildTile(tileId);
  },
  queryPath: async (start, goal, {signal}) => {
    // Use installed library API, convert points to finite {x,y,z}.
    return projectNavmesh.findPath(start, goal, {signal});
  },
});
// On geometry mutation: nav.markDirty(changedTileIDs)
// Per frame with a budget: await nav.rebuild({maxTiles:2})
// Each async request: verify nav.accepts(result) before following waypoints.
```

`projectNavmesh` is an intentionally **hypothetical existing project adapter**, not an export from navcat. Do not copy this example without implementing the interface. Async logic must check versions **after** promises resolve; an abort signal may not be supported by the underlying engine, so recheck before adopting results.

## Library research / version checks
- navcat: https://navcat.dev/docs/ — solo/tiled generation, JS integration and optional `navcat/three` utilities. Confirm current exports from the version in `node_modules`.
- recast-navigation-js: https://docs.recast-navigation-js.isaacmason.com/ — WASM bridge, optional crowd simulation and Three.js adapters. Confirm required initialization and WASM assets.
- three-pathfinding: https://github.com/donmccurdy/three-pathfinding — navigation on pre-supplied navmesh geometry. Do not claim it generates mesh automatically.

## Geometry checks
- Navigation mesh input is usually floor geometry, **not** a detailed physics triangle collider for every fragment of debris.
- Coordinate conventions and mesh winding must be verified; navcat documentation describes right-handed input and counter-clockwise triangle indices.
- Dynamic tiled rebuilds can be expensive: profile stalls and maintain a queue budget; don't rebuild every frame.
- Crowd separation provided by this package is a small deterministic baseline, **not** ORCA/RVO or DetourCrowd.
