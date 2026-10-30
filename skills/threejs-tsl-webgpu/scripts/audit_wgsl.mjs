#!/usr/bin/env node
// Source heuristics only. This does not compile WGSL or validate pipeline layouts.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

export function checkWGSL(source) {
  const findings = [];
  const add=(severity,code,detail)=>findings.push({severity,code,detail});
  if (!/\bfn\s+[A-Za-z_][\w]*\s*\(/.test(source)) add('error','no-function','No WGSL function found');
  if (!/@(vertex|fragment|compute)\b/.test(source)) add('error','no-entrypoint','No shader stage entrypoint found');
  // Check paired brackets after removal of // and /* ... */ comments.
  const code=source.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
  const stack=[]; const matching={')':'(',']':'[','}':'{'};
  for(let i=0;i<code.length;i++){
    const c=code[i];
    if ('([{'.includes(c)) stack.push(c);
    if (')]}'.includes(c) && stack.pop()!==matching[c]){add('error','brackets',`Unmatched ${c} at position ${i}`);break;}
  }
  if(stack.length>0) add('error','brackets','Unclosed delimiters');
  const bindings=new Set();
  const rg=/@group\((\d+)\)\s*@binding\((\d+)\)/g;
  for(let m; (m=rg.exec(code))!==null; ){
    const key=`${m[1]}:${m[2]}`;
    if(bindings.has(key)) add('warning','duplicate-binding',`Duplicate binding ${key}; check for aliases`);
    bindings.add(key);
  }
  if (/@compute\b/.test(code) && !/@workgroup_size\s*\(/.test(code))
    add('error','compute-workgroup','Compute shader needs @workgroup_size');
  if (/@compute\b/.test(code) && /global_invocation_id/.test(code) && !/\bif\s*\(/.test(code))
    add('warning','bounds','Compute fixture has no obvious bounds branch');
  return findings;
}
function discover(x){
 const st=fs.statSync(x);
 if(st.isFile()) return x.endsWith('.wgsl')?[x]:[];
 return fs.readdirSync(x).flatMap(n=>discover(path.join(x,n)));
}
if(process.argv[1] && path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
 const target=process.argv[2];if(!target){console.error('Usage: node scripts/audit_wgsl.mjs PATH');process.exit(2);}
 const files=discover(target);if(!files.length){console.error('No .wgsl files');process.exit(2);}
 let errors=0;
 for(const file of files){const result=checkWGSL(fs.readFileSync(file,'utf8'));
  console.log(JSON.stringify({file,status:'STATIC_ONLY_NOT_COMPILED',findings:result}));
  errors+=result.filter(x=>x.severity==='error').length;
 }
 process.exitCode=errors?1:0;
}
