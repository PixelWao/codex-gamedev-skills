// IndexedDB simulation tests for CI without browser. Supplement, not substitute,
// for the real-browser integration suite in browser_tests.html.
import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
if (!globalThis.crypto)globalThis.crypto=webcrypto;

const databases=new Map();
class FakeRequest {constructor(){this.result=undefined;this.error=null;this.onsuccess=null;this.onerror=null;}}
class FakeTx {
 constructor(db,mode){this.db=db;this.mode=mode;this.oncomplete=null;this.onabort=null;this.onerror=null;this.error=null;this.active=false;this.closed=false;this.tasks=[];this.copy=null;this.running=false;}
 objectStore(name){assert.equal(name,'records');const tx=this;return {
  get(key){return tx.enqueue(()=>tx.copy.get(key))},
  getAll(){return tx.enqueue(()=>Array.from(tx.copy.values()))},
  put(row){return tx.enqueue(()=>{if(tx.mode!=='readwrite')throw Error('readonly');tx.copy.set(row.id,structuredClone(row));return row.id;})}
 };}
 enqueue(fn){if(this.closed)throw Error('inactive');const req=new FakeRequest();this.tasks.push({fn,req});this.pump();return req;}
 start(){this.active=true;this.copy=new Map(this.db.data);this.pump();}
 pump(){if(!this.active||this.running||this.closed)return;this.running=true;setImmediate(()=>{
  if(this.closed)return;
  const next=this.tasks.shift();
  if(next){
   try{next.req.result=next.fn();next.req.onsuccess?.({target:next.req});}
   catch(e){next.req.error=e;next.req.onerror?.({target:next.req});this.abort(e);return;}
   this.running=false;this.pump();return;
  }
  this.closed=true;
  if(this.mode==='readwrite')this.db.data=this.copy;
  this.oncomplete?.();this.db.next();
 });}
 abort(error=new Error('Aborted')){if(this.closed)return;this.closed=true;this.error=error;setImmediate(()=>{this.onabort?.();this.db.next();});}
}
class FakeDB {
 constructor(){this.data=new Map();this.queue=[];this.current=null;this.objectStoreNames={contains:(v)=>v==='records'};}
 createObjectStore(){}
 transaction(_store,mode){const tx=new FakeTx(this,mode);this.queue.push(tx);this.next();return tx;}
 next(){if(this.current&&!this.current.closed)return;this.current=null;const t=this.queue.shift();if(t){this.current=t;t.start();}}
 close(){}
}
globalThis.indexedDB={open(name){const req=new FakeRequest();setImmediate(()=>{
 let db=databases.get(name),fresh=false;if(!db){db=new FakeDB();databases.set(name,db);fresh=true;}
 req.result=db;if(fresh)req.onupgradeneeded?.();req.onsuccess?.();
 });return req;}};
const {BrowserSaveStore,SaveConflictError,SaveCorruptError,UnsupportedSchemaError}=await import('../indexeddb_save_store.mjs');
async function create(name='db'+Math.random()){const s=new BrowserSaveStore({dbName:name,supportedSchemaVersion:3,maxBytes:50000});await s.open();return s;}

test('initial write + load',async()=>{const s=await create();assert.equal((await s.write('x',{schemaVersion:1,hp:7})).revision,1);assert.equal((await s.load('x')).state.hp,7)});
test('CAS rejects stale revision',async()=>{const s=await create();await s.write('x',{schemaVersion:1});await assert.rejects(s.write('x',{schemaVersion:1},{expectedRevision:0}),SaveConflictError)});
test('second save rotates backup',async()=>{const s=await create();await s.write('x',{schemaVersion:1,hp:7});await s.write('x',{schemaVersion:1,hp:8},{expectedRevision:1});const raws=await s.rawRecords('x');assert.equal(JSON.parse(raws.backup.payload).hp,7);assert.equal(JSON.parse(raws.primary.payload).hp,8)});
test('checksum fallback to backup',async()=>{const s=await create();await s.write('x',{schemaVersion:1,hp:7});await s.write('x',{schemaVersion:1,hp:8},{expectedRevision:1});s.db.data.get('primary:x').payload='{"schemaVersion":1,"hp":900}';const r=await s.load('x');assert.equal(r.source,'backup');assert.equal(r.state.hp,7)});
test('no fallback is explicit',async()=>{const s=await create();await s.write('x',{schemaVersion:1});s.db.data.get('primary:x').payload='bad';await assert.rejects(s.load('x',{allowBackup:false}),SaveCorruptError)});
test('invalid slot',async()=>{const s=await create();await assert.rejects(s.write('../a',{schemaVersion:1}),TypeError)});
test('NaN rejected',async()=>{const s=await create();await assert.rejects(s.write('a',{schemaVersion:1,x:NaN}),TypeError)});
test('unknown future schema on write',async()=>{const s=await create();await assert.rejects(s.write('a',{schemaVersion:4}),UnsupportedSchemaError)});
test('future schema on load',async()=>{const s=await create('shared');await s.write('a',{schemaVersion:3});const old=new BrowserSaveStore({dbName:'shared',supportedSchemaVersion:2});await old.open();await assert.rejects(old.load('a'),UnsupportedSchemaError)});
test('export/import',async()=>{const s=await create();await s.write('a',{schemaVersion:2,inventory:['🍀']});await s.importJson('b',await s.exportJson('a'));assert.equal((await s.load('b')).state.inventory[0],'🍀')});
test('list slots',async()=>{const s=await create();await s.write('z',{schemaVersion:1});await s.write('a',{schemaVersion:1});assert.deepEqual((await s.listSlots()).map(x=>x.slot),['a','z'])});
test('missing returns null',async()=>{const s=await create();assert.equal(await s.load('none'),null)});
test('size limit',async()=>{const s=await create();await assert.rejects(s.write('huge',{schemaVersion:1,text:'x'.repeat(70000)}),RangeError)});
test('two concurrent writers, one CAS success',async()=>{const s=await create();const both=await Promise.allSettled([s.write('r',{schemaVersion:1,owner:'A'}),s.write('r',{schemaVersion:1,owner:'B'})]);assert.equal(both.filter(x=>x.status==='fulfilled').length,1);assert.equal(both.filter(x=>x.status==='rejected').length,1)});
test('invalid import',async()=>{const s=await create();await assert.rejects(s.importJson('a','nope'),SaveCorruptError)});
