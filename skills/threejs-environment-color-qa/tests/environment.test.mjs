import test from'node:test';import assert from'node:assert/strict';
import {createEnvironmentOwner}from'../examples/environment-owner.mjs';
import {auditColorPipeline}from'../scripts/color_pipeline_audit.mjs';
function fixtures(){let n=0;const targets=[];let rooms=0,gens=0;const scene={environment:'original'};const owner=createEnvironmentOwner({scene,makeGenerator(){return {fromScene(){const target={texture:{id:++n},calls:0,dispose(){this.calls++;}};targets.push(target);return target;},fromEquirectangular(){const target={texture:{id:++n},calls:0,dispose(){this.calls++;}};targets.push(target);return target;},dispose(){gens++;}};},makeRoom(){return{dispose(){rooms++;}};}});return {owner,scene,targets,get rooms(){return rooms;},get gens(){return gens;}};}
test('room returns active target texture',()=>{const f=fixtures();const texture=f.owner.setRoomEnvironment();assert.equal(f.scene.environment,texture);assert.equal(f.targets[0].calls,0);assert.equal(f.rooms,1);assert.equal(f.gens,1);f.owner.dispose();});
test('swap disposes old target but not new',()=>{const f=fixtures();f.owner.setRoomEnvironment();f.owner.setRoomEnvironment();assert.equal(f.targets[0].calls,1);assert.equal(f.targets[1].calls,0);});
test('dispose detaches and is idempotent',()=>{const f=fixtures();f.owner.setRoomEnvironment();f.owner.dispose();f.owner.dispose();assert.equal(f.scene.environment,'original');assert.equal(f.targets[0].calls,1);});
test('owner does not clear external replacement',()=>{const f=fixtures();f.owner.setRoomEnvironment();f.scene.environment='external';f.owner.dispose();assert.equal(f.scene.environment,'external');});
test('bad sigma leaves old environment alone',()=>{const f=fixtures();f.owner.setRoomEnvironment();const texture=f.scene.environment;assert.throws(()=>f.owner.setRoomEnvironment(-1),/sigma/);assert.equal(f.scene.environment,texture);});
test('HDR loader input is disposed after conversion',async()=>{const f=fixtures();let calls=0;await f.owner.setHDR(async()=>({dispose(){calls++;}}));assert.equal(calls,1);assert.equal(f.targets.length,1);});
test('failed HDR load does not disturb old',async()=>{const f=fixtures();f.owner.setRoomEnvironment();const texture=f.scene.environment;await assert.rejects(f.owner.setHDR(async()=>{throw Error('network');}),/network/);assert.equal(f.scene.environment,texture);});
test('disposed owner refuses reuse',()=>{const f=fixtures();f.owner.dispose();assert.throws(()=>f.owner.setRoomEnvironment(),/disposed/);});
const okManifest=()=>({renderer:{backend:'WebGLRenderer',outputColorSpace:'SRGBColorSpace',toneMappingExposure:1},postprocessing:{enabled:true,outputPassCount:1,manualGammaPass:false},textures:[{role:'albedo',colorSpace:'SRGBColorSpace'},{role:'normal',colorSpace:'NoColorSpace'}]});
test('well-labeled pipeline passes',()=>assert.equal(auditColorPipeline(okManifest()).ok,true));
test('double gamma detected',()=>{const m=okManifest();m.postprocessing.manualGammaPass=true;assert.equal(auditColorPipeline(m).ok,false);});
test('missing OutputPass detected',()=>{const m=okManifest();m.postprocessing.outputPassCount=0;assert.equal(auditColorPipeline(m).ok,false);});
test('bad non-color map role rejected',()=>{const m=okManifest();m.textures[1].colorSpace='SRGBColorSpace';assert.equal(auditColorPipeline(m).ok,false);});
test('negative exposure rejected',()=>{const m=okManifest();m.renderer.toneMappingExposure=-1;assert.equal(auditColorPipeline(m).ok,false);});

test('out-of-order HDR load cannot replace newer room',async()=>{
  const f=fixtures();let release;const delayed=new Promise(resolve=>{release=resolve});
  const pending=f.owner.setHDR(async()=>{await delayed;return{dispose(){}};});
  const newest=f.owner.setRoomEnvironment();release();
  await assert.rejects(pending,/Stale/);assert.equal(f.scene.environment,newest);
  assert.equal(f.targets.length,1);
});
