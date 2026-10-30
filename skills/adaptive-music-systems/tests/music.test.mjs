import test from 'node:test'; import assert from 'node:assert/strict';
import {MusicalClock, secondsPerBeat, smoothIntensity,hysteresisLevel,AdaptiveMusicDirector} from '../scripts/adaptive-music.mjs';
class P {constructor(){this.value=1;this.ops=[];}setValueAtTime(v,t){this.value=v;this.ops.push(['set',v,t]);}cancelScheduledValues(t){this.ops.push(['cancel',t]);}linearRampToValueAtTime(v,t){this.value=v;this.ops.push(['ramp',v,t]);}}
class N {constructor(){this.gain=new P();this.onended=null;this.links=[];this.startAt=null;} connect(n){this.links.push(n);return n;}disconnect(){this.links=[];}start(t){this.startAt=t;}stop(t){this.stopAt=t;}}
class C {constructor(){this.currentTime=0;this.created=[];}createGain(){const n=new N();this.created.push(n);return n;}createBufferSource(){const n=new N();this.created.push(n);return n;}}
const buffer=(frames=48000)=>({duration:frames/48000,sampleRate:48000,length:frames});
test('120 BPM half second',()=>assert.equal(secondsPerBeat(120),.5));
test('invalid BPM fails',()=>assert.throws(()=>secondsPerBeat(0)));
test('boundary exactly now no artificial delay',()=>assert.equal(new MusicalClock({bpm:120}).boundaryAtOrAfter(2),2));
test('next bar from middle',()=>assert.equal(new MusicalClock({bpm:120}).boundaryAtOrAfter(2.1),4));
test('next beat quantizes',()=>assert.equal(new MusicalClock({bpm:120}).beatAtOrAfter(1.2),1.5));
test('bar quantization two bars',()=>assert.equal(new MusicalClock({bpm:120}).boundaryAtOrAfter(2.1,{bars:2}),4));
test('invalid bars fails',()=>assert.throws(()=>new MusicalClock().boundaryAtOrAfter(2,{bars:0})));
test('fps-invariant smoothing',()=>{let a=0,b=0;for(let i=0;i<30;i++)a=smoothIntensity(a,1,1/30,1);for(let i=0;i<144;i++)b=smoothIntensity(b,1,1/144,1);assert.ok(Math.abs(a-b)<1e-10);});
test('smoothing zero constant immediate',()=>assert.equal(smoothIntensity(0,1,.1,0),1));
test('hysteresis holds under upper boundary',()=>assert.equal(hysteresisLevel(.5,0),0));
test('hysteresis keeps high until low threshold',()=>assert.equal(hysteresisLevel(.5,1),1));
test('stem frame mismatch refused',()=>{const c=new C(),d=new AdaptiveMusicDirector({context:c,output:new N()});assert.throws(()=>d.startStems({base:buffer(),drums:buffer(48001)}));d.dispose();});
test('stems share exactly the same audio start time',()=>{const c=new C(),d=new AdaptiveMusicDirector({context:c,output:new N()});d.startStems({base:buffer(),drums:buffer()},{at:1});const starts=[...d.stems.values()].map(t=>t.source.startAt);assert.deepEqual(starts,[1,1]);d.dispose();});
test('silent stem may fade in',()=>{const c=new C(),d=new AdaptiveMusicDirector({context:c,output:new N()});d.startStems({base:buffer(),drums:buffer()});d.setStem('drums',true,{fadeSeconds:.4});assert.ok(d.stems.get('drums').volume.gain.ops.some(op=>op[0]==='ramp'));d.dispose();});
test('section scheduled at next bar',()=>{const c=new C(),d=new AdaptiveMusicDirector({context:c,output:new N(),lookaheadSeconds:.1});const at=d.requestSection(buffer());assert.equal(at,2);assert.equal(d.current.token.source.startAt,2);d.dispose();});
test('queued future section cannot double queue',()=>{const c=new C(),d=new AdaptiveMusicDirector({context:c,output:new N()});d.requestSection(buffer());assert.throws(()=>d.requestSection(buffer()),/pending/);d.dispose();});
test('dispose is idempotent',()=>{const c=new C(),d=new AdaptiveMusicDirector({context:c,output:new N()});d.startStems({base:buffer()});d.dispose();d.dispose();assert.equal(d.closed,true);});
