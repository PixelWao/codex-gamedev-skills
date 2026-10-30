export interface Vec3{x:number;y:number;z:number}
export interface Pose3D{position:Vec3;lookAt:Vec3;distance:number;yaw:number;pitch:number}
export interface RigConfig{target?:Vec3;yaw?:number;pitch?:number;idealDistance?:number;minDistance?:number;maxDistance?:number;pitchMin?:number;pitchMax?:number;focusRate?:number;releaseRate?:number;collisionMargin?:number;bounds?:Record<string,number>|null}
export type CollisionQuery=(args:{origin:Vec3;direction:Vec3;maxDistance:number;excludePlayer:true})=>null|undefined|number|{distance:number}
export declare function lerpVec3(a:Vec3,b:Vec3,t:number):Vec3;
export declare function groupFraming(targets:Vec3[],opts?:{verticalFovDegrees?:number;aspect?:number;padding?:number;minDistance?:number}):{center:Vec3;distance:number;extents:Vec3};
export declare class OrbitCameraRig{target:Vec3;focus:Vec3;yaw:number;pitch:number;distance:number;idealDistance:number;constructor(options?:RigConfig);setAngles(yaw:number,pitch:number):this;setTarget(target:Vec3,options?:{cut?:boolean}):this;setDistance(distance:number):this;clampTarget(p:Vec3):Vec3;getDirection():Vec3;update(dt:number,options?:{collisionQuery?:CollisionQuery|null}):Pose3D;pose():Pose3D}
export declare function applyPoseToThreeCamera(camera:{position:{set(x:number,y:number,z:number):void};lookAt(x:number,y:number,z:number):void},pose:Pose3D):void;
export declare function resizeThreeCamera(camera:any,width:number,height:number):void;
