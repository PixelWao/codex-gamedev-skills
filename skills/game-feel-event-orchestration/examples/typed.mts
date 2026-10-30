import {HitStopManager,FeedbackDirector,TraumaShake} from '../src/feedback.mjs';
const s:HitStopManager=new HitStopManager();const f=new FeedbackDirector({hitstop:s,shake:new TraumaShake()});
f.emit({id:'hit1',atMs:0,tier:'medium'});s.tick(100);
