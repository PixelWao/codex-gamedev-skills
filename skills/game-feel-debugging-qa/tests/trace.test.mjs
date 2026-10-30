import test from 'node:test';import assert from 'node:assert/strict';import {TraceRecorder} from '../src/trace.mjs';
test('record and export jsonl',()=>{const t=new TraceRecorder();t.push({type:'feedback_accepted',eventId:'x',atMs:0});assert.equal(JSON.parse(t.jsonl()).eventId,'x');});
test('bounded recorder drops overflow',()=>{const t=new TraceRecorder({maxEvents:1});t.push({type:'x',atMs:0});assert.equal(t.push({type:'y',atMs:1}),false);assert.equal(t.dropped,1);});
test('independent copies',()=>{const t=new TraceRecorder(),e={type:'x',atMs:0};t.push(e);e.atMs=2;assert.equal(t.events[0].atMs,0);});
test('invalid trace rejected',()=>{const t=new TraceRecorder();assert.throws(()=>t.push({type:'x',atMs:NaN}));});
test('clear resets counters',()=>{const t=new TraceRecorder({maxEvents:1});t.push({type:'x',atMs:0});t.push({type:'x',atMs:1});t.clear();assert.equal(t.dropped,0);assert.equal(t.events.length,0);});
