// MIT — Copyright (c) 2026 Waldemar Soroka
// Optional: npm install --save-dev gltf-validator (in your PROJECT, pinned).
// Usage: node scripts/khronos-validate.mjs ./path/to/model.glb
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const file = process.argv[2];
if (!file) { console.error('Usage: node scripts/khronos-validate.mjs model.glb');process.exitCode=2; }
else {
 try {
  const imported = await import('gltf-validator');
  const validator = imported.validateBytes ? imported : imported.default;
  const model = path.resolve(file), rootDir=path.dirname(model);
  const payload = new Uint8Array(await fs.readFile(model));
  const report = await validator.validateBytes(payload, {
    uri: pathToFileURL(model).href,
    externalResourceFunction: async uri => {
      if (!uri || /^[a-z]+:/i.test(uri) || uri.startsWith('//')) throw new Error('External URI scheme blocked: '+uri);
      const decoded=decodeURIComponent(uri.split(/[?#]/)[0]);
      const resolved=path.resolve(rootDir,decoded);
      if (!resolved.startsWith(rootDir+path.sep)) throw new Error('Outside asset directory: '+uri);
      return new Uint8Array(await fs.readFile(resolved));
    }
  });
  console.log(JSON.stringify(report,null,2));
  if (report.issues?.numErrors) process.exitCode=1;
 } catch(error) { console.error('Validator unavailable or failed:',error.message);process.exitCode=2; }
}
