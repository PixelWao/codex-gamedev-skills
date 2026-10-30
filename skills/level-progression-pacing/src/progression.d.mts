export interface Exit {to:string; requiresAbilities?:string[];requiresFlags?:string[];requiresDestroyed?:string[];requiresKeys?:Record<string,number>;consumesKeys?:Record<string,number>;setFlags?:string[];destroy?:string[]}
export interface Room {exits:Exit[];grants?:string[];keys?:Record<string,number>;flags?:string[];destroys?:string[];checkpoint?:boolean}
export interface Level {start:string;goal:string;rooms:Record<string,Room>;startingAbilities?:string[];startingKeys?:Record<string,number>;startingFlags?:string[];startingDestroyed?:string[]}
export interface LevelState {room:string;checkpoint:string;abilities:string[];flags:string[];destroyed:string[];collected:string[];keys:Record<string,number>}
export interface Diagnostic {code:string;room?:string;index?:number;resource?:string;target?:string}
export declare function validateLevel(level:Level):{errors:Diagnostic[];warnings:Diagnostic[]};
export declare function initialState(level:Level):LevelState;
export declare function encodeState(state:LevelState):string;
export declare function transitions(level:Level,state:LevelState):Array<{index:number;to:string;state:LevelState}>;
export declare function analyzeProgression(level:Level,options?:{maxStates?:number}):{status:'invalid'|'inconclusive'|'solvable'|'unsolvable';goalReachable:boolean;states:number;softlocks:Array<{room:string;path:string[];keys:Record<string,number>;abilities:string[];flags:string[];destroyed:string[]}>;witness:string[]|null;errors:Diagnostic[];warnings:Diagnostic[];coverage?:{visitedRooms:string[];goalStates:number};reason?:string|null};
export declare function respawnAtCheckpoint(state:LevelState,options?:{retainAbilities?:boolean;retainKeys?:boolean;retainFlags?:boolean;retainDestroyed?:boolean}):LevelState;
export declare function analyzePacing(beats:Array<{type:string;intensity:number;mechanic?:string}>):{issues:Array<{code:string;index:number;mechanic?:string}>;averageIntensity:number;beats:number};
