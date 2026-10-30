import test from 'node:test';import assert from 'node:assert/strict';
import {JumpAssist,InputTimeline,FixedStepEdgeQueue} from '../src/timing.mjs';
test('jump from grounded consumes exactly once',()=>{const j=new JumpAssist();j.setGrounded(0,true);j.press(10,'p1');assert.equal(j.tryConsume(10).inputId,'p1');assert.equal(j.tryConsume(20),null);});
test('input buffer survives until landing',()=>{const j=new JumpAssist({bufferMs:120});j.setGrounded(0,false);j.press(100,'p');assert.equal(j.tryConsume(120),null);j.setGrounded(200,true);assert.equal(j.tryConsume(200).inputId,'p');});
test('expired buffer does not jump',()=>{const j=new JumpAssist({bufferMs:120});j.setGrounded(0,false);j.press(10,'p');j.setGrounded(150,true);assert.equal(j.tryConsume(150),null);});
test('coyote jump only within grace',()=>{const j=new JumpAssist({coyoteMs:100});j.setGrounded(0,true);j.setGrounded(1,false);j.press(90,'p');assert.equal(j.tryConsume(90).inputId,'p');});
test('coyote expires without landing',()=>{const j=new JumpAssist({coyoteMs:100});j.setGrounded(0,true);j.setGrounded(1,false);j.press(150,'p');assert.equal(j.tryConsume(150),null);});
test('coyote consumed until next landing',()=>{const j=new JumpAssist();j.setGrounded(0,true);j.press(1,'a');assert.ok(j.tryConsume(1));j.setGrounded(2,false);j.press(3,'b');assert.equal(j.tryConsume(3),null);j.setGrounded(20,true);assert.equal(j.tryConsume(20).inputId,'b');});
test('no duplicate input ID',()=>{const j=new JumpAssist();assert.equal(j.press(1,'id'),true);assert.equal(j.press(2,'id'),false);});
test('release exposes jump cut request only once',()=>{const j=new JumpAssist();j.press(1,'p');assert.equal(j.release(2),true);assert.equal(j.release(3),false);});
test('cancel clears buffered input',()=>{const j=new JumpAssist();j.press(1,'p');j.cancel(2);j.setGrounded(3,true);assert.equal(j.tryConsume(3),null);});
test('non monotonic timestamps rejected',()=>{const j=new JumpAssist();j.press(10,'a');assert.throws(()=>j.release(9),RangeError);});
test('invalid parameters rejected',()=>{assert.throws(()=>new JumpAssist({bufferMs:-1}));assert.throws(()=>new JumpAssist({coyoteMs:Infinity}));});
test('fixed queue retains edges between physics ticks',()=>{const q=new FixedStepEdgeQueue();q.capture({time:3,type:'pressed',action:'jump'});q.capture({time:7,type:'released',action:'jump'});assert.equal(q.drainThrough(5).length,1);assert.equal(q.drainThrough(10).length,1);});
test('fixed queue drains only once',()=>{const q=new FixedStepEdgeQueue();q.capture({time:1,type:'pressed',action:'jump'});q.drainThrough(2);assert.deepEqual(q.drainThrough(3),[]);});
test('timeline JSONL roundtrip preserves order',()=>{const t=new InputTimeline();t.record({type:'press',id:'a',time:1});t.record({type:'release',id:'b',time:2});const c=InputTimeline.fromJSONL(t.toJSONL());assert.deepEqual(c.events,t.events);});
test('timeline rejects duplicate IDs and time reversal',()=>{const t=new InputTimeline();t.record({type:'press',id:'a',time:2});assert.throws(()=>t.record({type:'press',id:'a',time:3}),/duplicate/);assert.throws(()=>t.record({type:'release',time:1}),RangeError);});
test('determinism 30 / 60 / 144 physics tick rates',()=>{const outcomes=[];for(const fps of [30,60,144]){
  const j=new JumpAssist();let completed=null;let landed=false,pressed=false;
  for(let tick=0;tick<=fps;tick++){const t=tick*1000/fps;
    if(!pressed&&t>=100){j.press(100,'jump');pressed=true;}
    if(!landed&&t>=150){j.setGrounded(150,true);landed=true;}
    if(!landed)j.setGrounded(t,false); // no call after landing this tick
    const hit=j.tryConsume(t);if(hit&&!completed)completed=hit.inputId;
  }outcomes.push(completed);
 }assert.deepEqual(outcomes,['jump','jump','jump']);});
test('edge queue no double-fire for subframe pulse',()=>{const q=new FixedStepEdgeQueue();q.capture({time:1,type:'pressed',action:'jump'});q.capture({time:2,type:'released',action:'jump'});assert.deepEqual(q.drainThrough(17).map(e=>e.type),['pressed','released']);assert.equal(q.drainThrough(34).length,0);});
