import {TraceRecorder} from '../src/trace.mjs';const trace:TraceRecorder=new TraceRecorder();trace.push({type:'feedback_accepted',atMs:1,eventId:'hit',channels:['audio']});void trace.jsonl();
