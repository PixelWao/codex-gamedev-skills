export type Vec3 = {x:number;y:number;z:number};
export type RNG = ()=>number;
export type HitKind = 'world'|'damageable';
export type Hit = {kind:HitKind;distance:number;point:Vec3;collider?:unknown;normal?:Vec3|null;targetId?:string|null;hitZone?:string|null};
export type RayCast = (origin:Vec3,direction:Vec3,range:number,options?:{excludeActorId?:string|null;stage?:string})=>Hit|null;
export type Sweep = (start:Vec3,end:Vec3,radius:number,options?:Record<string,unknown>)=>null|{fraction:number;collider?:unknown};
export type WeaponConfig = {mode?:'auto'|'semi'|'burst';roundsPerSecond:number;magazineSize:number;reserveAmmo?:number;reloadSeconds:number;baseDamage:number;range:number;burstSize?:number;recoilPattern?:number[];spreadRadians?:number;heatPerShot?:number;heatCapacity?:number;coolPerSecond?:number};
export type WeaponEvent = {type:'shot'|'reload-start'|'reload-complete'|'overheated'|'shots-cap-reached';time:number;index?:number;ammo?:number;amount?:number;recoil?:number;spreadRadians?:number};
export declare function requireFinite(value:number,label:string):number;
export declare function requirePositive(value:number,label:string):number;
export declare function clamp(value:number,lo:number,hi:number):number;
export declare function add(a:Vec3,b:Vec3):Vec3;
export declare function sub(a:Vec3,b:Vec3):Vec3;
export declare function scale(a:Vec3,s:number):Vec3;
export declare function dot(a:Vec3,b:Vec3):number;
export declare function cross(a:Vec3,b:Vec3):Vec3;
export declare function length(v:Vec3):number;
export declare function unit(v:Vec3):Vec3;
export declare function distance(a:Vec3,b:Vec3):number;
export declare function seededRng(seed?:number):RNG;
export declare function sampleCone(axis:Vec3,halfAngleRad:number,random?:RNG):Vec3;
export declare function damageFalloff(distanceMeters:number,near:number,far:number,minimum?:number):number;
export declare function idealTtk(input:{hp:number;damage:number;roundsPerSecond:number}):{shots:number;seconds:number};
export declare function validateWeaponConfig(config:WeaponConfig):WeaponConfig;
export declare class WeaponController {
  constructor(config:WeaponConfig,options?:{maxShotsPerTick?:number});
  readonly config:WeaponConfig;
  readonly state:'holstered'|'reloading'|'overheated'|'empty'|'ready';
  ammo:number;reserve:number;heat:number;time:number;nextFireAt:number;shotCount:number;
  cancel():void;equip():void;
  tick(dt:number,input?:{triggerDown?:boolean;reload?:boolean}):WeaponEvent[];
}
export declare function fireHitscan(input:{cameraOrigin:Vec3;cameraDirection:Vec3;muzzleOrigin:Vec3;range:number;castRay:RayCast;spreadRad?:number;random?:RNG;shooterId?:string|null}):{cameraHit:Hit|null;hit:Hit|null;aimPoint:Vec3;direction:Vec3;origin:Vec3;distance:number|null;blocked:boolean;damageable:boolean};
export type Projectile = {position:Vec3;velocity:Vec3;gravity?:Vec3;radius?:number;maxRange:number;travelled?:number;age?:number;maxLife:number;done?:boolean;ownerId?:string};
export declare function advanceProjectile(projectile:Projectile,dt:number,sweep:Sweep):{projectile:Projectile;events:Array<{type:'impact'|'expired';hit?:unknown;point?:Vec3}>};
export declare class DamageLedger {seen:Set<unknown>;apply(target:{hp:number},amount:number,eventId:string|number,options?:{headMultiplier?:number;falloff?:number}):{applied:number;killed:boolean;duplicate:boolean};clear():void;}
export declare function createThreeRaycastAdapter(THREE:unknown,options:{objects:unknown[];resolveHit:(object:unknown,hit:unknown,options:unknown)=>{kind?:HitKind;ignore?:boolean;actorId?:string;targetId?:string;hitZone?:string}|null}):RayCast;
export declare function createRapierRaycastAdapter(RAPIER:unknown,world:unknown,options:{classifyCollider:(collider:unknown,options:unknown)=>{kind?:HitKind;ignore?:boolean;actorId?:string;targetId?:string;hitZone?:string}|null;filterFlags?:unknown;filterGroups?:unknown;excludeRigidBody?:unknown;excludeCollider?:unknown}):RayCast;
export declare function createRapierSphereSweepAdapter(RAPIER:unknown,world:unknown,options:{classifyCollider:(collider:unknown,options:unknown)=>{ignore?:boolean;actorId?:string}|null;groups?:unknown}):Sweep;
