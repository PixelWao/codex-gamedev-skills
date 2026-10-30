#!/usr/bin/env python3
"""MIT (c) 2026 Waldemar Soroka. RGB pixel difference QA, not a perceptual metric."""
from __future__ import annotations
import argparse
import json
import math
from pathlib import Path


def compare_images(baseline_path: str, candidate_path: str, *, pixel_diff: int = 20) -> dict:
    try:
        from PIL import Image, ImageChops, ImageStat
    except ImportError as exc:
        raise RuntimeError('Pillow is required: pip install pillow') from exc
    if not 0 <= pixel_diff <= 255:
        raise ValueError('pixel_diff must be between 0 and 255')
    with Image.open(baseline_path) as ref, Image.open(candidate_path) as cur:
        if ref.size != cur.size:
            raise ValueError(f'image size mismatch: {ref.size} != {cur.size}')
        a, b = ref.convert('RGB'), cur.convert('RGB')
        diff = ImageChops.difference(a, b)
        stats = ImageStat.Stat(diff)
        mae = sum(stats.mean) / 3
        # RMS channel aggregation: avoids averaging per-channel RMSE incorrectly.
        rmse = math.sqrt(sum(v * v for v in stats.rms) / 3)
        maxdiff = max(max(ch.getextrema() or (0,0)) for ch in diff.split())
        counted=sum(1 for px in diff.get_flattened_data() if max(px)>pixel_diff)
        total=a.width*a.height
        return {'width':a.width,'height':a.height,'mae':mae,'rmse':rmse,
                'max_channel_diff':maxdiff,'changed_pixels':counted,
                'changed_pct':100*counted/total if total else 0,
                'pixel_threshold':pixel_diff,
                'note':'RGB pixel metrics only; human visual review required.'}


def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('baseline');p.add_argument('candidate')
    p.add_argument('--pixel-diff',type=int,default=20)
    p.add_argument('--mae-max',type=float,default=5)
    p.add_argument('--changed-pct-max',type=float,default=2)
    p.add_argument('--out',type=Path)
    args=p.parse_args(argv)
    if not (math.isfinite(args.mae_max) and args.mae_max>=0 and math.isfinite(args.changed_pct_max) and 0<=args.changed_pct_max<=100):
        p.error('Invalid threshold')
    try:
        report=compare_images(args.baseline,args.candidate,pixel_diff=args.pixel_diff)
    except (ValueError, OSError, RuntimeError) as e:
        p.exit(2,f'ERROR: {e}\n')
    report['thresholds']={'mae_max':args.mae_max,'changed_pct_max':args.changed_pct_max}
    report['pass']=report['mae']<=args.mae_max and report['changed_pct']<=args.changed_pct_max
    output=json.dumps(report,indent=2)
    if args.out:args.out.write_text(output+'\n',encoding='utf8')
    print(output)
    return 0 if report['pass'] else 1


if __name__=='__main__':
    raise SystemExit(main())
