import {DynamicGrid,findPath} from '../scripts/grid-navigation.mjs';
import type {PathResult} from '../scripts/grid-navigation.mjs';
const grid=new DynamicGrid(4,4);
const result:PathResult=findPath(grid,[0,0],[3,3]);
if(result.status==='ok')console.log(result.path);
