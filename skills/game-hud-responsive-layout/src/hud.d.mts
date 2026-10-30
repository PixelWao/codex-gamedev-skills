export type Rect={x:number;y:number;width:number;height:number};
export type Insets={top?:number;right?:number;bottom?:number;left?:number};
export function safeRect(viewport:{width:number;height:number},insets?:Insets):Rect & {insets:Required<Insets>};
export function layoutForViewport(args:{width:number;height:number;dpr?:number;insets?:Insets;referenceWidth?:number;referenceHeight?:number;minScale?:number;maxScale?:number}):{cssWidth:number;cssHeight:number;backingWidth:number;backingHeight:number;dpr:number;safe:Rect & {insets:Required<Insets>};scale:number};
export function configureCanvas(canvas:HTMLCanvasElement,width:number,height:number,dpr?:number):{ctx:CanvasRenderingContext2D;layout:ReturnType<typeof layoutForViewport>};
export function healthFraction(current:number,maximum:number):number;
export interface HudStore<T> {getSnapshot():T;subscribe(fn:()=>void):()=>void;}
export function bindHud<T,V>(args:{store:HudStore<T>;select:(s:T)=>V;render:(value:V)=>void}):()=>void;
export function makeHudStore<T extends object>(initial?:T):HudStore<T>&{patch(p:Partial<T>):void};
export function projectThreeToCss(worldPoint:{x:number;y:number;z:number},camera:{matrixWorldInverse:unknown;projectionMatrix:unknown},rect:{left:number;top:number;width:number;height:number},Vector3Ctor:new(x:number,y:number,z:number)=>{x:number;y:number;z:number;applyMatrix4(m:unknown):unknown}):{x:number;y:number;visible:boolean;behind:boolean};
export function watchViewport(element:Element,onChange:(size:{width:number;height:number;dpr:number})=>void,options?:{observerCtor?:typeof ResizeObserver;visualViewport?:VisualViewport;windowObject?:Window}):()=>void;
