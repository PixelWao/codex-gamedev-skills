export type Vec2={x:number;y:number};
export type Bounds2D={minX:number;minY:number;maxX:number;maxY:number};
export interface Camera2DOptions {viewport?:{width:number;height:number};zoom?:number;bounds?:Bounds2D|null;deadzone?:Vec2;lookAhead?:number;followRate?:number;leadRate?:number;pixelSnap?:boolean;}
export declare function interpolateTarget(previous:Vec2,current:Vec2,alpha:number):Vec2;
export declare class Camera2D {
 center:Vec2; focus:Vec2; lead:Vec2; shake:Vec2; viewport:{width:number;height:number};zoom:number;bounds:Bounds2D|null;
 constructor(options?:Camera2DOptions);
 setViewport(width:number,height:number):this;setZoom(value:number):this;setBounds(value:Bounds2D|null):this;
 clampView(p:Vec2):Vec2;reset(target:Vec2):this;setShake(offset?:Vec2):this;
 update(target:Vec2,velocity?:Vec2,dt?:number):Vec2;renderCenter():Vec2;
 worldToScreen(p:Vec2):Vec2;screenToWorld(p:Vec2):Vec2;
 applyCanvasTransform(ctx:Pick<CanvasRenderingContext2D,'setTransform'>):void;
}
