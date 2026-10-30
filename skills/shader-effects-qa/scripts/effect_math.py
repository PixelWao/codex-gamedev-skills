#!/usr/bin/env python3
"""Reference scalar math for shader edge-case tests (not a shader compiler)."""
import argparse
import math

def smoothstep(edge0, edge1, value):
    if not all(math.isfinite(n) for n in (edge0, edge1, value)):
        raise ValueError('non-finite value')
    if not edge0 < edge1:
        raise ValueError('smoothstep edge1 must be strictly greater than edge0')
    t = max(0.0, min(1.0, (value-edge0)/(edge1-edge0)))
    return t*t*(3.0-2.0*t)

def vignette_factor(uv, *, inner=0.2, outer=0.65, strength=0.6, aspect=1.0):
    if not all(math.isfinite(x) for x in (*uv, inner, outer, strength, aspect)):
        raise ValueError('non-finite argument')
    if aspect <= 0 or not 0 <= strength <= 1 or inner < 0 or outer <= inner:
        raise ValueError('invalid vignette parameters')
    d = math.hypot((uv[0]-0.5)*aspect, uv[1]-0.5)
    return 1.0 - strength * smoothstep(inner,outer,d)

def dissolve_edge(noise, threshold, width):
    if not all(math.isfinite(x) for x in (noise, threshold, width)):
        raise ValueError('non-finite argument')
    if not 0 <= noise <= 1 or not 0 <= threshold <= 1 or width <= 0:
        raise ValueError('invalid noise/threshold/width')
    return {'visible':noise >= threshold,
            'edge_mix':smoothstep(threshold, threshold + width, noise)}

def self_test():
    assert smoothstep(0,1,-1)==0
    assert smoothstep(0,1,0.5)==0.5
    assert smoothstep(0,1,2)==1
    assert vignette_factor((0.5,0.5))==1
    assert vignette_factor((0,0),inner=0.1,outer=0.25,strength=0.6)==0.4
    assert not dissolve_edge(0.3,0.5,0.1)['visible']
    assert dissolve_edge(0.6,0.5,0.1)['visible']
    return True
if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--self-test',action='store_true',required=True)
    args=parser.parse_args()
    if args.self_test and self_test(): print('PASS: reference shader mathematics')
