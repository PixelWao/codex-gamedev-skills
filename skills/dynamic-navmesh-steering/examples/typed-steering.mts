import {seekVelocity,TileNavCoordinator} from '../scripts/nav-steering.mjs';
import type {Vec3} from '../scripts/nav-steering.mjs';
const point:Vec3={x:1,y:0,z:2};
const result:Vec3=seekVelocity({position:{x:0,y:0,z:0},target:point,maxSpeed:3});
const nav=new TileNavCoordinator({rebuildTile:async()=>{},queryPath:async(a,b)=>[a,b]});
console.log(result,nav.revision);
