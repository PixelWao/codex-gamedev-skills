import {InputActions,radialDeadzone,type Binding,type ActionEdge} from '../src/input.mjs';
const bindings:Binding[]=[{type:'key',context:'gameplay',action:'jump',code:'Space'},{type:'key',context:'menu',action:'back',code:'Escape'}];
const actions=new InputActions(bindings,{clock:()=>0});actions.key('Space',true,10);
const value:number=actions.get('jump').value;const edges:ActionEdge[]=actions.drain();
const v:{x:number;y:number}=radialDeadzone(.5,.5);void [value,edges,v];
