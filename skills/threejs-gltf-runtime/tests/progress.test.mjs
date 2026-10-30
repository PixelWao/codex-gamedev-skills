import test from 'node:test';import assert from 'node:assert/strict';
import {progressPercent} from '../examples/progress.mjs';
test('unknown length -> indeterminate',()=>assert.equal(progressPercent({loaded:500,total:0}),null));
test('known length -> finite',()=>assert.equal(progressPercent({loaded:25,total:100}),25));
test('over 100 clamps',()=>assert.equal(progressPercent({loaded:200,total:100}),100));
test('bad input -> indeterminate',()=>assert.equal(progressPercent({loaded:NaN,total:100}),null));
