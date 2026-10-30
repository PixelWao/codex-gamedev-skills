import {DestructionGraph} from '../src/destruction.mjs';
const structure=new DestructionGraph().addNode({id:'ground',anchored:true}).addNode({id:'column',health:50}).addNode({id:'roof'}).addBond('ground','column').addBond('column','roof');
structure.enqueueImpact({eventId:'wrecking-ball-001',nodeId:'column',impulse:75});
console.log(structure.flush()); // emits destruction for column and unsupported roof; caller updates physics next safe phase
