// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Waldemar Soroka
// Browser-only example. Requires IndexedDB + secure-context Web Crypto.
const SLOT = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;
export class SaveConflictError extends Error { constructor(message='Stale save revision') { super(message); this.name='SaveConflictError'; } }
export class SaveCorruptError extends Error { constructor(message='Corrupt save payload') { super(message); this.name='SaveCorruptError'; } }
export class UnsupportedSchemaError extends Error { constructor(v) { super(`Unsupported future schema version: ${v}`); this.name='UnsupportedSchemaError'; } }

function assertSlot(slot) {
  if (typeof slot !== 'string' || !SLOT.test(slot)) throw new TypeError('Invalid slot name');
}
function inspectJson(value, depth=0, budget={count:0}) {
  if (depth > 32 || ++budget.count > 50000) throw new TypeError('State exceeds maximum depth/element count');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') { if (!Number.isFinite(value)) throw new TypeError('Non-finite number'); return; }
  if (Array.isArray(value)) { for (let i=0;i<value.length;i++) { if (!(i in value)) throw new TypeError('Array holes unsupported'); inspectJson(value[i],depth+1,budget); } return; }
  if (typeof value !== 'object' || (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)) throw new TypeError('Only plain JSON objects allowed');
  for (const [key, child] of Object.entries(value)) {
    if (key === '__proto__' || key === 'prototype' || key === 'constructor') throw new TypeError('Unsafe object key');
    inspectJson(child,depth+1,budget);
  }
}
function stateToPayload(state, maxBytes) {
  inspectJson(state);
  if (!Number.isSafeInteger(state?.schemaVersion) || state.schemaVersion < 1) throw new TypeError('A positive schemaVersion is required');
  const payload=JSON.stringify(state);
  if (new TextEncoder().encode(payload).length > maxBytes) throw new RangeError('Save exceeds configured byte limit');
  return payload;
}
async function digest(payload) {
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
function requestPromise(req) { return new Promise((resolve,reject)=>{ req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error); }); }
function txCompleted(tx) { return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error||new Error('Transaction aborted'));tx.onerror=()=>{};}); }
async function verified(record, expectedMaxBytes, supportedVersion) {
  if (!record || typeof record.payload !== 'string' || typeof record.sha256 !== 'string') throw new SaveCorruptError('Malformed record');
  if (new TextEncoder().encode(record.payload).length>expectedMaxBytes) throw new SaveCorruptError('Oversized payload');
  if (await digest(record.payload)!==record.sha256) throw new SaveCorruptError('Digest mismatch');
  let state;
  try { state=JSON.parse(record.payload); stateToPayload(state,expectedMaxBytes); } catch(e) { throw new SaveCorruptError(`Invalid data: ${e.message}`); }
  if (supportedVersion!==null && state.schemaVersion>supportedVersion) throw new UnsupportedSchemaError(state.schemaVersion);
  if (!Number.isSafeInteger(record.revision)||record.revision<1) throw new SaveCorruptError('Invalid record revision');
  return {state,revision:record.revision};
}
export class BrowserSaveStore {
  constructor({dbName='game-save-example-v1',maxBytes=2_000_000,supportedSchemaVersion=null}={}) {
    if(typeof indexedDB==='undefined') throw new Error('IndexedDB unavailable');
    if(!Number.isSafeInteger(maxBytes)||maxBytes<1024) throw new TypeError('Invalid maxBytes');
    this.dbName=dbName;this.maxBytes=maxBytes;this.supportedSchemaVersion=supportedSchemaVersion;this.db=null;
  }
  async open() {
    if(this.db)return this;
    this.db=await new Promise((resolve,reject)=>{
      const req=indexedDB.open(this.dbName,1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('records'))req.result.createObjectStore('records',{keyPath:'id'});};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
      req.onblocked=()=>reject(new Error('Database upgrade blocked by another tab'));
    });
    this.db.onversionchange=()=>{this.db.close();this.db=null;};
    return this;
  }
  close(){if(this.db){this.db.close();this.db=null;}}
  _db(){if(!this.db)throw new Error('Call open() first');return this.db;}
  _tx(mode){
    const db=this._db();
    if(mode==='readwrite') {try{return db.transaction('records',mode,{durability:'strict'});}catch(e){if(e instanceof TypeError)return db.transaction('records',mode);throw e;}}
    return db.transaction('records',mode);
  }
  async rawRecords(slot){
    assertSlot(slot);const tx=this._tx('readonly');const store=tx.objectStore('records');
    const primary=requestPromise(store.get(`primary:${slot}`));const backup=requestPromise(store.get(`backup:${slot}`));
    const completed=txCompleted(tx);const [p,b]=await Promise.all([primary,backup]);await completed;return {primary:p,backup:b};
  }
  async load(slot,{allowBackup=true}={}){
    const {primary,backup}=await this.rawRecords(slot);
    if(!primary && !backup)return null;
    if(primary){try{return {...await verified(primary,this.maxBytes,this.supportedSchemaVersion),source:'primary'};}
      catch(e){if(e instanceof UnsupportedSchemaError)throw e;if(!allowBackup||!backup)throw e;}}
    if(!allowBackup||!backup)throw new SaveCorruptError('Primary unavailable; recovery disabled');
    return {...await verified(backup,this.maxBytes,this.supportedSchemaVersion),source:'backup',recoveryRequired:true};
  }
  async write(slot,state,{expectedRevision=0}={}){
    assertSlot(slot);
    if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw new TypeError('Invalid expectedRevision');
    const payload=stateToPayload(state,this.maxBytes);
    if(this.supportedSchemaVersion!==null && state.schemaVersion>this.supportedSchemaVersion)throw new UnsupportedSchemaError(state.schemaVersion);
    const sha256=await digest(payload); // before IDB transaction; no await inside an open write transaction.
    const tx=this._tx('readwrite');const store=tx.objectStore('records');
    const committed=txCompleted(tx);
    let revision=null; let conflict=false;
    const req=store.get(`primary:${slot}`);
    req.onsuccess=()=>{
      try {
        const old=req.result;
        const current=old?.revision??0;
        if(current!==expectedRevision) {conflict=true;tx.abort();return;}
        revision=current+1;
        if(old) store.put({...old,id:`backup:${slot}`});
        store.put({id:`primary:${slot}`,slot,revision,payload,sha256});
      }catch(error){try{tx.abort();}catch(_){} }
    };
    req.onerror=()=>{};
    try {await committed;}catch(error){
      if(conflict)throw new SaveConflictError();
      throw error;
    }
    return {slot,revision,byteLength:new TextEncoder().encode(payload).length};
  }
  async exportJson(slot){
    const loaded=await this.load(slot,{allowBackup:false});
    if(!loaded)throw new Error('Save slot not found');
    return JSON.stringify({format:'browser-game-save-export-v1',slot,state:loaded.state},null,2);
  }
  async importJson(slot,text,{expectedRevision=0}={}){
    if(typeof text!=='string'||new TextEncoder().encode(text).length>this.maxBytes*2)throw new RangeError('Import file too large');
    let envelope;
    try{envelope=JSON.parse(text);}catch(e){throw new SaveCorruptError('Invalid export JSON');}
    if(envelope?.format!=='browser-game-save-export-v1'||!envelope.state)throw new SaveCorruptError('Unknown export format');
    return this.write(slot,envelope.state,{expectedRevision});
  }
  async listSlots(){
    const tx=this._tx('readonly'), req=requestPromise(tx.objectStore('records').getAll()), done=txCompleted(tx);
    const rows=await req;await done;
    return rows.filter(r=>r.id.startsWith('primary:')).map(r=>({slot:r.slot,revision:r.revision})).sort((a,b)=>a.slot.localeCompare(b.slot));
  }
}
export async function browserStorageStatus(){
  if(!navigator.storage)return {available:false};
  const out={available:true};
  if(navigator.storage.estimate)Object.assign(out,await navigator.storage.estimate());
  if(navigator.storage.persisted)out.persistent=await navigator.storage.persisted();
  return out;
}
