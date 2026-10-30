import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkWGSL} from '../scripts/audit_wgsl.mjs';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('shader reference files have no static errors',()=>{
  for(const file of ['basic.wgsl','compute-add-one.wgsl']){
    const src=fs.readFileSync(path.join(base,'examples/wgsl',file),'utf8');
    assert.equal(checkWGSL(src).filter(x=>x.severity==='error').length,0,file);
  }
});
test('missing entry rejected',()=>assert.ok(checkWGSL('fn helper() {}').some(x=>x.code==='no-entrypoint')));
test('bad bracket rejected',()=>assert.ok(checkWGSL('@fragment fn main( -> @location(0) vec4f {}').some(x=>x.code==='brackets')));
test('compute requires workgroup size',()=>assert.ok(checkWGSL('@compute fn main() {}').some(x=>x.code==='compute-workgroup')));
test('duplicate binding warned',()=>assert.ok(checkWGSL('@group(0) @binding(1) var<uniform> u: f32; @group(0) @binding(1) var<uniform> x: f32; @fragment fn main() -> @location(0) vec4f{return vec4f(1.0); }').some(x=>x.code==='duplicate-binding')));
