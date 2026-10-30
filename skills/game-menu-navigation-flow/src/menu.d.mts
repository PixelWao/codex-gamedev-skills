export interface UIScreen{activate():void;deactivate():void;dispose?():void}
export class ScreenStack {constructor(options?:{onChange?:(screen:UIScreen|null,size:number)=>void});get size():number;get current():UIScreen|null;push(screen:UIScreen):UIScreen;pop():UIScreen|null;clear():void;}
export function domScreen(element:HTMLElement,options?:{defaultFocus?:()=>HTMLElement|null}):UIScreen;
export function createModalController(dialog:HTMLDialogElement,options?:{fallbackFocus?:HTMLElement|null}):{open():boolean;close():boolean;readonly isOpen:boolean;dispose():void;focusFallback():void};
export type UIAction='up'|'down'|'left'|'right'|'confirm'|'back';
export function createInputRouter(options:{onAction:(action:UIAction,device:'keyboard'|'gamepad')=>void;keyboardTarget?:Document|HTMLElement;gamepads?:()=>ArrayLike<Gamepad|null>;threshold?:number}):{poll():void;dispose():void};
export function bindPointerActions(surface:HTMLElement,options?:{onStart?:(id:number,pos:{x:number;y:number})=>void;onEnd?:(id:number,pos:{x:number;y:number})=>void;onCancel?:(id:number)=>void}):{readonly activeCount:number;dispose():void};
