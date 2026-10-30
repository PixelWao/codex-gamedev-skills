export interface TraceEvent{type:string;atMs:number;eventId?:string;[key:string]:unknown}
export declare class TraceRecorder{constructor(config?:{maxEvents?:number});maxEvents:number;events:TraceEvent[];dropped:number;push(event:TraceEvent):boolean;jsonl():string;clear():void}
