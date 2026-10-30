import {InputTraceRecorder,type TraceEvent} from '../src/recorder.mjs';
const recorder=new InputTraceRecorder({clock:()=>5});const e:TraceEvent=recorder.add('down',{device:'keyboard',control:'Space'});
const text:string=recorder.exportJSONL();void [e,text];
