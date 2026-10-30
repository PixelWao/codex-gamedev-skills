import {LevelTrace,type LevelEvent} from '../src/telemetry.mjs';
const event:LevelEvent={id:'1',time:0,type:'enter',room:'start'};
const trace=new LevelTrace();trace.record(event);const count:number=trace.summary().count;
console.log(count);
