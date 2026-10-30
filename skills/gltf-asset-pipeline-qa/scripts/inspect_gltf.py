#!/usr/bin/env python3
"""Offline structural inspection of glTF 2.0 JSON/GLB. NOT a Khronos validator.
MIT — Copyright (c) 2026 Waldemar Soroka
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import struct
import sys

ARRAYS = ('accessors', 'animations', 'buffers', 'bufferViews', 'cameras', 'images',
          'materials', 'meshes', 'nodes', 'samplers', 'scenes', 'skins', 'textures')
MAGIC = b'glTF'

def parse_asset(path: Path):
    data = path.read_bytes()
    binary_chunk = None
    if path.suffix.lower() == '.glb':
        if len(data) < 20:
            raise ValueError('GLB header/chunks truncated')
        magic, version, declared = struct.unpack_from('<4sII', data, 0)
        if magic != MAGIC or version != 2 or declared != len(data):
            raise ValueError('Invalid GLB magic/version/declared length')
        offset = 12
        json_chunk = None
        seen_bin = False
        while offset < len(data):
            if offset + 8 > len(data): raise ValueError('Truncated GLB chunk header')
            chunk_len, chunk_type = struct.unpack_from('<I4s', data, offset)
            offset += 8
            if chunk_len % 4 or offset + chunk_len > len(data):
                raise ValueError('Invalid chunk alignment or bounds')
            contents = data[offset:offset + chunk_len]
            offset += chunk_len
            if json_chunk is None:
                if chunk_type != b'JSON': raise ValueError('First GLB chunk must be JSON')
                json_chunk = contents
            elif chunk_type == b'BIN\x00':
                if seen_bin: raise ValueError('Duplicate BIN chunk')
                binary_chunk = contents
                seen_bin = True
            else:
                raise ValueError('Unsupported extra GLB chunk')
        if json_chunk is None: raise ValueError('Missing GLB JSON chunk')
        try: doc = json.loads(json_chunk.rstrip(b' \t\r\n\x00').decode('utf-8'))
        except (UnicodeError, json.JSONDecodeError) as exc:
            raise ValueError(f'Invalid GLB JSON: {exc}') from exc
    elif path.suffix.lower() == '.gltf':
        try: doc = json.loads(data.decode('utf-8'))
        except (UnicodeError, json.JSONDecodeError) as exc:
            raise ValueError(f'Invalid glTF JSON: {exc}') from exc
    else: raise ValueError('Expected .glb or .gltf')
    if not isinstance(doc, dict): raise ValueError('glTF top level must be object')
    return doc, binary_chunk, len(data)

def inspect_asset(path: Path):
    warnings, errors = [], []
    try: doc, binary, size = parse_asset(path)
    except (ValueError, OSError, struct.error) as exc:
        return {'file': str(path), 'ok': False, 'errors': [str(exc)], 'warnings': []}
    def arr(name):
        val = doc.get(name, [])
        if not isinstance(val, list):
            errors.append(f'{name} must be array')
            return []
        return val
    arrays = {key: arr(key) for key in ARRAYS}
    version = doc.get('asset', {}).get('version') if isinstance(doc.get('asset'), dict) else None
    if version != '2.0': errors.append(f'Expected asset.version 2.0, got {version!r}')
    required = doc.get('extensionsRequired', [])
    if not isinstance(required, list) or any(not isinstance(e, str) for e in required):
        errors.append('extensionsRequired must be string array'); required = []
    if required: warnings.append('Required extensions must be checked against project GLTFLoader: ' + ', '.join(required))
    def index(value, target, where):
        if not isinstance(value, int) or isinstance(value, bool) or value < 0 or value >= len(arrays[target]):
            errors.append(f'{where}: invalid {target} index {value!r}')
    for i, node in enumerate(arrays['nodes']):
        if not isinstance(node, dict): errors.append(f'nodes[{i}] must be object'); continue
        for j in node.get('children', []): index(j,'nodes',f'nodes[{i}].children')
        for field,target in [('mesh','meshes'),('skin','skins'),('camera','cameras')]:
            if field in node: index(node[field],target,f'nodes[{i}].{field}')
    for i, view in enumerate(arrays['bufferViews']):
        if not isinstance(view, dict): errors.append(f'bufferViews[{i}] must be object');continue
        if 'buffer' in view: index(view['buffer'],'buffers',f'bufferViews[{i}].buffer')
    for i, accessor in enumerate(arrays['accessors']):
        if not isinstance(accessor, dict): errors.append(f'accessors[{i}] must be object');continue
        if 'bufferView' in accessor: index(accessor['bufferView'],'bufferViews',f'accessors[{i}].bufferView')
        if 'count' in accessor and (not isinstance(accessor['count'], int) or accessor['count'] < 0):
            errors.append(f'accessors[{i}].count invalid')
    triangles = 0
    for mi,mesh in enumerate(arrays['meshes']):
        if not isinstance(mesh,dict): errors.append(f'meshes[{mi}] must be object');continue
        for pi, prim in enumerate(mesh.get('primitives', [])):
            if not isinstance(prim, dict):errors.append(f'meshes[{mi}].primitives[{pi}] invalid');continue
            where=f'meshes[{mi}].primitives[{pi}]'
            if 'indices' in prim: index(prim['indices'],'accessors',where+'.indices')
            if 'material' in prim: index(prim['material'],'materials',where+'.material')
            attrs=prim.get('attributes',{})
            if not isinstance(attrs,dict): errors.append(where+'.attributes invalid');continue
            for key,value in attrs.items():index(value,'accessors',where+'.attributes.'+key)
            if prim.get('mode',4) == 4:
                ai=prim.get('indices',attrs.get('POSITION'))
                if isinstance(ai,int) and not isinstance(ai,bool) and 0 <= ai < len(arrays['accessors']):
                    count=arrays['accessors'][ai].get('count') if isinstance(arrays['accessors'][ai],dict) else None
                    if isinstance(count,int) and count>=0:triangles+=count//3
    for si,scene in enumerate(arrays['scenes']):
        if not isinstance(scene,dict):errors.append(f'scenes[{si}] invalid');continue
        for node_idx in scene.get('nodes',[]):index(node_idx,'nodes',f'scenes[{si}].nodes')
    if 'scene' in doc:index(doc['scene'],'scenes','scene')
    for i,tex in enumerate(arrays['textures']):
        if not isinstance(tex,dict):errors.append(f'textures[{i}] invalid');continue
        for field,target in [('source','images'),('sampler','samplers')]:
            if field in tex:index(tex[field],target,f'textures[{i}].{field}')
    for i,img in enumerate(arrays['images']):
        if not isinstance(img,dict):errors.append(f'images[{i}] invalid');continue
        if 'bufferView' in img:index(img['bufferView'],'bufferViews',f'images[{i}].bufferView')
    if binary is not None:
        internal=[b for b in arrays['buffers'] if isinstance(b,dict) and 'uri' not in b]
        if len(internal)!=1:errors.append('GLB BIN chunk requires exactly one buffer without uri')
        elif not isinstance(internal[0].get('byteLength'),int) or internal[0]['byteLength']>len(binary):
            errors.append('GLB BIN chunk shorter than declared buffer.byteLength')
    for b in arrays['buffers']:
        if isinstance(b,dict) and isinstance(b.get('uri'),str) and not b['uri'].startswith('data:'):
            warnings.append('External buffer URI requires separate availability check: '+b['uri'])
    return {'file':str(path),'ok':not errors,'bytes':size,
      'counts':{k:len(v) for k,v in arrays.items()},'estimatedTriangleListTriangles':triangles,
      'extensionsRequired':required,'errors':errors,'warnings':warnings,
      'limitations':'Structural audit only; estimates omit strips, fans, morph complexity. Run Khronos glTF Validator for spec compliance.'}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('file', type=Path)
    parser.add_argument('--output',type=Path,help='Save JSON report')
    args=parser.parse_args()
    report=inspect_asset(args.file)
    value=json.dumps(report,indent=2,ensure_ascii=False)
    if args.output: args.output.write_text(value+'\n',encoding='utf-8')
    print(value)
    return 0 if report['ok'] else 1
if __name__=='__main__':sys.exit(main())
