import test from 'node:test';
import assert from 'node:assert/strict';
import { createAssetStore } from '../examples/asset-store.mjs';
function thing(kind) { return { [kind]: true, count: 0, dispose(){ this.count++; } }; }
function root(geometry, material, skel=thing('isSkeleton')) {
 return { geometry, material, skeleton:skel, parent:null,
   traverse(fn){fn(this);},
   cloneMock(){const x=root(geometry,material);return x;}
 };
}
function fx({ fail = false }={}) {
 const geom=thing('isBufferGeometry'), tex=thing('isTexture'), mat=thing('isMaterial'); mat.map=tex;
 const base=root(geom,mat); let loads=0;
 const loader={async loadAsync(){loads++; if(fail && loads===1)throw new Error('network');return {scene:base,animations:[]};}};
 const store=createAssetStore({loader,clone:b=>b.cloneMock()});
 return {geom,mat,tex,base,store,get loads(){return loads;}};
}
test('deduplicated inflight downloads and separate roots',async()=>{
 const f=fx(); const [a,b]=await Promise.all([f.store.acquire('enemy'),f.store.acquire('enemy')]);
 assert.equal(f.loads,1); assert.notEqual(a.root,b.root);
 assert.equal(f.store.status()[0].leases,2);
 assert.equal(a.release(),true); assert.equal(a.release(),false);
 assert.equal(f.geom.count,0); assert.equal(f.mat.count,0);
 assert.equal(b.release(),true); assert.equal(f.geom.count,1); assert.equal(f.mat.count,1); assert.equal(f.tex.count,1);
 assert.equal(f.base.skeleton.count,1); await f.store.close();
});
test('instance skeletons are freed independently',async()=>{const f=fx();const a=await f.store.acquire('a'); const skel=a.root.skeleton;a.release();assert.equal(skel.count,1);});
test('removes instance from parent',async()=>{const f=fx(); const a=await f.store.acquire('a');let removed=0;a.root.parent={remove(obj){assert.equal(obj,a.root);removed++;}}; a.release();assert.equal(removed,1);});
test('failure is retryable',async()=>{const f=fx({fail:true});await assert.rejects(f.store.acquire('a'),/network/);const a=await f.store.acquire('a');assert.equal(f.loads,2);a.release();});
test('closed store rejects new acquisitions',async()=>{const f=fx();await f.store.close();await assert.rejects(f.store.acquire('a'),/closed/);});
test('close with lease warns and can be retried after release',async()=>{const f=fx();const a=await f.store.acquire('a');await assert.rejects(f.store.close(),/Release/);a.release();await f.store.close();});
test('invalid inputs',async()=>{assert.throws(()=>createAssetStore({loader:null,clone:null}),/Provide/);const f=fx();await assert.rejects(f.store.acquire(''),/URL/);});
test('bad clone does not leave cache stale',async()=>{
 const f=fx(); const failed=createAssetStore({loader:{loadAsync:async()=>({scene:f.base,animations:[]})},clone:()=>{throw new Error('clone failed');}});
 await assert.rejects(failed.acquire('a'),/clone failed/);
 assert.deepEqual(failed.status(),[]);
 await failed.close();
});
