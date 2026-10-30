"""Safe deterministic HTML5 build packaging with local asset checks. MIT © 2026 Waldemar Soroka."""
from pathlib import Path
from urllib.parse import urlsplit,unquote
import argparse, json, zipfile, hashlib, re, sys, os
IGNORE={'.DS_Store','Thumbs.db'}
EXTS={'.html','.css','.js','.mjs','.json','.svg','.webp','.png','.jpg','.jpeg','.ico','.wav','.ogg','.mp3','.woff','.woff2','.bin','.wasm','.glb','.gltf','.ktx2','.txt','.webmanifest','.map'}

def scan_html(root,files):
    errors=[];warnings=[]
    for f in files:
        if f.suffix not in ('.html','.css'):continue
        text=f.read_text('utf-8','replace')
        if f.suffix=='.html':
            refs=re.findall(r'\b(?:src|href)\s*=\s*["\']([^"\']+)["\']',text,re.I)
        else:refs=re.findall(r'url\(\s*["\']?([^\)"\']+)',text,re.I)
        for ref in refs:
            if ref.startswith(('data:','#','mailto:','blob:')):continue
            url=urlsplit(ref)
            if url.scheme or ref.startswith('//'):
                warnings.append(f'{f.relative_to(root)}: external asset {ref}')
                continue
            if url.path.startswith('/'):
                errors.append(f'{f.relative_to(root)}: root-absolute asset path {ref}');continue
            dest=(f.parent/unquote(url.path)).resolve()
            try: dest.relative_to(root.resolve())
            except ValueError:errors.append(f'{f.relative_to(root)}: escapes package {ref}');continue
            if url.path and not dest.is_file():errors.append(f'{f.relative_to(root)}: missing asset {ref}')
    return errors,warnings

def collect(root):
    root=Path(root).resolve()
    if not root.is_dir(): raise ValueError('build directory missing')
    files=sorted(f for f in root.rglob('*') if f.is_file() and f.name not in IGNORE)
    errors=[];warnings=[]
    if not (root/'index.html').is_file():errors.append('index.html missing at ZIP root')
    if not files:errors.append('empty build')
    names=set();normalized=set()
    for f in files:
        rp=f.relative_to(root).as_posix();key=rp.lower()
        if f.is_symlink():errors.append(f'symlink not allowed: {rp}')
        if len(rp)>240:errors.append(f'path too long: {rp}')
        if key in normalized:errors.append(f'case-insensitive path collision: {rp}')
        normalized.add(key)
        if f.suffix.lower() not in EXTS:warnings.append(f'unusual asset extension: {rp}')
        if f.stat().st_size>200_000_000:errors.append(f'asset exceeds itch HTML limit 200MB: {rp}')
        names.add(rp)
    if len(files)>1000:errors.append('exceeds itch HTML 1000-file limit')
    if sum(f.stat().st_size for f in files)>500_000_000:errors.append('exceeds itch HTML total 500MB limit')
    missing,warn=scan_html(root,files);errors.extend(missing);warnings.extend(warn)
    return {'root':str(root),'errors':errors,'warnings':warnings,'files':files}

def package(root,output,allow_warnings=True):
    info=collect(root)
    if info['errors']:return {'status':'FAIL','errors':info['errors'],'warnings':info['warnings']}
    output=Path(output).resolve()
    if info['warnings'] and not allow_warnings:return {'status':'FAIL','errors':['warnings forbidden'],'warnings':info['warnings']}
    if output.is_relative_to(Path(root).resolve()):raise ValueError('output must be outside input directory')
    manifest={}
    with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for f in info['files']:
            rp=f.relative_to(Path(root).resolve()).as_posix();payload=f.read_bytes();manifest[rp]=hashlib.sha256(payload).hexdigest()
            zi=zipfile.ZipInfo(rp,date_time=(2020,1,1,0,0,0));zi.compress_type=zipfile.ZIP_DEFLATED;zi.external_attr=0o644 << 16
            z.writestr(zi,payload,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
    with zipfile.ZipFile(output) as z:
        if z.testzip() is not None: raise RuntimeError('zip CRC error')
    return {'status':'PASS','zip':str(output),'files':len(manifest),'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'file_hashes':manifest,'warnings':info['warnings']}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--build',required=True);parser.add_argument('--zip',required=True);parser.add_argument('--report',default=None);parser.add_argument('--strict',action='store_true')
    a=parser.parse_args()
    try:result=package(a.build,a.zip,not a.strict)
    except Exception as e:result={'status':'FAIL','errors':[str(e)]}
    j=json.dumps(result,indent=2,ensure_ascii=False)
    if a.report:Path(a.report).write_text(j+'\n',encoding='utf8')
    print(j);raise SystemExit(0 if result['status']=='PASS' else 1)
