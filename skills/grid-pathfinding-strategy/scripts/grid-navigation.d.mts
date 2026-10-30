export type Cell=[number,number];
export type SearchStatus='ok'|'blocked'|'unreachable'|'budget';
export interface PathResult {status:SearchStatus;path:Cell[]|null;cost:number|null;expanded:number;revision:number}
export class DynamicGrid {
  constructor(width:number,height:number,options?:{diagonal?:boolean;defaultCost?:number});
  width:number;height:number;diagonal:boolean;revision:number;minCost:number;
  index(value:number|Cell):number;coord(id:number):Cell;valid(x:number,y:number):boolean;
  isOpen(id:number,options?:{footprint?:number}):boolean;
  setBlocked(cell:number|Cell,blocked?:boolean):this;
  setCost(cell:number|Cell,cost:number):this;
  addLink(from:number|Cell,to:number|Cell,cost:number,opts?:{bidirectional?:boolean}):this;
}
export function findPath(grid:DynamicGrid,start:number|Cell,goal:number|Cell,opts?:{algorithm?:'astar'|'dijkstra'|'bfs';maxExpansions?:number;footprint?:number}):PathResult;
export function buildFlowField(grid:DynamicGrid,goals:(number|Cell)[],opts?:{maxExpansions?:number;footprint?:number}):{status:'budget';revision:number;expanded:number}|{status:'ok';revision:number;expanded:number;dist:Float64Array;next:Int32Array;route(cell:number|Cell,opts?:{limit?:number}):{status:'ok';path:Cell[];cost:number}|{status:'stale'|'unreachable'|'invalid'|'budget';path:null}};
