import {DynamicGrid,findPath,buildFlowField} from '../scripts/grid-navigation.mjs';
const map=new DynamicGrid(8,5,{diagonal:false});
for(let y=0;y<4;y++)map.setBlocked([3,y]);
map.setCost([4,4],2);map.addLink([0,0],[7,0],1.5);
const path=findPath(map,[1,2],[6,2]);
const field=buildFlowField(map,[[6,2]]);
console.log(JSON.stringify({path,flow:field.route([1,2])},null,2));
map.setBlocked([3,3]);
console.log('After terrain changed:',field.route([1,2]).status);
