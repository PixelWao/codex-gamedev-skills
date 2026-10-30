import {DestructionGraph,impulseFromContactForce} from '../src/destruction.mjs';
const structure=new DestructionGraph().addNode({id:'root',anchored:true});
const m:number=impulseFromContactForce(12,1/60);
structure.enqueueImpact({eventId:'demo-1',nodeId:'root',impulse:m});
const result=structure.flush();console.log(result.revision);
