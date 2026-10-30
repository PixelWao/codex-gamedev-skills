import {JumpAssist,FixedStepEdgeQueue,InputTimeline,type JumpEvent} from '../src/timing.mjs';
const j=new JumpAssist();j.setGrounded(0,true);j.press(1,'1');const e:JumpEvent|null=j.tryConsume(2);
const q=new FixedStepEdgeQueue();q.capture({type:'pressed',action:'jump',time:1});q.drainThrough(2);
const timeline=new InputTimeline();timeline.record({time:1,type:'press',id:'a'});void [e,timeline];
