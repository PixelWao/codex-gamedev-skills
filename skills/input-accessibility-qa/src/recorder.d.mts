export type TraceEvent = {time:number;type:string;device?:string;control?:string;pointerId?:number;zone?:string;inputId?:string;x?:number;y?:number;[key:string]:unknown};
export class InputTraceRecorder {
  constructor(opts?:{clock?:()=>number});
  events:TraceEvent[];
  add(type:string,properties?:Record<string,unknown>,time?:number):TraceEvent;
  exportJSONL():string;
  reset():void;
}
