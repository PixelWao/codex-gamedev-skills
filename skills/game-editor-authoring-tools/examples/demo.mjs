import {LevelDocument, snap} from '../src/editor.mjs';
const editor=new LevelDocument();editor.add({id:'floor',kind:'platform'});editor.add({id:'crate',parent:'floor',position:{x:snap(2.7,0.5),y:1,z:0}});editor.update('crate',{position:{x:4,y:1,z:0}});editor.undo();console.log(JSON.stringify(editor.export(),null,2));
