#!/usr/bin/env node
// Copyright (c) 2026 Waldemar Soroka — MIT
import {readFileSync} from 'node:fs';import{pathToFileURL}from'node:url';
export function shadowBudget(data){
 const issues=[];let totalFaces=0,totalTexels=0,totalBytes=0;
 if(!Array.isArray(data?.lights))return {ok:false,issues:['lights must be array']};
 const entries=[];
 for(const [i,light] of data.lights.entries()){
  if(!light?.castShadow)continue;
  const faces=light.type==='PointLight'?6:light.type==='DirectionalLight'||light.type==='SpotLight'?1:null;
  if(!faces){issues.push(`lights[${i}]: unsupported shadow light type`);continue;}
  const [w,h]=light.mapSize??[]; const bpp=light.bytesPerPixelEstimate??4;
  if(![w,h,bpp].every(Number.isFinite)||![w,h,bpp].every(x=>Number.isInteger(x)&&x>0)||w>16384||h>16384||bpp>32){issues.push(`lights[${i}]: invalid mapSize/bpp`);continue;}
  const texels=w*h*faces, bytes=texels*bpp;
  entries.push({name:light.name??`light-${i}`,type:light.type,faces,texels,estimatedBytes:bytes});
  totalFaces+=faces;totalTexels+=texels;totalBytes+=bytes;
 }
 if(!Number.isFinite(totalBytes)||totalBytes>Number.MAX_SAFE_INTEGER)issues.push('numeric overflow');
 const limitMB=data.maxEstimatedMB;
 if(limitMB!==undefined&&(!Number.isFinite(limitMB)||limitMB<=0))issues.push('invalid maxEstimatedMB');
 else if(limitMB!==undefined&&totalBytes/1048576>limitMB)issues.push(`estimated bytes exceed supplied ${limitMB} MiB limit`);
 return {ok:issues.length===0,estimatedMiB:Math.round(1000*totalBytes/1048576)/1000,totalFaces,totalTexels,entries,issues,note:'Estimate only, not measured VRAM or GPU time; backend allocations vary.'};
}
function main(args){const input=args[0];if(!input){console.error('Usage: shadow_budget.mjs manifest.json');return 2;}try{const r=shadowBudget(JSON.parse(readFileSync(input,'utf8')));console.log(JSON.stringify(r,null,2));return r.ok?0:1;}catch(e){console.error(e.message);return 2;}}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)process.exitCode=main(process.argv.slice(2));
