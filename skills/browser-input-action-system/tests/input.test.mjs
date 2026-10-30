import test from 'node:test';import assert from 'node:assert/strict';
import {InputActions,radialDeadzone,axisDeadzone,validateBindings} from '../src/input.mjs';
const base=[
 {type:'key',context:'gameplay',action:'jump',code:'Space'},
 {type:'key',context:'gameplay',action:'moveX',code:'KeyA',scale:-1},
 {type:'key',context:'gameplay',action:'moveX',code:'KeyD',scale:1},
 {type:'gamepad-axis',context:'gameplay',action:'moveX',axis:0},
 {type:'touch-axis',context:'gameplay',action:'moveX',zone:'stick',axis:'x'},
 {type:'touch-button',context:'gameplay',action:'jump',zone:'jump'},
 {type:'gamepad-button',context:'gameplay',action:'jump',button:0},
 {type:'key',context:'menu',action:'back',code:'Escape'},
 {type:'key',context:'menu',action:'confirm',code:'Enter'},
];
function sut(){return new InputActions(base,{clock:()=>0,deviceQuietMs:0});}
test('radial input diagonal normalized and within unit circle',()=>{assert.ok(Math.hypot(...Object.values(radialDeadzone(1,1)))<=1+1e-12);assert.deepEqual(radialDeadzone(.1,0),{x:0,y:0});});
test('radial zero denominator and negative sensitivity rejected',()=>{assert.throws(()=>radialDeadzone(1,0,1),RangeError);assert.throws(()=>radialDeadzone(.5,.2,.2,-2),RangeError);});
test('axis clamps magnitude and has sign',()=>{assert.equal(axisDeadzone(8),1);assert.equal(axisDeadzone(-8),-1);assert.equal(axisDeadzone(.02),0);});
test('reject binding conflicts per context',()=>{assert.throws(()=>validateBindings([...base,{type:'key',context:'gameplay',action:'dash',code:'Space'}]),/conflict/);});
test('same key in separate contexts is valid',()=>{assert.doesNotThrow(()=>validateBindings([...base,{type:'key',context:'menu',action:'confirm',code:'Space'}]));});
test('short tap produces one press and one release before next physics tick',()=>{const s=sut();s.key('Space',true,1);s.key('Space',false,2);assert.deepEqual(s.drain().map(e=>e.type),['pressed','released']);assert.equal(s.get('jump').held,false);});
test('keydown repeat cannot retrigger',()=>{const s=sut();s.key('Space',true,1);s.key('Space',true,2,{repeat:true});assert.equal(s.drain().length,1);});
test('two simultaneously held keys compose scalar axis',()=>{const s=sut();s.key('KeyA',true,1);assert.equal(s.get('moveX').value,-1);s.key('KeyD',true,2);assert.equal(s.get('moveX').value,0);s.key('KeyA',false,3);assert.equal(s.get('moveX').value,1);});
test('touch stick and touch jump simultaneous',()=>{const s=sut();s.touchDown(11,'stick',100,100,1);s.touchDown(12,'jump',200,100,2);s.touchMove(11,164,100,3);assert.equal(s.get('jump').held,true);assert.ok(s.get('moveX').value>0.9);s.touchUp(12,4);assert.equal(s.get('jump').held,false);assert.ok(s.get('moveX').value>0);});
test('pointer cancellation releases held zone and axes',()=>{const s=sut();s.touchDown(1,'stick',0,0,1);s.touchMove(1,64,0,2);s.touchUp(1,3);assert.equal(s.get('moveX').value,0);assert.equal(s.touch.size,0);});
test('gamepad hot unplug releases active button',()=>{const s=sut();s.pollGamepads([{index:0,connected:true,buttons:[{value:1}],axes:[0]}],1);assert.equal(s.get('jump').held,true);s.pollGamepads([null],2);assert.equal(s.get('jump').held,false);});
test('gamepad axis ignores analog drift',()=>{const s=sut();s.pollGamepads([{index:0,connected:true,buttons:[],axes:[.05]}],1);assert.equal(s.get('moveX').value,0);});
test('composition/editable input cannot move character',()=>{const s=sut();s.key('Space',true,1,{editable:true});s.key('Space',true,2,{composing:true});assert.equal(s.drain().length,0);});
test('context switch releases inputs and clears edges',()=>{const s=sut();s.key('Space',true,1);s.setContext('menu',2);assert.equal(s.get('jump').held,false);assert.deepEqual(s.drain(),[]);s.key('Escape',true,3);assert.equal(s.get('back').held,true);});
test('rebind affects inputs and detects conflict without mutating original',()=>{const s=sut();assert.throws(()=>s.rebind('jump',{context:'gameplay',type:'key',code:'KeyD'},1),/conflict/);s.rebind('jump',{context:'gameplay',type:'key',code:'KeyJ'},2);s.key('Space',true,3);assert.equal(s.get('jump').held,false);s.key('KeyJ',true,4);assert.equal(s.get('jump').held,true);});
test('rebind menu requires remaining back',()=>{const s=sut();assert.throws(()=>s.rebind('back',{type:'key',context:'gameplay',code:'KeyZ'},1),/existing action\/context/);});
test('profile roundtrip and reset defaults',()=>{const s=sut();s.rebind('jump',{context:'gameplay',type:'key',code:'KeyJ'},1);const saved=s.exportProfile();const s2=sut();s2.importProfile(saved,2);s2.key('KeyJ',true,3);assert.equal(s2.get('jump').held,true);s2.resetBindings(4);s2.key('Space',true,5);assert.equal(s2.get('jump').held,true);});
test('import invalid schema does not modify binding map',()=>{const s=sut();assert.throws(()=>s.importProfile({schema:2,bindings:[]},1));s.key('Space',true,2);assert.equal(s.get('jump').held,true);});
test('device active follows meaningful activity and quiet period',()=>{const s=new InputActions(base,{clock:()=>0,deviceQuietMs:100});s.key('Space',true,1);assert.equal(s.activeDevice,'keyboard');s.pollGamepads([{index:0,buttons:[{value:1}],axes:[]}],2);assert.equal(s.activeDevice,'keyboard');s.pollGamepads([{index:0,buttons:[{value:1}],axes:[]}],200);assert.equal(s.activeDevice,'gamepad');});
test('dispose drops all physical state and listeners',()=>{const s=sut();s.key('Space',true,1);s.dispose();assert.equal(s.get('jump').held,false);});

