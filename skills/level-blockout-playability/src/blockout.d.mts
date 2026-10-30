export interface JumpParameters {runSpeed:number;jumpSpeed:number;gravity:number;deltaY?:number;clearance?:number}
export interface JumpCheck extends JumpParameters {deltaX:number;tolerance?:number}
export declare function jumpEnvelope(x:JumpParameters): {reachable:boolean;maxDistance:number;landingTime:number|null;peakHeight:number;reason:string|null};
export declare function checkJump(x:JumpCheck): ReturnType<typeof jumpEnvelope> & {possible:boolean;margin:number};
export type Vec3 = {x:number;y:number;z:number};
export declare function checkAabbClearance(bounds:{min:Vec3;max:Vec3},agent:Vec3):{fits:boolean;insufficientAxes:string[]};
export interface Platform {id:string;x:number;y:number;width:number;height?:number}
export declare function validatePlatforms(platforms:Platform[],agent:JumpParameters):{issues:{code:string;id:string|null;field?:string}[];links:{from:string;to:string;deltaX:number;deltaY:number;possible:boolean;margin:number|null}[]};
export declare function sampleTraversal<S>(options:{initialState:S;controls:unknown;advance:(state:S,controls:unknown,dt:number,index:number)=>S;isGoal:(state:S)=>boolean;maxSteps?:number;dt?:number}):{status:'reachable'|'inconclusive';steps:number;state:S};
export declare function drawCanvasPlatforms(ctx:Pick<CanvasRenderingContext2D,'save'|'restore'|'fillRect'|'fillText'|'fillStyle'>,platforms:Platform[], options?:{color?:string;showIds?:boolean}):void;
export declare function addThreeBlockout(options:{THREE:any;scene:any;boxes:Array<{id:string;x:number;y:number;z:number;width:number;height:number;depth:number}>;material:any}):{meshes:any[];dispose:()=>void};
