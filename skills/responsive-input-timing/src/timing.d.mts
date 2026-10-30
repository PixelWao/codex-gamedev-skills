export interface JumpEvent {type:'jump';inputId:string;at:number;latencyMs:number;grounded:boolean}
export class JumpAssist {
  constructor(opts?:{bufferMs?:number;coyoteMs?:number});
  onGround:boolean;armed:boolean;jumpHeld:boolean;
  setGrounded(time:number,grounded:boolean):void;
  press(time:number,id:string):boolean;
  release(time:number):boolean;
  tryConsume(time:number):JumpEvent|null;
  cancel(time:number):void;
  snapshot():{grounded:boolean;armed:boolean;pending:{id:string;at:number}|null;held:boolean};
}
export interface TimedEvent {type:string;time:number;id?:string;[key:string]:unknown}
export class InputTimeline { events:TimedEvent[];record(event:TimedEvent):void;replay(handler:(event:TimedEvent)=>void):void;toJSONL():string;static fromJSONL(text:string):InputTimeline }
export interface QueuedEdge {time:number;type:'pressed'|'released';action:string;[key:string]:unknown}
export class FixedStepEdgeQueue {capture(event:QueuedEdge):void;drainThrough(time:number):QueuedEdge[];cancel():void}
