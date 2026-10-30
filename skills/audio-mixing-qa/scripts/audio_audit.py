#!/usr/bin/env python3
"""PCM WAV technical audit, not a LUFS/true-peak estimator. MIT (c) 2026 Waldemar Soroka."""
import argparse
import json
import math
import os
import struct
import subprocess
import wave
from pathlib import Path


def _samples(data, width):
    if width == 1:
        return [(x - 128) / 128 for x in data]
    if width == 2:
        return [x / 32768 for x in struct.unpack('<' + 'h'*(len(data)//2), data)]
    if width == 3:
        result = []
        for i in range(0, len(data), 3):
            raw = int.from_bytes(data[i:i+3], 'little', signed=False)
            if raw & 0x800000: raw -= 0x1000000
            result.append(raw/8388608)
        return result
    if width == 4:
        return [x / 2147483648 for x in struct.unpack('<' + 'i'*(len(data)//4), data)]
    raise ValueError(f'Unsupported PCM sample width: {width}')


def audit_wav(path, *, peak_warning_dbfs=-1.0, dc_warning=.02, seam_warning=.1, silence_threshold_dbfs=-70):
    path=Path(path)
    if path.stat().st_size > 32 * 1024 * 1024:
        raise ValueError('WAV exceeds 32 MiB in-memory audit limit; use FFmpeg or a streaming tool')
    with wave.open(str(path), 'rb') as wav:
        rate=wav.getframerate(); channels=wav.getnchannels(); frames=wav.getnframes()
        width=wav.getsampwidth(); comp=wav.getcomptype()
        if comp != 'NONE' or channels < 1 or rate < 1:
            raise ValueError('Only uncompressed integer PCM WAV is supported')
        samples=_samples(wav.readframes(frames), width)
    if not samples or len(samples) != frames*channels:
        raise ValueError('Empty or truncated PCM WAV')
    peak=max(abs(x) for x in samples)
    sum_squares=sum(x*x for x in samples); mean=sum(samples)/len(samples)
    rms=math.sqrt(sum_squares / len(samples))
    per_channel_edge=[abs(samples[c] - samples[-channels+c]) for c in range(channels)]
    zero_crossing_rate=sum((samples[i-1]<0)!=(samples[i]<0) for i in range(channels,len(samples),channels))/max(1,frames-1)
    db=lambda x: (20*math.log10(x) if x>0 else None)
    warn=[]
    if peak and db(peak) >= peak_warning_dbfs: warn.append('HIGH_SAMPLE_PEAK_NOT_TRUE_PEAK')
    if abs(mean)>dc_warning: warn.append('DC_OFFSET')
    if max(per_channel_edge)>seam_warning: warn.append('LOOP_EDGE_DISCONTINUITY_CANDIDATE')
    if rms == 0 or db(rms) < silence_threshold_dbfs: warn.append('SILENT_OR_NEAR_SILENT')
    return dict(file=path.name, sample_rate=rate,channels=channels,frames=frames,sample_width_bytes=width,
                seconds=round(frames/rate,6),sample_peak_dbfs=db(peak),rms_dbfs=db(rms),
                dc_offset=mean,max_loop_edge_jump=max(per_channel_edge),zero_crossing_rate=zero_crossing_rate,
                warnings=warn,limitations=['No LUFS measurement','No oversampled true-peak measurement',
                                            'Loop edge heuristic is not a listening test'])


def ffmpeg_ebur128(path, executable='ffmpeg'):
    """Optional independently measured integrated LUFS and maximum true peak via FFmpeg EBU R128."""
    cmd=[executable,'-hide_banner','-nostdin','-i',str(path),'-filter_complex','ebur128=peak=true',
         '-f','null','-']
    p=subprocess.run(cmd,capture_output=True,text=True,timeout=120,check=False)
    if p.returncode:
        return {'available':False,'error':p.stderr[-600:]}
    text=p.stderr
    marker=text.rfind('Summary:')
    if marker<0: return {'available':False,'error':'No summary returned by FFmpeg'}
    import re
    tail=text[marker:]
    m=re.search(r'Integrated loudness:\s*I:\s*(-?\d+(?:\.\d+)?)\s*LUFS',tail)
    tp=re.search(r'True peak:\s*Peak:\s*(-?\d+(?:\.\d+)?)\s*dBFS',tail)
    return {'available':bool(m), 'integrated_lufs':float(m.group(1)) if m else None,
            'max_true_peak_dbtp':float(tp.group(1)) if tp else None,
            'backend':'ffmpeg ebur128=peak=true'}


def main():
    a=argparse.ArgumentParser(description=__doc__)
    a.add_argument('wav',nargs='+',type=Path);a.add_argument('--output',type=Path)
    a.add_argument('--with-ebur128',action='store_true',help='Optional FFmpeg integrated LUFS/true peak')
    a.add_argument('--peak-warning-dbfs',type=float,default=-1.0)
    ns=a.parse_args(); results=[]
    for path in ns.wav:
        try:
            item=audit_wav(path,peak_warning_dbfs=ns.peak_warning_dbfs)
            if ns.with_ebur128: item['ebur128']=ffmpeg_ebur128(path)
        except (OSError,ValueError,EOFError,wave.Error) as e:
            item={'file':path.name,'error':str(e)}
        results.append(item)
    report={'schema_version':1,'files':results,'has_errors':any('error' in i for i in results)}
    payload=json.dumps(report,indent=2,ensure_ascii=False,allow_nan=False)
    if ns.output: ns.output.write_text(payload+'\n',encoding='utf-8')
    else: print(payload)
    return 2 if report['has_errors'] else 0
if __name__ == '__main__': raise SystemExit(main())
