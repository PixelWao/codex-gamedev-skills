import {checkJump,validatePlatforms,addThreeBlockout,type JumpCheck} from '../src/blockout.mjs';
const x:JumpCheck={runSpeed:250,jumpSpeed:480,gravity:1200,deltaY:90,deltaX:125};
const status:boolean=checkJump(x).possible;
const links=validatePlatforms([{id:'start',x:0,y:0,width:50}],x);
const adapt:typeof addThreeBlockout=addThreeBlockout;
console.log(status,links.issues.length,typeof adapt);
