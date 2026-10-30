export type Vec3={x:number;y:number;z:number};
export type EditorNode={id:string;kind:string;parent:string|null;position:Vec3;rotation:Vec3;scale:Vec3;properties:Record<string,unknown>};
export declare function snap(value:number,increment:number):number;
export declare class LevelDocument {
 revision:number;
 nodes:Map<string,EditorNode>;
 add(options:{id:string;kind?:string;parent?:string|null;position?:Vec3;rotation?:Vec3;scale?:Vec3;properties?:Record<string,unknown>}):EditorNode;
 update(id:string,patch:Partial<Pick<EditorNode,'position'|'rotation'|'scale'|'parent'|'properties'>>):EditorNode;
 remove(id:string):boolean;
 duplicate(id:string,newId:string):EditorNode;
 export():{schema:1;nodes:EditorNode[]};
 import(json:{schema:1;nodes:EditorNode[]}):this;
 undo():boolean; redo():boolean;
 static fromObject(json:{schema:1;nodes:EditorNode[]}):LevelDocument;
}
export declare function applyTransformToThreeNode(node:EditorNode,object3d:{position:{set(x:number,y:number,z:number):void};rotation:{set(x:number,y:number,z:number):void};scale:{set(x:number,y:number,z:number):void}}):void;
