// Copyright (c) 2026 Waldemar Soroka. MIT.
// Pure JavaScript navigation; does not own physics, rendering, or AI decisions.
const SQRT2 = Math.SQRT2;
const DELTAS4 = [[1,0],[-1,0],[0,1],[0,-1]];
const DELTAS8 = [...DELTAS4,[1,1],[-1,1],[1,-1],[-1,-1]];
const finite = (n) => Number.isFinite(n);
class Heap {
  constructor(){this.a=[];this.order=0;}
  push(node, score, dist){const e={node,score,dist,order:this.order++};const a=this.a;a.push(e);let i=a.length-1;while(i){const p=(i-1)>>1;if(!Heap.less(e,a[p]))break;a[i]=a[p];i=p;}a[i]=e;}
  static less(x,y){return x.score<y.score||(x.score===y.score&&x.order<y.order);}
  pop(){const a=this.a;if(!a.length)return null;const result=a[0],last=a.pop();if(a.length){let i=0;while(true){let l=2*i+1,r=l+1;if(l>=a.length)break;let c=r<a.length&&Heap.less(a[r],a[l])?r:l;if(!Heap.less(a[c],last))break;a[i]=a[c];i=c;}a[i]=last;}return result;}
  get size(){return this.a.length;}
}
export class DynamicGrid {
  constructor(width,height,{diagonal=false,defaultCost=1}={}){
    if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width*height>10_000_000)throw new RangeError('invalid grid dimensions');
    if(!finite(defaultCost)||defaultCost<=0)throw new RangeError('cost must be finite and positive');
    this.width=width;this.height=height;this.diagonal=!!diagonal;this.costs=new Float64Array(width*height).fill(defaultCost);
    this.walls=new Uint8Array(width*height);this.links=new Map();this.incoming=new Map();this.revision=0;this.minCost=defaultCost;
  }
  valid(x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<this.width&&y<this.height;}
  id(x,y){if(!this.valid(x,y))throw new RangeError('out-of-bounds cell');return y*this.width+x;}
  coord(id){if(!Number.isInteger(id)||id<0||id>=this.costs.length)throw new RangeError('invalid node');return [id%this.width,Math.floor(id/this.width)];}
  index(value){if(Array.isArray(value))return this.id(value[0],value[1]);if(!Number.isInteger(value)||value<0||value>=this.costs.length)throw new RangeError('invalid node');return value;}
  isOpen(id,{footprint=0}={}){const [x,y]=this.coord(id);if(!Number.isInteger(footprint)||footprint<0||footprint>100)throw new RangeError('footprint must be integer >= 0');
    for(let yy=y-footprint;yy<=y+footprint;yy++)for(let xx=x-footprint;xx<=x+footprint;xx++)if(!this.valid(xx,yy)||this.walls[yy*this.width+xx])return false;return true;}
  setBlocked(cell,blocked=true){const i=this.index(cell),v=blocked?1:0;if(this.walls[i]!==v){this.walls[i]=v;this.revision++;}return this;}
  setCost(cell,cost){if(!finite(cost)||cost<=0)throw new RangeError('cost must be positive and finite');const i=this.index(cell);if(this.costs[i]!==cost){this.costs[i]=cost;this.minCost=this.costs.reduce((m,v)=>Math.min(m,v),Infinity);this.revision++;}return this;}
  addLink(from,to,cost,{bidirectional=false}={}){if(!finite(cost)||cost<=0)throw new RangeError('link cost must be positive');this.#link(this.index(from),this.index(to),cost);if(bidirectional)this.#link(this.index(to),this.index(from),cost);this.revision++;return this;}
  #link(from,to,cost){this.links.set(from,[...(this.links.get(from)||[]).filter(e=>e.to!==to),{to,cost}]);this.incoming.set(to,[...(this.incoming.get(to)||[]).filter(e=>e.from!==from),{from,cost}]);}
  hasLinks(){return this.links.size>0;}
  neighbors(id,{footprint=0}={}){
    if(!this.isOpen(id,{footprint}))return [];
    const [x,y]=this.coord(id),result=[];
    for(const [dx,dy] of (this.diagonal?DELTAS8:DELTAS4)){
      const xx=x+dx,yy=y+dy;if(!this.valid(xx,yy))continue;const to=yy*this.width+xx;
      if(!this.isOpen(to,{footprint}))continue;
      if(dx!==0&&dy!==0&&(!this.isOpen(this.id(x+dx,y),{footprint})||!this.isOpen(this.id(x,y+dy),{footprint})))continue;
      result.push({to,cost:(dx&&dy?SQRT2:1)*this.costs[to]});
    }
    for(const edge of this.links.get(id)||[])if(this.isOpen(edge.to,{footprint}))result.push(edge);
    return result;
  }
  // Incoming edges are essential for directed links and destination-weighted movement.
  predecessors(id,{footprint=0}={}){
    if(!this.isOpen(id,{footprint}))return [];
    const [x,y]=this.coord(id),result=[];
    for(const [dx,dy] of (this.diagonal?DELTAS8:DELTAS4)){
      const xx=x+dx,yy=y+dy;if(!this.valid(xx,yy))continue;const from=this.id(xx,yy);
      if(!this.isOpen(from,{footprint}))continue;
      if(dx!==0&&dy!==0&&(!this.isOpen(this.id(x+dx,y),{footprint})||!this.isOpen(this.id(x,y+dy),{footprint})))continue;
      result.push({from,cost:(dx&&dy?SQRT2:1)*this.costs[id]});
    }
    for(const edge of this.incoming.get(id)||[])if(this.isOpen(edge.from,{footprint}))result.push(edge);
    return result;
  }
  estimate(a,b){if(this.hasLinks())return 0;const [ax,ay]=this.coord(a),[bx,by]=this.coord(b),dx=Math.abs(ax-bx),dy=Math.abs(ay-by);
    return this.minCost*(this.diagonal?Math.max(dx,dy)+(SQRT2-1)*Math.min(dx,dy):dx+dy);}
}
function pathBack(prev,start,goal){let n=goal,path=[n];while(n!==start){n=prev.get(n);if(n===undefined)return null;path.push(n);}return path.reverse();}
export function findPath(grid,start,goal,{algorithm='astar',maxExpansions=100000,footprint=0}={}){
  const from=grid.index(start),to=grid.index(goal),revision=grid.revision;
  if(!['astar','dijkstra','bfs'].includes(algorithm))throw new RangeError('unknown algorithm');
  if(!Number.isSafeInteger(maxExpansions)||maxExpansions<1)throw new RangeError('invalid maxExpansions');
  if(!grid.isOpen(from,{footprint})||!grid.isOpen(to,{footprint}))return {status:'blocked',path:null,cost:null,expanded:0,revision};
  if(from===to)return {status:'ok',path:[grid.coord(from)],cost:0,expanded:0,revision};
  const q=new Heap(),dist=new Map([[from,0]]),prev=new Map();q.push(from,0,0);let expanded=0;
  while(q.size){const entry=q.pop();if(entry.dist!==dist.get(entry.node))continue;
    if(entry.node===to)return {status:'ok',path:pathBack(prev,from,to).map(n=>grid.coord(n)),cost:dist.get(to),expanded,revision};
    if(expanded>=maxExpansions)return {status:'budget',path:null,cost:null,expanded,revision};
    expanded++;
    for(const edge of grid.neighbors(entry.node,{footprint})){
      if(!finite(edge.cost)||edge.cost<=0)throw new RangeError('invalid edge cost');
      const step=algorithm==='bfs'?1:edge.cost,alt=entry.dist+step;
      if(alt<(dist.get(edge.to)??Infinity)){dist.set(edge.to,alt);prev.set(edge.to,entry.node);
        q.push(edge.to,alt+(algorithm==='astar'?grid.estimate(edge.to,to):0),alt);
      }
    }
  }
  return {status:'unreachable',path:null,cost:null,expanded,revision};
}
export function buildFlowField(grid,goals,{maxExpansions=100000,footprint=0}={}){
  if(!Array.isArray(goals)||!goals.length)throw new RangeError('goals must be nonempty');
  if(!Number.isSafeInteger(maxExpansions)||maxExpansions<1)throw new RangeError('invalid maxExpansions');
  const g=goals.map(x=>grid.index(x)),dist=new Float64Array(grid.width*grid.height).fill(Infinity),queue=new Heap();
  for(const id of g){if(grid.isOpen(id,{footprint})&&dist[id]!==0){dist[id]=0;queue.push(id,0,0);}}
  let expanded=0;
  while(queue.size){const entry=queue.pop();if(entry.dist!==dist[entry.node])continue;
    if(expanded>=maxExpansions)return {status:'budget',revision:grid.revision,expanded};expanded++;
    for(const {from,cost} of grid.predecessors(entry.node,{footprint})){
      const alt=entry.dist+cost;if(alt<dist[from]){dist[from]=alt;queue.push(from,alt,alt);}
    }
  }
  const next=new Int32Array(dist.length).fill(-1);
  for(let id=0;id<dist.length;id++)if(finite(dist[id])&&dist[id]>0){
    let best=dist[id],bestId=-1;
    for(const {to,cost} of grid.neighbors(id,{footprint}))if(dist[to]+cost<best+1e-10){
      const candidate=dist[to]+cost;if(bestId<0||candidate<best-1e-10||Math.abs(candidate-best)<1e-10&&to<bestId){best=candidate;bestId=to;}
    }
    next[id]=bestId;
  }
  return {status:'ok',revision:grid.revision,expanded,dist,next,
    route(cell,{limit=grid.width*grid.height}={}){if(grid.revision!==this.revision)return {status:'stale',path:null};
      let id=grid.index(cell);if(!finite(dist[id]))return {status:'unreachable',path:null};const path=[grid.coord(id)],seen=new Set([id]);
      for(let i=0;i<limit&&dist[id]>0;i++){id=next[id];if(id<0||seen.has(id))return {status:'invalid',path:null};path.push(grid.coord(id));seen.add(id);}
      return dist[id]===0?{status:'ok',path,cost:dist[grid.index(cell)]}:{status:'budget',path:null};}}
}
