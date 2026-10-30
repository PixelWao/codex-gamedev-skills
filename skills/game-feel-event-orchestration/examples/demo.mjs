import {HitStopManager,TraumaShake,FeedbackDirector} from '../src/feedback.mjs';
let output;const hitstop=new HitStopManager({baseScale:()=>.75,applyScale:s=>output=s});
const shake=new TraumaShake(),director=new FeedbackDirector({hitstop,shake,sinks:{audio:e=>console.log(e.cue)}});
director.emit({id:'boss-hit:1',atMs:0,tier:'large',kind:'impact'});
console.log('during',output,'offset',shake.sample(.016,.016));hitstop.tick(101);console.log('after',output);
