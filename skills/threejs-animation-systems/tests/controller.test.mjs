import assert from 'node:assert/strict';import test from 'node:test';
import { createAnimationController } from '../examples/animation-controller.mjs';
function makeMixer() {
 const events = new Map(); const actions = new Map();
 const calls=[];
 const mixer={timeScale:1,
  clipAction(clip){const a={name:clip.name, enabled:false,reset(){calls.push('reset:'+clip.name);return this;},setEffectiveWeight(w){calls.push('weight:'+clip.name+':'+w);return this;},play(){calls.push('play:'+clip.name);return this;}, stop(){calls.push('stop:'+clip.name);return this;}, crossFadeTo(b,d){calls.push('fade:'+clip.name+':'+b.name+':'+d);return this;},setLoop(loop,count){calls.push('loop:'+loop+':'+count);return this;}};actions.set(clip.name,a);return a;},
  update(dt){calls.push('update:'+dt);}, stopAllAction(){calls.push('stopall');},uncacheRoot(root){calls.push('uncache');},
  addEventListener(k,cb){events.set(k,cb);},removeEventListener(k,cb){if(events.get(k)===cb) events.delete(k);}
 };return {mixer,calls,events,actions};
}
test('empty clips safe and unknown transition returns false',()=>{const f=makeMixer();const c=createAnimationController({mixer:f.mixer,root:{}});assert.equal(c.transition('Walk'),false);assert.deepEqual(c.available,[]);c.dispose();});
test('exactly one transition from current to next',()=>{const f=makeMixer();const c=createAnimationController({mixer:f.mixer,root:{},clips:[{name:'Idle'},{name:'Walk'},{name:'Run'}]});c.transition('Idle');c.transition('Walk',{fade:.3});assert.deepEqual(f.calls.filter(x=>x.startsWith('fade:')),['fade:Idle:Walk:0.3']);c.dispose();});
test('repeated state does not restart',()=>{const f=makeMixer();const c=createAnimationController({mixer:f.mixer,root:{},clips:[{name:'Idle'}]});c.transition('Idle');c.transition('Idle');assert.equal(f.calls.filter(x=>x==='play:Idle').length,1);c.dispose();});
test('missing clip has no side effect',()=>{const f=makeMixer();const c=createAnimationController({mixer:f.mixer,root:{},clips:[{name:'Idle'}]});assert.equal(c.transition('Unknown'),false);assert.equal(c.state,null);c.dispose();});
test('reject negative and nonfinite deltas',()=>{const f=makeMixer();const c=createAnimationController({mixer:f.mixer,root:{}});assert.throws(()=>c.update(-.1),/delta/);assert.throws(()=>c.update(NaN),/delta/);c.update(.016);assert.ok(f.calls.includes('update:0.016'));c.dispose();});
test('pause resumes original timescale',()=>{const f=makeMixer();f.mixer.timeScale=1.5;const c=createAnimationController({mixer:f.mixer,root:{}});c.pause();c.pause();assert.equal(f.mixer.timeScale,0);c.pause(false);assert.equal(f.mixer.timeScale,1.5);c.dispose();});
test('finished event only for active action',()=>{const f=makeMixer();const completed=[];const c=createAnimationController({mixer:f.mixer,root:{},clips:[{name:'Idle'},{name:'Attack'}],onFinished:x=>completed.push(x)});c.transition('Attack');f.events.get('finished')({action:f.actions.get('Idle')});f.events.get('finished')({action:f.actions.get('Attack')});assert.deepEqual(completed,['Attack']);c.dispose();assert.equal(f.events.size,0);});
test('stop + uncache and no calls after disposal',()=>{const f=makeMixer();const c=createAnimationController({mixer:f.mixer,root:{},clips:[{name:'Idle'}]});c.dispose();c.dispose();c.update(.1);assert.equal(f.calls.filter(x=>x==='stopall').length,1);assert.equal(f.calls.filter(x=>x==='uncache').length,1);assert.throws(()=>c.transition('Idle'),/disposed/);});
test('invalid clips rejected',()=>{const f=makeMixer();assert.throws(()=>createAnimationController({mixer:f.mixer,root:{},clips:[{name:'X'},{name:'X'}]}),/duplicate/);});
test('once action sets loop when requested',()=>{const f=makeMixer();const c=createAnimationController({mixer:f.mixer,root:{},clips:[{name:'Attack'}]});c.transition('Attack',{once:true,loopOnce:'ONCE'});assert.ok(f.calls.includes('loop:ONCE:1'));c.dispose();});
