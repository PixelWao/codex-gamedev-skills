import test from 'node:test';import assert from'node:assert/strict';
import {validateMaterialSpec,createPBRMaterial}from'../examples/create-material.mjs';
import {auditMaterials}from'../scripts/audit_materials.mjs';
class Material {constructor(p){this.params=p;this.disposals=0;}dispose(){this.disposals++;}}
const THREE={MeshStandardMaterial:class extends Material{},MeshBasicMaterial:class extends Material{},MeshPhysicalMaterial:class extends Material{}};
const color={colorSpace:'SRGBColorSpace',disposed:false},normal={colorSpace:'NoColorSpace'};
const good=()=>({type:'MeshStandardMaterial',parameters:{roughness:0.5,metalness:0},maps:{map:color,normalMap:normal}});
test('valid normal PBR accepted',()=>assert.equal(validateMaterialSpec(good()),'MeshStandardMaterial'));
test('color/data roles rejected when switched',()=>assert.throws(()=>validateMaterialSpec({...good(),maps:{normalMap:color}}),/expected NoColorSpace/));
test('out of range roughness is rejected',()=>assert.throws(()=>validateMaterialSpec({...good(),parameters:{roughness:-0.1}}),/roughness/));
test('NaN rejected',()=>assert.throws(()=>validateMaterialSpec({...good(),parameters:{metalness:NaN}}),/metalness/));
test('physical transmission requires full opacity',()=>assert.throws(()=>validateMaterialSpec({type:'MeshPhysicalMaterial',parameters:{transmission:0.7,opacity:0.2}}),/opacity/));
test('unknown slots rejected',()=>assert.throws(()=>validateMaterialSpec({maps:{imaginaryMap:color}}),/Unknown/));
test('texture is never disposed by factory',()=>{const asset=createPBRMaterial(THREE,good());asset.dispose();asset.dispose();assert.equal(asset.material.disposals,1);assert.equal(color.disposed,false);});
test('factory does not mutate caller data',()=>{const spec=good();const mat=createPBRMaterial(THREE,spec);assert.equal(mat.material.params.map,color);assert.equal(mat.material.params.normalMap,normal);mat.dispose();});
test('manifest passes expected texture roles',()=>assert.equal(auditMaterials({materials:[{type:'MeshStandardMaterial',parameters:{metalness:0.2},maps:{map:{colorSpace:'SRGBColorSpace'}}}]}).ok,true));
test('manifest detects wrong texture role',()=>{const r=auditMaterials({materials:[{type:'MeshStandardMaterial',maps:{roughnessMap:{colorSpace:'SRGBColorSpace'}}}]});assert.equal(r.ok,false);assert.ok(r.issues.some(x=>x.message.includes('NoColorSpace')));});
test('missing materials rejected',()=>assert.equal(auditMaterials({}).ok,false));
test('Physical unused features warning',()=>assert.ok(auditMaterials({materials:[{type:'MeshPhysicalMaterial'}]}).issues.some(x=>x.severity==='warning')));
