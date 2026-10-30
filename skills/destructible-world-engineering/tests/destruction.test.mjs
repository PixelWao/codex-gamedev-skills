import test from 'node:test';import assert from 'node:assert/strict';
import {DestructionGraph,impulseFromContactForce,enqueueRapierContact} from '../src/destruction.mjs';
const g=()=>new DestructionGraph().addNode({id:'root',anchored:true}).addNode({id:'beam',health:10,region:'north'}).addBond('root','beam');
test('root and attached beam survive initial flush',()=>assert.equal(g().flush().events.length,0));
test('duplicate collision event only counted once',()=>{let x=g();assert.equal(x.enqueueImpact({eventId:'1',nodeId:'beam',impulse:5}),true);assert.equal(x.enqueueImpact({eventId:'1',nodeId:'beam',impulse:5}),false);assert.equal(x.flush().events.length,0);assert.equal(x.nodes.get('beam').health,5)});
test('destruction event once',()=>{let x=g();x.enqueueImpact({eventId:'a',nodeId:'beam',impulse:30});assert.equal(x.flush().events.length,1);assert.equal(x.flush().events.length,0)});
test('isolated node collapses when anchors absent',()=>{const x=new DestructionGraph().addNode({id:'orphan'});assert.equal(x.flush().events[0].reason,'unsupported')});
test('supported chain survives',()=>{const x=new DestructionGraph().addNode({id:'a',anchored:true}).addNode({id:'b'}).addNode({id:'c'}).addBond('a','b').addBond('b','c');assert.equal(x.flush().events.length,0)});
test('break in chain cascades',()=>{const x=new DestructionGraph().addNode({id:'a',anchored:true}).addNode({id:'b',health:1}).addNode({id:'c'}).addBond('a','b').addBond('b','c');x.enqueueImpact({eventId:'impact',nodeId:'b',impulse:1});assert.equal(x.flush().events.length,2)});
test('dirty regions deduplicated',()=>{const x=g();x.enqueueImpact({eventId:'a',nodeId:'beam',impulse:20});assert.deepEqual(x.flush().dirtyRegions,['north'])});
test('zero contact force yields zero impulse',()=>assert.equal(impulseFromContactForce(0,1/60),0));
test('force scaled by dt',()=>assert.equal(impulseFromContactForce(60,1/60),1));
test('Rapier contact bridge works',()=>{const x=g();enqueueRapierContact(x,{eventId:'c',nodeId:'beam',forceMagnitude:120,dt:0.1});assert.equal(x.flush().events.length,1)});
test('invalid health rejected',()=>assert.throws(()=>new DestructionGraph().addNode({id:'x',health:NaN})));
test('unknown node impact rejected',()=>assert.throws(()=>g().enqueueImpact({eventId:'x',nodeId:'absent',impulse:1})));
test('snapshot is detached copy',()=>{const x=g();const a=x.snapshot();a.nodes[0].health=0;assert.equal(x.nodes.get('root').health,100)});
test('stable event ordering',()=>{const x=new DestructionGraph().addNode({id:'root',anchored:true}).addNode({id:'a',anchored:true,health:3}).addNode({id:'b',anchored:true,health:3});x.enqueueImpact({eventId:'z',nodeId:'a',impulse:3});x.enqueueImpact({eventId:'a',nodeId:'b',impulse:3});assert.deepEqual(x.flush().events.map(x=>x.id),['b','a'])});

test('bond break triggers unsupported collapse',()=>{const x=g();x.enqueueBondDamage({eventId:'bond-break',a:'root',b:'beam',damage:100});assert.deepEqual(x.flush().events.map(e=>e.type),['bond-destroyed','node-destroyed'])});
test('bond strength absorbs insufficient damage',()=>{const x=g();x.enqueueBondDamage({eventId:'chip',a:'root',b:'beam',damage:20});assert.equal(x.flush().events.length,0)});
test('bounded event IDs',()=>{let x=new DestructionGraph({maxSeen:2}).addNode({id:'r',anchored:true});for(const id of ['a','b','c'])x.enqueueImpact({eventId:id,nodeId:'r',impulse:0});assert.equal(x.seen.size,2)});

test('zero health and zero bond strength rejected',()=>{assert.throws(()=>new DestructionGraph().addNode({id:'bad',health:0}));assert.throws(()=>g().addBond('root','beam',0))});
