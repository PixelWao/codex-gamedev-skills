export declare const Status:Readonly<{READY:'READY';RUNNING:'RUNNING';SUCCESS:'SUCCESS';FAILURE:'FAILURE'}>;
export type State='READY'|'RUNNING'|'SUCCESS'|'FAILURE';
export type Context={time:number;dt:number;bb:Map<string,unknown>;agent?:unknown;trace?:(event:Record<string,unknown>)=>void};
export declare class Node{name:string;status:State;constructor(name?:string);tick(ctx:Context):State;abort(ctx:Context):void;reset(ctx:Context):void;}
export declare class Action extends Node{constructor(name:string,step:(ctx:Context)=>State,onAbort?:(ctx:Context)=>void);}
export declare class Condition extends Node{constructor(name:string,predicate:(ctx:Context)=>boolean);}
export declare class Wait extends Node{duration:number;elapsed:number;constructor(duration:number,name?:string);}
export declare class Sequence extends Node{children:Node[];constructor(children:Node[],name?:string);}
export declare class Selector extends Node{children:Node[];constructor(children:Node[],name?:string);}
export declare class ReactiveSelector extends Node{children:Node[];constructor(children:Node[],name?:string);}
export declare class ParallelAll extends Node{children:Node[];constructor(children:Node[],name?:string);}
export declare class Guard extends Node{child:Node;constructor(name:string,predicate:(ctx:Context)=>boolean,child:Node);}
export declare class Inverter extends Node{child:Node;constructor(child:Node,name?:string);}
export declare class Repeat extends Node{child:Node;count:number;completed:number;constructor(child:Node,count:number,name?:string);}
export declare class Cooldown extends Node{readyAt:number;child:Node;constructor(child:Node,seconds:number,name?:string);clearCooldown():void;}
export declare class Tree{root:Node;constructor(root:Node);tick(ctx:Context):State;abort(ctx:Context):void;reset(ctx:Context):void;}
