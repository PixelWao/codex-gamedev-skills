import {test} from 'node:test';import assert from 'node:assert/strict';import {LevelTrace} from '../src/telemetry.mjs';
test('tracks visit',()=>{const t=new LevelTrace();t.record({id:'a',time:0,type:'enter',room:'start'});t.record({id:'b',time:1,type:'enter',room:'goal'});assert.deepEqual(t.summary().uniqueRooms,['goal','start'])});
test('duplicates refused',()=>{const t=new LevelTrace();t.record({id:'a',time:1,type:'enter',room:'start'});assert.throws(()=>t.record({id:'a',time:2,type:'enter',room:'start'}))});
test('reverse time refused',()=>{const t=new LevelTrace();t.record({id:'a',time:2,type:'enter',room:'start'});assert.throws(()=>t.record({id:'b',time:1,type:'enter',room:'start'}))});
test('reset clears state',()=>{const t=new LevelTrace();t.record({id:'a',time:2,type:'enter',room:'start'});t.clear();t.record({id:'a',time:0,type:'enter',room:'start'});assert.equal(t.summary().count,1)});
test('JSONL roundtrip',()=>{const t=new LevelTrace();t.record({id:'a',time:1,type:'death',room:'arena',data:{cause:'fall'}});assert.equal(JSON.parse(t.toJSONL()).data.cause,'fall')});
