export type Context = 'gameplay'|'menu'|'global';
export type Binding =
  | { type:'key'; action:string; context:Context; code:string; scale?:number }
  | { type:'mouse'; action:string; context:Context; button:number; scale?:number }
  | { type:'gamepad-button'; action:string; context:Context; button:number; scale?:number }
  | { type:'gamepad-axis'; action:string; context:Context; axis:number; direction?:'positive'|'negative'|'both'; deadzone?:number; sensitivity?:number; scale?:number }
  | { type:'touch-button'; action:string; context:Context; zone:string; scale?:number }
  | { type:'touch-axis'; action:string; context:Context; zone:string; axis:'x'|'y'; scale?:number };
export interface ActionEdge { type:'pressed'|'released'; action:string; time:number; value:number }
export interface GamepadLike { index:number; connected?:boolean; buttons:ReadonlyArray<number|{value?:number;pressed?:boolean}>; axes:ReadonlyArray<number> }
export function radialDeadzone(x:number,y:number,deadzone?:number,sensitivity?:number):{x:number;y:number};
export function axisDeadzone(value:number,deadzone?:number,sensitivity?:number):number;
export function validateBindings(bindings:Binding[]):Binding[];
export class InputActions {
  constructor(bindings:Binding[],opts?:{context?:'gameplay'|'menu';deviceQuietMs?:number;toggleActions?:string[];clock?:()=>number});
  bindings:Binding[];context:'gameplay'|'menu';activeDevice:string|null;edges:ActionEdge[];
  key(code:string,down:boolean,time?:number,opts?:{repeat?:boolean;editable?:boolean;composing?:boolean}):boolean;
  mouse(button:number,down:boolean,time?:number):void;
  touchDown(pointerId:number,zone:string,x:number,y:number,time?:number,opts?:{stickRadius?:number}):boolean;
  touchMove(pointerId:number,x:number,y:number,time?:number):boolean;
  touchUp(pointerId:number,time?:number):boolean;
  pollGamepads(pads:ReadonlyArray<GamepadLike|null>|null,time?:number):void;
  get(action:string):{held:boolean;value:number};
  drain():ActionEdge[];
  setContext(context:'gameplay'|'menu',time?:number):void;
  releaseAll(time?:number):void;
  resetBindings(time?:number):void;
  setToggleActions(actions:string[],time?:number):void;
  rebind(action:string,newBinding:Binding,time?:number,opts?:{replaceIndex?:number}):boolean;
  exportProfile():string;
  importProfile(raw:string|{schema:number;bindings:Binding[]},time?:number):void;
  attachBrowser(opts:{window:Window;document:Document;element:HTMLElement}):()=>void;
  dispose():void;
}
