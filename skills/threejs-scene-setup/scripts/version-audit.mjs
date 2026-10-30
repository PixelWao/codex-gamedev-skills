/** Audits local Three.js version pinning without installing dependencies. */
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

async function maybeJSON(path) { try { return JSON.parse(await readFile(path, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } }
async function maybeText(path) { try { return await readFile(path, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } }
export async function auditVersions(projectPath) {
  const root = resolve(projectPath);
  const pkg = await maybeJSON(join(root,'package.json'));
  const lock = await maybeJSON(join(root,'package-lock.json'));
  const declaration = pkg?.dependencies?.three || pkg?.devDependencies?.three || null;
  const lockfileVersion = lock?.packages?.['node_modules/three']?.version || null;
  const importMapVersions = new Set();
  for (const candidate of ['index.html','public/index.html']) {
    const html = await maybeText(join(root,candidate));
    if (!html) continue;
    for (const match of html.matchAll(/three@([0-9]+\.[0-9]+\.[0-9]+)\//g)) importMapVersions.add(match[1]);
  }
  const warnings=[];
  if (!pkg && importMapVersions.size===0) warnings.push('No package.json or pinned import map at expected project entry points');
  if (declaration && !lockfileVersion) warnings.push('Declared Three.js dependency but no installed version found in package-lock; inspect pnpm/yarn lock or node_modules');
  if (importMapVersions.size>1) warnings.push('Multiple Three.js CDN release pins detected');
  if (lockfileVersion && importMapVersions.size && !importMapVersions.has(lockfileVersion)) warnings.push('package-lock installed release differs from import-map release');
  const resolved = lockfileVersion || (importMapVersions.size===1 ? [...importMapVersions][0] : null);
  if (resolved && /^0\.\d+\./.test(resolved) && Number(resolved.split('.')[1])<183) {
    warnings.push(`r${resolved.split('.')[1]}: do not assume THREE.Timer exists (r183+ API)`);
  }
  return { project:root, declaredThree:declaration, packageLockVersion:lockfileVersion, importMapVersions:[...importMapVersions].sort(), resolvedForHeuristics:resolved, warnings };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const audit = await auditVersions(process.argv[2] || '.');
  process.stdout.write(JSON.stringify(audit,null,2)+'\n');
}
