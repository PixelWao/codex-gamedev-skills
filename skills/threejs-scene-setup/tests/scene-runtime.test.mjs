import test from 'node:test';
import assert from 'node:assert/strict';
import { createFrameCoordinator, installOwnedAnimationLoop, createDemandScheduler } from '../scripts/frame-coordinator.mjs';
import { computeViewport, createViewportController } from '../scripts/viewport-controller.mjs';
import { createResourceRegistry, createLifecycleScope } from '../scripts/resource-scope.mjs';
import { toNDC, reparentPreservingWorld } from '../scripts/scenegraph-helpers.mjs';

function makeRenderer() {
  const log = [];
  return { log, setAnimationLoop(callback) { this.callback = callback; log.push(['loop', Boolean(callback)]); },
    setPixelRatio(v) { log.push(['dpr', v]); },
    setSize(...v) { log.push(['size', ...v]); }, render() { log.push(['render']); } };
}

test('coordinator first frame dt=0, subsequent correct seconds', () => {
  const values=[]; const c=createFrameCoordinator({ update: d=>values.push(d) });
  c.tick(200); c.tick(216); assert.deepEqual(values,[0,0.016]);
});
test('coordinator clamps negative and huge time gaps',()=>{
  const values=[]; const c=createFrameCoordinator({update:d=>values.push(d)});
  c.tick(100); c.tick(600); c.tick(590); assert.deepEqual(values,[0,0.05,0]);
});
test('pause resets timing, blocks rendering, resume does not spike',()=>{
  const values=[]; let draws=0; const c=createFrameCoordinator({update:d=>values.push(d),draw:()=>draws++});
  c.tick(0);c.pause(); assert.equal(c.tick(999999),false);c.resume();c.tick(1000000); assert.deepEqual(values,[0,0]);assert.equal(draws,2);
});
test('rejects invalid dt and timestamps',()=>{
  assert.throws(()=>createFrameCoordinator({maxDeltaSeconds:0}),RangeError);
  assert.throws(()=>createFrameCoordinator().tick(NaN), TypeError);
});
test('coordinator dispose is idempotent',()=>{
  const c=createFrameCoordinator();c.tick(0);c.dispose();c.dispose();assert.equal(c.tick(10),false);
});
test('no loop installation without explicit ownership',()=>{
  assert.throws(()=>installOwnedAnimationLoop({renderer:makeRenderer(),coordinator:createFrameCoordinator()}),/confirmation/);
});
test('single owned loop, duplicate rejected, teardown stops it',()=>{
  const renderer=makeRenderer();const c=createFrameCoordinator();
  const stop=installOwnedAnimationLoop({renderer,coordinator:c,confirmExclusiveOwnership:true});
  assert.throws(()=>installOwnedAnimationLoop({renderer,coordinator:c,confirmExclusiveOwnership:true}),/already installed/);
  renderer.callback(100);stop();stop();assert.deepEqual(renderer.log,[['loop',true],['loop',false]]);
});
test('owned loop resets registry after renderer setAnimationLoop failure',()=>{
  const renderer=makeRenderer();renderer.setAnimationLoop=()=>{throw Error('failed')};
  assert.throws(()=>installOwnedAnimationLoop({renderer,coordinator:createFrameCoordinator(),confirmExclusiveOwnership:true}),/failed/);
});
test('demand scheduler merges invalidations',()=>{
  const tasks=new Map();let id=0,drawn=0;
  const q=createDemandScheduler({requestFrame: cb=>(tasks.set(++id,cb),id),cancelFrame: i=>tasks.delete(i),draw:()=>drawn++});
  assert.equal(q.invalidate(),true);assert.equal(q.invalidate(),false);assert.equal(tasks.size,1);
  const [,fn]=[...tasks][0];tasks.clear();fn(12);assert.equal(drawn,1);q.dispose();
});
test('demand scheduler can request next frame during controls update',()=>{
  const tasks=new Map();let id=0,drawn=0, q;
  q=createDemandScheduler({requestFrame: cb=>(tasks.set(++id,cb),id),cancelFrame: i=>tasks.delete(i),draw:()=>drawn++,
    updateControls:()=>{if(drawn===0) q.invalidate();}});
  q.invalidate();const first=tasks.get(1);tasks.delete(1);first(0);
  assert.equal(tasks.size,1);const second=tasks.get(2);second(16);assert.equal(drawn,2);q.dispose();
});
test('demand pause cancels frame and resume schedules new one',()=>{
  const tasks=new Map();let id=0;const q=createDemandScheduler({requestFrame: cb=>(tasks.set(++id,cb),id),cancelFrame:i=>tasks.delete(i),draw:()=>{}});
  q.invalidate();q.pause();assert.equal(tasks.size,0);q.resume();assert.equal(tasks.size,1);q.dispose();
});
test('disposed demand scheduler does not render or queue',()=>{
  const tasks=new Map();let id=0,drawn=0;const q=createDemandScheduler({requestFrame:cb=>(tasks.set(++id,cb),id),cancelFrame:i=>tasks.delete(i),draw:()=>drawn++});
  q.invalidate();const old=tasks.get(1);q.dispose();old(10);assert.equal(q.invalidate(),false);assert.equal(drawn,0);
});
test('viewport constrains dpr and pixel budget',()=>{
  const v=computeViewport({width:2000,height:1000,dpr:3,maxDpr:2,maxPixels:2_000_000});
  assert.equal(v.pixelRatio,1);assert.equal(v.width,2000);
});
test('viewport ignores zero size and invalid DPR',()=>{
  assert.equal(computeViewport({width:0,height:100,dpr:1}),null);
  assert.equal(computeViewport({width:100,height:100,dpr:NaN}),null);
});
test('perspective resize is container-based and idempotent',()=>{
  const renderer=makeRenderer();let width=480, height=240, updates=0;
  const container={getBoundingClientRect:()=>({width,height})};
  const camera={isPerspectiveCamera:true,updateProjectionMatrix(){updates++;}};
  const v=createViewportController({renderer,camera,container,getDpr:()=>1.5,ResizeObserverClass:null,windowTarget:null});
  assert.equal(camera.aspect,2);assert.equal(updates,1);assert.equal(v.update(),false);
  width=300;height=300;assert.equal(v.update(),true);assert.equal(camera.aspect,1);v.dispose();assert.equal(v.update(),false);
});
test('orthographic camera preserves vertical world span',()=>{
  const renderer=makeRenderer(); const container={getBoundingClientRect:()=>({width:400,height:200})};
  const camera={isOrthographicCamera:true,updateProjectionMatrix(){}};
  createViewportController({renderer,camera,container,orthographicHalfHeight:5,ResizeObserverClass:null,windowTarget:null});
  assert.deepEqual([camera.left,camera.right,camera.top,camera.bottom],[-10,10,5,-5]);
});
test('orthographic resize without span rejects',()=>{
  assert.throws(()=>createViewportController({renderer:makeRenderer(),camera:{isOrthographicCamera:true,updateProjectionMatrix(){}},container:{getBoundingClientRect:()=>({width:100,height:100})},ResizeObserverClass:null,windowTarget:null}),/orthographicHalfHeight/);
});
test('resize observer and event listeners disconnect on dispose',()=>{
  let observerDisconnected=0,windowRemoved=0, windowAdded=0;
  class Observer{observe(){} disconnect(){observerDisconnected++}};
  const windowTarget={addEventListener(){windowAdded++},removeEventListener(){windowRemoved++}};
  const c=createViewportController({renderer:makeRenderer(),camera:{isPerspectiveCamera:true,updateProjectionMatrix(){}},container:{getBoundingClientRect:()=>({width:100,height:100})},ResizeObserverClass:Observer,windowTarget});
  c.dispose();c.dispose();assert.deepEqual([observerDisconnected,windowRemoved,windowAdded],[1,1,1]);
});
test('shared resource cannot dispose while second lease is alive',()=>{
  const registry=createResourceRegistry();let disposed=0;const geometry={dispose(){disposed++}};
  const a=registry.lease(geometry), b=registry.lease(geometry);
  a();a();assert.equal(disposed,0);b();assert.equal(disposed,1);assert.equal(registry.activeResources,0);
});
test('borrowed resource never auto-disposed',()=>{
  const registry=createResourceRegistry();let disposed=0;const r={dispose(){disposed++}};
  registry.lease(r,{owned:false})();assert.equal(disposed,0);
});
test('conflicting resource ownership rejected',()=>{
  const registry=createResourceRegistry(), r={dispose(){}};
  const release=registry.lease(r,{owned:true});assert.throws(()=>registry.lease(r,{owned:false}),/Conflicting/);release();
});
test('scope listeners cleaned exactly once',()=>{
  let add=0,remove=0;
  const target={addEventListener(){add++},removeEventListener(){remove++}};
  const s=createLifecycleScope();s.listen(target,'change',()=>{});s.dispose();s.dispose();assert.equal(add,1);assert.equal(remove,1);
});
test('scope runs cleanups reverse order even if one fails',()=>{
  const s=createLifecycleScope(),order=[];
  s.defer(()=>order.push('first'));s.defer(()=>{order.push('second');throw Error('boom')});s.defer(()=>order.push('third'));
  assert.throws(()=>s.dispose(),AggregateError);assert.deepEqual(order,['third','second','first']);
});
test('pointer NDC center, corners and invalid rect',()=>{
  assert.deepEqual(toNDC({clientX:60,clientY:120,rect:{left:10,top:20,width:100,height:200}}),{x:0,y:0});
  assert.deepEqual(toNDC({clientX:10,clientY:20,rect:{left:10,top:20,width:100,height:200}}),{x:-1,y:1});
  assert.throws(()=>toNDC({clientX:0,clientY:0,rect:{left:0,top:0,width:0,height:10}}),RangeError);
});
test('reparent helper uses attach, not add',()=>{
  const obj={parent:null};let count=0;const parent={attach(v){assert.equal(v,obj);count++;},scale:{x:1,y:1,z:1},parent:null};
  assert.equal(reparentPreservingWorld(obj,parent),obj);assert.equal(count,1);
});
test('reparent warns about unsupported non-uniform parent scale',()=>{
  const old={scale:{x:2,y:1,z:1},parent:null};const obj={parent:old};const next={attach(){throw Error('must not be called')},scale:{x:1,y:1,z:1},parent:null};
  assert.throws(()=>reparentPreservingWorld(obj,next),/non-uniform/);
});
test('reparent rejects object with nonuniform scale',()=>{
  const obj={parent:null,scale:{x:2,y:1,z:1}};
  const parent={attach(){throw Error('should not run')},scale:{x:1,y:1,z:1},parent:null};
  assert.throws(()=>reparentPreservingWorld(obj,parent),/non-uniform/);
});
test('viewport pixel budget not broken by unusually massive rectangle',()=>{
  const view=computeViewport({width:1000000,height:1000000,dpr:2,maxDpr:2,maxPixels:1000000});
  assert.ok(view.pixelRatio*view.width*view.pixelRatio*view.height <= 1_000_000 + 1e-3);
});
