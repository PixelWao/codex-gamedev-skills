#!/usr/bin/env python3
"""Pixel-diff QA CLI. PPM P6 (stdlib), or PNG/JPEG (optional Pillow)."""
import argparse
import json
from pathlib import Path

def _ppm_token(f):
    while True:
        ch=f.read(1)
        if not ch: raise ValueError('unexpected end of PPM header')
        if ch==b'#':
            f.readline();continue
        if ch not in b' \t\r\n':break
    value=bytearray(ch)
    while True:
        ch=f.read(1)
        if not ch or ch in b' \t\r\n': break
        value.extend(ch)
    return bytes(value)

def load_image(filename):
    file=Path(filename)
    if file.suffix.lower()=='.ppm':
        with file.open('rb') as f:
            if _ppm_token(f)!=b'P6': raise ValueError('Only binary PPM P6 supported')
            w,h=int(_ppm_token(f)),int(_ppm_token(f))
            maximum=int(_ppm_token(f))
            if w<1 or h<1 or maximum!=255 or w*h>100_000_000:
                raise ValueError('Unsupported PPM dimensions or maxval')
            data=f.read()
        if len(data)!=w*h*3: raise ValueError('Unexpected PPM byte length')
        return w,h,3,data
    try: from PIL import Image
    except ImportError as ex: raise RuntimeError('PNG/JPEG comparison requires Pillow: pip install pillow') from ex
    with Image.open(file) as image:
        rgba=image.convert('RGBA')
        return rgba.width,rgba.height,4,rgba.tobytes()

def compare(a,b,*,delta=5,allowed_mae=0.0,allowed_changed=0.0):
    wa,ha,ca,pa=load_image(a);wb,hb,cb,pb=load_image(b)
    if (wa,ha,ca)!=(wb,hb,cb):
        raise ValueError(f'image dimensions/channels differ: {(wa,ha,ca)} vs {(wb,hb,cb)}')
    if not 0<=delta<=255 or not 0<=allowed_mae<=255 or not 0<=allowed_changed<=1:
        raise ValueError('invalid threshold')
    total=0; maxi=0; changed=0
    stride=ca
    for pos in range(0,len(pa),stride):
        diffs=[abs(pa[pos+j]-pb[pos+j]) for j in range(stride)]
        total+=sum(diffs)
        maxi=max(maxi,max(diffs))
        changed+=int(max(diffs)>delta)
    pixels=wa*ha
    mae=total/(pixels*stride)
    frac=changed/pixels
    status='PASS' if (mae<=allowed_mae and frac<=allowed_changed) else 'FAIL'
    return {'status':status,'width':wa,'height':ha,'channels':ca,
            'mae':mae,'max_channel_delta':maxi,'fraction_changed_pixels':frac,
            'channel_delta_threshold':delta,'allowed_mae':allowed_mae,
            'allowed_fraction_changed':allowed_changed,'note':'Numerical channel differences, not perceptual metrics'}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('baseline',type=Path);p.add_argument('candidate',type=Path)
    p.add_argument('--delta',type=int,default=5)
    p.add_argument('--max-mae',type=float,default=0.0)
    p.add_argument('--max-changed',type=float,default=0.0)
    p.add_argument('--json',type=Path)
    args=p.parse_args()
    try:
        result=compare(args.baseline,args.candidate,delta=args.delta,
                       allowed_mae=args.max_mae,allowed_changed=args.max_changed)
    except (OSError,RuntimeError,ValueError) as exc:
        result={'status':'ERROR','reason':str(exc)}
    print(json.dumps(result,indent=2))
    if args.json:
        args.json.parent.mkdir(parents=True,exist_ok=True)
        args.json.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    return 0 if result['status']=='PASS' else (2 if result['status']=='ERROR' else 1)
if __name__=='__main__':raise SystemExit(main())
