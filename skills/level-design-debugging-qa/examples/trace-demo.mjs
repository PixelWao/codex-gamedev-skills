import {LevelTrace} from '../src/telemetry.mjs';
const trace=new LevelTrace();trace.record({id:'evt-0',time:0,type:'enter',room:'entry'});trace.record({id:'evt-1',time:2.5,type:'checkpoint',room:'side'});
console.log(trace.toJSONL());console.log(trace.summary());
