import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { auditVersions } from '../scripts/version-audit.mjs';
async function withTemp(callback) { const dir=await mkdtemp(join(tmpdir(),'three-audit-'));try{return await callback(dir);}finally{await rm(dir,{recursive:true,force:true})} }
test('reports missing project metadata',()=>withTemp(async dir=>{
 const v=await auditVersions(dir);assert.ok(v.warnings.some(s=>s.includes('No package.json')));
}));
test('detects pinned r180 from package-lock',()=>withTemp(async dir=>{
 await writeFile(join(dir,'package.json'),JSON.stringify({dependencies:{three:'^0.180.0'}}));
 await writeFile(join(dir,'package-lock.json'),JSON.stringify({packages:{'node_modules/three':{version:'0.180.0'}}}));
 const v=await auditVersions(dir);assert.equal(v.packageLockVersion,'0.180.0');assert.ok(v.warnings.some(s=>s.includes('THREE.Timer')));
}));
test('detects inconsistent import-map versions',()=>withTemp(async dir=>{
 await writeFile(join(dir,'index.html'),'three@0.180.0/build/three.module.js three@0.186.0/examples/jsm/');
 const v=await auditVersions(dir);assert.deepEqual(v.importMapVersions,['0.180.0','0.186.0']);assert.ok(v.warnings.some(s=>s.includes('Multiple')));
}));
test('detects package lock vs import map mismatch',()=>withTemp(async dir=>{
 await writeFile(join(dir,'package-lock.json'),JSON.stringify({packages:{'node_modules/three':{version:'0.180.0'}}}));
 await writeFile(join(dir,'index.html'),'three@0.186.0/build/three.module.js three@0.186.0/examples/jsm/');
 const v=await auditVersions(dir);assert.ok(v.warnings.some(s=>s.includes('differs')));
}));
test('recognizes consistent r186 import map',()=>withTemp(async dir=>{
 await writeFile(join(dir,'index.html'),'three@0.186.0/build/three.module.js three@0.186.0/examples/jsm/');
 const v=await auditVersions(dir);assert.equal(v.resolvedForHeuristics,'0.186.0');assert.deepEqual(v.warnings,[]);
}));
