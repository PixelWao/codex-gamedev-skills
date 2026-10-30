import {TileNavCoordinator,planMotion} from '../scripts/nav-steering.mjs';
const nav = new TileNavCoordinator({
  rebuildTile: async id => {console.log('Rebuilt synthetic tile',id);},
  queryPath: async(a,b) => [a,b],
});
nav.markDirty(['1:2']);await nav.rebuild({maxTiles:2});
const start={x:0,y:0,z:0},goal={x:4,y:0,z:1};
const path=await nav.requestPath(start,goal);
if(nav.accepts(path)){
  const motion=planMotion({position:start,velocity:{x:0,y:0,z:0},target:goal,dt:1/60,
    castMotion:(_pos,requested)=>requested /* wire to the real physics API */});
  console.log({path,motion});
}
