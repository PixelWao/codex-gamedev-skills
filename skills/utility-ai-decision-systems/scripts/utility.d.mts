export declare function finite(x:number,name?:string):number;
export declare function clamp01(x:number):number;
export declare function inverseLerp(x:number,a:number,b:number):number;
export declare const curves:Readonly<{linear:(t:number)=>number;smoothstep:(t:number)=>number;polynomial:(t:number,p?:number)=>number;exponential:(t:number,k?:number)=>number;sigmoid:(t:number,k?:number,mid?:number)=>number}>;
export declare function combine(factors:number[],mode?:'mean'|'product'|'compensated-product'):number;
export declare function mulberry32(seed:number):()=>number;
export type Candidate<F=unknown>={name:string;score:(facts:F)=>number;available?:(facts:F)=>boolean};
export type Selection={name:string;score:number;adjusted:number;all:{name:string;score:number;adjusted:number}[]};
export declare class Evaluator<F=unknown>{current:string|null;actions:Candidate<F>[];constructor(actions?:Candidate<F>[],opts?:{rng?:()=>number;hysteresis?:number});evaluate(facts:F):{name:string;score:number;adjusted:number}[];choose(facts:F,opts?:{strategy?:'best'|'softmax'|'weighted';temperature?:number}):Selection|null;}
