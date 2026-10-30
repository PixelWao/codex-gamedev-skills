#!/usr/bin/env node
// Copyright (c) 2026 Waldemar Soroka — MIT
import {readFileSync}from'node:fs';import{pathToFileURL}from'node:url';
const COLOR_ROLES=new Set(['albedo','baseColor','emissive','sheenColor','specularColor']);
const DATA_ROLES=new Set(['normal','roughness','metalness','ao','occlusion','alpha','mask','displacement','thickness','transmission']);
export function auditColorPipeline(data){
 const issues=[];const add=(level,path,message)=>issues.push({level,path,message});
 if(!data||typeof data!=='object')return {ok:false,issues:[{level:'error',path:'root',message:'object required'}]};
 const renderer=data.renderer??{};
 if(renderer.outputColorSpace!=='SRGBColorSpace')add('warning','renderer.outputColorSpace','Default display pipeline normally uses SRGBColorSpace; verify target');
 if(renderer.toneMappingExposure!==undefined && (!Number.isFinite(renderer.toneMappingExposure)||renderer.toneMappingExposure<=0))add('error','renderer.toneMappingExposure','exposure must be positive finite');
 const post=data.postprocessing??{};
 if(post.enabled&&renderer.backend!=='WebGPURenderer'){
  if(post.outputPassCount!==1)add('error','postprocessing.outputPassCount','Expected one output conversion pass in standard WebGL EffectComposer');
  if(post.manualGammaPass) add('error','postprocessing.manualGammaPass','Potential double gamma conversion');
 }
 if(!Array.isArray(data.textures))add('error','textures','Expected texture metadata array');
 else data.textures.forEach((t,i)=>{
  if(!t||typeof t!=='object'){add('error',`textures[${i}]`,'Expected object');return;}
  const expect=COLOR_ROLES.has(t.role)?'SRGBColorSpace':DATA_ROLES.has(t.role)?'NoColorSpace':null;
  if(expect && t.colorSpace!==expect)add('error',`textures[${i}]`,`${t.role} expects ${expect}`);
  if(!expect)add('warning',`textures[${i}]`,'Unknown/HDR role: review source encoding manually');
 });
 return {ok:!issues.some(x=>x.level==='error'),issues,note:'Static manifest inspection; not proof of GPU color correctness.'};
}
function main(args){const input=args[0];if(!input){console.error('Usage: color_pipeline_audit.mjs manifest.json');return 2;}try{const r=auditColorPipeline(JSON.parse(readFileSync(input,'utf8')));console.log(JSON.stringify(r,null,2));return r.ok?0:1;}catch(e){console.error(e.message);return 2;}}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)process.exitCode=main(process.argv.slice(2));
