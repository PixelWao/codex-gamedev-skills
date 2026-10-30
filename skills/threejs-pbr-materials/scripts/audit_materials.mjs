#!/usr/bin/env node
// Copyright (c) 2026 Waldemar Soroka — MIT
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { COLOR_SLOTS, DATA_SLOTS, NUMERIC_RANGES } from '../examples/create-material.mjs';

export function auditMaterials(manifest) {
  const issues=[]; const add=(severity,path,message)=>issues.push({severity,path,message});
  if (!manifest || !Array.isArray(manifest.materials)) return {ok:false,issues:[{severity:'error',path:'materials',message:'Expected materials array'}]};
  manifest.materials.forEach((m,index)=>{
    const path=`materials[${index}]`;
    if (!m || typeof m !== 'object') {add('error',path,'Material must be object');return;}
    if (!['MeshBasicMaterial','MeshStandardMaterial','MeshPhysicalMaterial'].includes(m.type)) add('error',`${path}.type`,'Unsupported/unknown material type');
    const params=m.parameters??{};
    if (!params || typeof params !== 'object' || Array.isArray(params)) {add('error',`${path}.parameters`,'Must be object');return;}
    for (const [field,[lo,hi]] of Object.entries(NUMERIC_RANGES)) if (field in params && (typeof params[field]!=='number' || !Number.isFinite(params[field]) || params[field]<lo || params[field]>hi)) add('error',`${path}.${field}`,`Expected finite ${lo}..${hi}`);
    if (m.type==='MeshPhysicalMaterial' && (params.transmission??0)>0 && params.opacity!==undefined && params.opacity!==1) add('error',`${path}.opacity`,'Physical transmission should use opacity 1');
    const maps=m.maps??{};
    if (!maps || typeof maps !== 'object' || Array.isArray(maps)) {add('error',`${path}.maps`,'Must be object');return;}
    for (const [role,map] of Object.entries(maps)) {
      if (!COLOR_SLOTS.has(role)&&!DATA_SLOTS.has(role)){add('warning',`${path}.maps.${role}`,'Unrecognized slot; inspect installed Three.js');continue;}
      const expected=COLOR_SLOTS.has(role)?'SRGBColorSpace':'NoColorSpace';
      if (!map || typeof map!=='object'||typeof map.colorSpace!=='string') add('error',`${path}.maps.${role}`,'Missing texture colorSpace');
      else if(map.colorSpace!==expected) add('error',`${path}.maps.${role}`,`Expected ${expected}, got ${map.colorSpace}`);
    }
    if (m.type==='MeshPhysicalMaterial'&&!['clearcoat','transmission','sheen','iridescence','anisotropy'].some(k=>(params[k]??0)>0)) add('warning',path,'Physical material has no advanced features; consider Standard');
  });
  return {ok:!issues.some(i=>i.severity==='error'),count:manifest.materials.length,issues};
}
function main(args){
  const input=args.find(a=>!a.startsWith('--'));
  if(!input){console.error('Usage: node scripts/audit_materials.mjs manifest.json [--strict]');return 2;}
  try {const report=auditMaterials(JSON.parse(readFileSync(input,'utf8')));console.log(JSON.stringify(report,null,2));return (!report.ok || (args.includes('--strict') && report.issues.length))?1:0;}
  catch(e){console.error(e.message);return 2;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) process.exitCode=main(process.argv.slice(2));
