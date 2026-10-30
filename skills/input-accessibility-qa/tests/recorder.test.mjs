import test from 'node:test';import assert from 'node:assert/strict';
import {InputTraceRecorder} from '../src/recorder.mjs';
test('trace records in time order',()=>{const r=new InputTraceRecorder();r.add('down',{device:'keyboard',control:'Space'},1);r.add('up',{device:'keyboard',control:'Space'},2);assert.equal(r.exportJSONL().trim().split('\n').length,2);});
test('trace rejects non-monotonic time',()=>{const r=new InputTraceRecorder();r.add('sample',{},2);assert.throws(()=>r.add('sample',{},1),RangeError);});
test('trace reset clears events and monotonic constraint',()=>{const r=new InputTraceRecorder();r.add('sample',{},100);r.reset();r.add('sample',{},1);assert.equal(r.events.length,1);});

test('trace cannot override authoritative event time or type',()=>{const r=new InputTraceRecorder();assert.throws(()=>r.add('down',{time:0},1),TypeError);assert.throws(()=>r.add('down',{type:'up'},1),TypeError);});
