import test from 'node:test';
import assert from 'node:assert/strict';
import { BrowserGameAudio,sliderGain,dbToGain,gainToDb } from '../scripts/audio-engine.mjs';
class Param {constructor(){this.value=1;this.calls=[];} cancelScheduledValues(t){this.calls.push(['cancel',t]);} setTargetAtTime(v,t,c){this.calls.push(['target',v,t,c]);this.value=v;} setValueAtTime(v,t){this.calls.push(['set',v,t]);this.value=v;} linearRampToValueAtTime(v,t){this.value=v;this.calls.push(['ramp',v,t]);}}
class Node { constructor(){this.links=[];this.gain=new Param();this.positionX=new Param();this.positionY=new Param();this.positionZ=new Param();this.playbackRate=new Param();} connect(n){this.links.push(n);return n;}disconnect(){this.links=[];} start(t){this.startTime=t;}stop(){this.wasStopped=true;this.onended?.();}}
class Context {constructor(){this.destination=new Node();this.currentTime=1;this.state='suspended';this.created=[];} createGain(){const n=new Node();this.created.push(n);return n;}createBufferSource(){const n=new Node();this.created.push(n);return n;}createPanner(){const n=new Node();this.created.push(n);return n;}async resume(){this.state='running';}async suspend(){this.state='suspended';}}
const buf={duration:1.2};
test('0 slider is exact silence',()=>assert.equal(sliderGain(0),0));
test('db conversion roundtrip',()=>assert.ok(Math.abs(gainToDb(dbToGain(-12))+12)<1e-9));
test('invalid volume fails',()=>assert.throws(()=>sliderGain(2),RangeError));
test('unlock resumes on explicit call',async()=>{const c=new Context(),a=new BrowserGameAudio({context:c});assert.equal(await a.unlock(),true);a.dispose();});
test('five buses connected',()=>{const a=new BrowserGameAudio({context:new Context()});assert.equal(a.buses.size,5);a.dispose();});
test('mute then unmute honors stored setting',()=>{const a=new BrowserGameAudio({context:new Context()});a.setMasterLevel(.5);a.setMute(true);assert.equal(a.master.gain.value,0);a.setMute(false);assert.equal(a.master.gain.value,.25);a.dispose();});
test('duck changes only additional gain, never saved music volume',()=>{const a=new BrowserGameAudio({context:new Context()});a.setBusLevel('music',.5);a.duckMusic(true);assert.equal(a.buses.get('music').gain.value,.25);assert.ok(a.musicDucker.gain.value < 1);a.dispose();});
test('voice budget reject',()=>{const a=new BrowserGameAudio({context:new Context(),maxVoices:1});assert.ok(a.play(buf));assert.equal(a.play(buf,{steal:'reject'}),null);a.dispose();});
test('steal lower priority not higher',()=>{const a=new BrowserGameAudio({context:new Context(),maxVoices:1});const high=a.play(buf,{priority:10});assert.equal(a.play(buf,{priority:1}),null);assert.ok(!high.stopped);a.dispose();});
test('higher priority replaces oldest',()=>{const a=new BrowserGameAudio({context:new Context(),maxVoices:1});const low=a.play(buf,{priority:1});assert.ok(a.play(buf,{priority:3}));assert.equal(low.stopped,true);a.dispose();});
test('cooldown suppresses repeated sounds',()=>{const c=new Context(),a=new BrowserGameAudio({context:c});assert.ok(a.play(buf,{cooldownKey:'metal',cooldownSeconds:.2}));assert.equal(a.play(buf,{cooldownKey:'metal',cooldownSeconds:.2}),null);c.currentTime+=.25;assert.ok(a.play(buf,{cooldownKey:'metal',cooldownSeconds:.2}));a.dispose();});
test('empty sample pool refused',()=>{const a=new BrowserGameAudio({context:new Context()});assert.throws(()=>a.playVaried([]));a.dispose();});
test('varied buffer deterministic choice',()=>{const a=new BrowserGameAudio({context:new Context(),rng:()=>.75});const v=a.playVaried([{duration:2},{duration:3}]);assert.equal(v.source.buffer.duration,3);a.dispose();});
test('spatial panner applies position',()=>{const a=new BrowserGameAudio({context:new Context()});const v=a.play(buf,{position:[1,2,3]});assert.equal(v.source.links[0].links[0].positionZ.value,3);a.dispose();});
test('dispose idempotent and does not close shared context',()=>{const c=new Context(),a=new BrowserGameAudio({context:c});a.play(buf);a.dispose();a.dispose();assert.equal(a.voices.size,0);assert.equal(c.state,'suspended');});
test('failed fetch can retry',async()=>{const a=new BrowserGameAudio({context:new Context()});let n=0;const fetcher=async()=>{n++;return {ok:false,status:500};};await assert.rejects(a.loadBuffer('/a',{fetcher}));await assert.rejects(a.loadBuffer('/a',{fetcher}));assert.equal(n,2);a.dispose();});
