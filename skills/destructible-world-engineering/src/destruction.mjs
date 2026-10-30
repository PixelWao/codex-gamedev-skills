/** Event-driven structural damage, no direct physics world ownership. MIT © 2026 Waldemar Soroka. */
const num=(x,k)=>{if(!Number.isFinite(x)||x<0)throw new RangeError(`${k} must be nonnegative finite`);return x};
export class DestructionGraph {
 constructor({damageScale=1, collapseUnanchored=true, maxSeen=10000}={}){
  this.damageScale=num(damageScale,'damageScale');this.collapseUnanchored=!!collapseUnanchored;this.maxSeen=num(maxSeen,'maxSeen');if(this.maxSeen<1||!Number.isInteger(this.maxSeen))throw new RangeError('maxSeen must be positive integer');
  this.nodes=new Map();this.bonds=new Map();this.queue=[];this.seen=new Set();this.dirtyRegions=new Set();this.revision=0;
 }
 addNode({id,material='generic',health=100,anchored=false,region='default'}={}){
  if(typeof id!=='string'||!id||this.nodes.has(id))throw new Error('invalid/duplicate node id');
  num(health,'health');if(health<=0)throw new RangeError('health must be positive');
  this.nodes.set(id,{id,material,health,anchored:!!anchored,region,alive:true});return this;
 }
 addBond(a,b,strength=100){
  if(a===b||!this.nodes.has(a)||!this.nodes.has(b))throw new Error('bond endpoints invalid');
  num(strength,'strength');if(strength<=0)throw new RangeError('bond strength must be positive');const key=[a,b].sort().join('|');if(this.bonds.has(key))throw new Error('bond duplicate');
  this.bonds.set(key,{a,b,strength,alive:true});return this;
 }
 enqueueImpact({eventId,nodeId,impulse,weight=1}){
  if(typeof eventId!=='string'||!eventId)throw new Error('eventId required');
  if(this.seen.has(eventId))return false;
  if(!this.nodes.has(nodeId))throw new Error('impact on unknown node');
  num(impulse,'impulse');num(weight,'weight');this.seen.add(eventId);
  while(this.seen.size>this.maxSeen){this.seen.delete(this.seen.values().next().value)}
  this.queue.push({eventId,nodeId,damage:impulse*weight*this.damageScale});return true;
 }
 /** Effects generated here are descriptions; the game owns collider/mesh modifications after its physics step. */
 enqueueBondDamage({eventId,a,b,damage}){
  if(typeof eventId!=='string'||!eventId)throw new Error('eventId required');
  const key=[a,b].sort().join('|');if(!this.bonds.has(key))throw new Error('unknown bond');
  num(damage,'damage');if(this.seen.has(eventId))return false;this.seen.add(eventId);
  while(this.seen.size>this.maxSeen){this.seen.delete(this.seen.values().next().value)}
  this.queue.push({eventId,bondKey:key,damage});return true;
 }
 flush(){
  let events=[];this.queue.sort((a,b)=>a.eventId.localeCompare(b.eventId));
  for(const impact of this.queue){
   if(impact.bondKey){const b=this.bonds.get(impact.bondKey);if(b.alive){b.strength=Math.max(0,b.strength-impact.damage);if(b.strength===0){b.alive=false;this.dirtyRegions.add(this.nodes.get(b.a).region);this.dirtyRegions.add(this.nodes.get(b.b).region);events.push({type:'bond-destroyed',id:impact.bondKey,reason:'damage'})}}continue}
   const n=this.nodes.get(impact.nodeId);if(!n?.alive)continue;n.health=Math.max(0,n.health-impact.damage);
   if(n.health===0)this.#destroy(n,events,'damage');
  }
  this.queue=[];
  if(this.collapseUnanchored){
   const connected=new Set(),pending=[];
   for(const node of this.nodes.values())if(node.alive&&node.anchored){connected.add(node.id);pending.push(node.id)}
   while(pending.length){const at=pending.shift();for(const bond of this.bonds.values())if(bond.alive&&(bond.a===at||bond.b===at)){
    const other=bond.a===at?bond.b:bond.a;
    if(this.nodes.get(other)?.alive&&!connected.has(other)){connected.add(other);pending.push(other)}
   }}
   for(const node of this.nodes.values())if(node.alive&&!connected.has(node.id))this.#destroy(node,events,'unsupported');
  }
  if(events.length)this.revision++;
  const regions=[...this.dirtyRegions].sort();this.dirtyRegions.clear();
  return {revision:this.revision,events,dirtyRegions:regions};
 }
 #destroy(node,events,reason){
  if(!node.alive)return;node.alive=false;node.health=0;this.dirtyRegions.add(node.region);
  for(const bond of this.bonds.values())if(bond.alive&&(bond.a===node.id||bond.b===node.id)){bond.alive=false}
  events.push({type:'node-destroyed',id:node.id,reason,region:node.region});
 }
 snapshot(){return {revision:this.revision,nodes:[...this.nodes.values()].map(x=>({...x})),bonds:[...this.bonds.values()].map(x=>({...x}))};}
 resetSeen(){this.seen.clear();}
}
/** Converts contact-force magnitude into an approximate impulse per fixed step; not an energy or fracture solver. */
export function impulseFromContactForce(forceMagnitude,dt){num(forceMagnitude,'forceMagnitude');num(dt,'dt');return forceMagnitude*dt}
/** Call after world.step(eventQueue), not inside a Rapier physics collision callback that mutates bodies. */
export function enqueueRapierContact(graph,{eventId,nodeId,forceMagnitude,dt}){
 return graph.enqueueImpact({eventId,nodeId,impulse:impulseFromContactForce(forceMagnitude,dt)});
}
