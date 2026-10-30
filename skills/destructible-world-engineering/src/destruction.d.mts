export type RegionId = string;
export interface StructuralNode { id:string; material:string; health:number; anchored:boolean; region:RegionId; alive:boolean }
export interface DestructionEvent { type:'node-destroyed'|'bond-destroyed'; id:string; reason:'damage'|'unsupported'; region?:string }
export declare class DestructionGraph {
  constructor(options?:{damageScale?:number;collapseUnanchored?:boolean;maxSeen?:number});
  revision:number;
  nodes:Map<string,StructuralNode>;
  addNode(options:{id:string;material?:string;health?:number;anchored?:boolean;region?:string}):this;
  addBond(a:string,b:string,strength?:number):this;
  enqueueImpact(event:{eventId:string;nodeId:string;impulse:number;weight?:number}):boolean;
  enqueueBondDamage(event:{eventId:string;a:string;b:string;damage:number}):boolean;
  flush():{revision:number;events:DestructionEvent[];dirtyRegions:string[]};
  snapshot():object;
  resetSeen():void;
}
export declare function impulseFromContactForce(forceMagnitude:number,dt:number):number;
export declare function enqueueRapierContact(graph:DestructionGraph,event:{eventId:string;nodeId:string;forceMagnitude:number;dt:number}):boolean;
