import {LevelDocument,snap} from '../src/editor.mjs';
const d=new LevelDocument();d.add({id:'floor'});const x:number=snap(2.9,0.5);d.update('floor',{position:{x,y:0,z:0}});console.log(d.export().schema);