test('hold vs toggle accessibility action flips once per press',()=>{
 const bindings=[...base,{context:'gameplay',type:'key',action:'aim',code:'KeyQ'}];
 const s=new InputActions(bindings,{toggleActions:['aim'],clock:()=>0,deviceQuietMs:0});
 s.key('KeyQ',true,1);assert.equal(s.get('aim').held,true);
 s.key('KeyQ',false,2);assert.equal(s.get('aim').held,true);
 s.key('KeyQ',true,3);assert.equal(s.get('aim').held,false);
 s.key('KeyQ',false,4);assert.deepEqual(s.drain().filter(e=>e.action==='aim').map(e=>e.type),['pressed','released']);
});
test('blur resets toggled controls',()=>{
 const bindings=[...base,{context:'gameplay',type:'key',action:'aim',code:'KeyQ'}];
 const s=new InputActions(bindings,{toggleActions:['aim'],clock:()=>0});s.key('KeyQ',true,1);s.releaseAll(2);assert.equal(s.get('aim').held,false);
});
test('same logical button from two physical devices is not released early',()=>{const s=sut();s.key('Space',true,1);s.touchDown(1,'jump',0,0,2);s.key('Space',false,3);assert.equal(s.get('jump').held,true);s.touchUp(1,4);assert.deepEqual(s.drain().filter(e=>e.action==='jump').map(e=>e.type),['pressed','released']);});

test('axis both overlaps positive but not opposite single-axis controls',()=>{
 const axes=[{type:'gamepad-axis',context:'gameplay',action:'left',axis:0,direction:'negative'},
 {type:'gamepad-axis',context:'gameplay',action:'right',axis:0,direction:'positive'}];
 assert.doesNotThrow(()=>validateBindings(axes));
 assert.throws(()=>validateBindings([...axes,{type:'gamepad-axis',context:'gameplay',action:'move',axis:0,direction:'both'}]),/conflict/);
});
test('global binding conflicts with active contextual binding',()=>{
 assert.throws(()=>validateBindings([...base,{type:'key',context:'global',action:'openMenu',code:'Space'}]),/conflict/);
});
