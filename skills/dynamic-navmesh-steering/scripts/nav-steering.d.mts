export interface Vec3{x:number;y:number;z:number}
export interface NavPath {status:'ok'|'unreachable'|'invalid'|'aborted'|'error'|'stale'|'rebuilding';path:Vec3[]|null;revision:number;reason?:string}
export class TileNavCoordinator {
  constructor(opts:{rebuildTile:(tile:string)=>Promise<void>|void;queryPath:(start:Vec3,goal:Vec3,opts:{signal?:AbortSignal})=>Promise<Vec3[]>|Vec3[]});
  revision:number;dirty:Set<string>;
  markDirty(tiles:string[]):number;
  rebuild(opts?:{maxTiles?:number}):Promise<{finished:string[];failed:{tile:string;error:string}[];remaining:number;revision:number}>;
  requestPath(start:Vec3,goal:Vec3,opts?:{signal?:AbortSignal}):Promise<NavPath>;
  accepts(result:NavPath):boolean;
}
export function seekVelocity(opts:{position:Vec3;target:Vec3;maxSpeed:number;slowRadius?:number}):Vec3;
export function steerVelocity(opts:{velocity:Vec3;desired:Vec3;maxAcceleration:number;dt:number}):Vec3;
export function advancePath(opts:{position:Vec3;path:Vec3[];index?:number;reachRadius?:number}):{index:number;finished:boolean;waypoint:Vec3|null};
export function planMotion(opts:{position:Vec3;velocity:Vec3;target:Vec3;dt:number;maxSpeed?:number;maxAcceleration?:number;slowRadius?:number;castMotion?:(position:Vec3,displacement:Vec3)=>Vec3}):{velocity:Vec3;requestedDisplacement:Vec3;permittedDisplacement:Vec3};
export function separationVelocity(position:Vec3,neighbors:Vec3[],opts?:{radius?:number;strength?:number;maxSpeed?:number}):Vec3;
