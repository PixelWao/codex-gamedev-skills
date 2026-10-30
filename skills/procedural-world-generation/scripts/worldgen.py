#!/usr/bin/env python3
"""Deterministic global-coordinate terrain reference generator; Python stdlib only.

This is deliberately a small, inspectable baseline. Realistic hydrology, navigation
and ecological simulation are design stages, NOT claimed properties of this tool.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from collections import Counter
from pathlib import Path

MASK = (1 << 64) - 1
ALGORITHM = "value-noise-world-v1"
TILES = {"W":"deep_water", "S":"shore", "D":"desert", "G":"grassland", "F":"forest",
         "H":"hills", "M":"mountain", "T":"tundra", "I":"ice"}


def seed_key(seed, domain="terrain"):
    payload = ("world-v1|" + str(seed) + "|" + domain).encode("utf-8")
    return int.from_bytes(hashlib.sha256(payload).digest()[:8], "little")


def mix64(n):
    n = (n + 0x9e3779b97f4a7c15) & MASK
    n = ((n ^ (n >> 30)) * 0xbf58476d1ce4e5b9) & MASK
    n = ((n ^ (n >> 27)) * 0x94d049bb133111eb) & MASK
    return (n ^ (n >> 31)) & MASK


def lattice(key, x, y):
    n = mix64((key ^ ((x * 0xD6E8FEB86659FD93) & MASK) ^
               ((y * 0xA5A3564E27F886B5) & MASK)) & MASK)
    return (n >> 11) / (1 << 53)


def smooth(t):
    return t * t * (3 - 2 * t)


def noise(key, x, y):
    """Interpolated seeded value noise, continuous at integer lattice borders."""
    x0, y0 = math.floor(x), math.floor(y)
    tx, ty = smooth(x - x0), smooth(y - y0)
    a = lattice(key, x0, y0) * (1 - tx) + lattice(key, x0 + 1, y0) * tx
    b = lattice(key, x0, y0 + 1) * (1 - tx) + lattice(key, x0 + 1, y0 + 1) * tx
    return a * (1 - ty) + b * ty


def fbm(key, x, y, scale=48.0, octaves=5, persistence=0.55, lacunarity=2.0):
    if not (math.isfinite(scale) and scale > 0 and 1 <= octaves <= 8 and
            math.isfinite(persistence) and 0 < persistence <= 1 and
            math.isfinite(lacunarity) and 1 < lacunarity <= 4):
        raise ValueError("invalid fBm parameters")
    amplitude, frequency, total, weight = 1.0, 1.0, 0.0, 0.0
    for i in range(octaves):
        # Separate octave keys: changing a detail layer does not rescramble others.
        okey = mix64(key ^ (i * 0x9e3779b97f4a7c15))
        total += amplitude * noise(okey, x * frequency / scale, y * frequency / scale)
        weight += amplitude
        amplitude *= persistence
        frequency *= lacunarity
    return total / weight


def clamp01(v):
    return min(1.0, max(0.0, v))


def biome(h, moisture, temperature, sea_level):
    if h < sea_level - 0.055:
        return "W"
    if h < sea_level:
        return "S"
    if h > 0.84 and temperature < 0.40:
        return "I"
    if h > 0.76:
        return "M"
    if temperature < 0.24:
        return "T"
    if h > 0.66:
        return "H"
    if moisture < 0.30 and temperature > 0.43:
        return "D"
    if moisture > 0.53:
        return "F"
    return "G"


def validate_args(width, height, world_width, world_height, x0, y0, shape, sea_level, scale, octaves):
    if (not all(isinstance(v, int) for v in (width, height, world_width, world_height, x0, y0)) or
            width < 1 or height < 1 or width > 512 or height > 512 or width * height > 150000 or
            world_width < 1 or world_height < 1):
        raise ValueError("invalid map bounds or excessive cell count (limit 150000)")
    if not (math.isfinite(sea_level) and 0 < sea_level < 1):
        raise ValueError("sea-level must be between 0 and 1")
    if shape not in ("infinite", "island", "archipelago"):
        raise ValueError("unsupported shape")
    if shape != "infinite" and (x0 < 0 or y0 < 0 or
                                x0 + width > world_width or y0 + height > world_height):
        raise ValueError("bounded world requires region inside world bounds")
    if not math.isfinite(scale) or not 4 <= scale <= 4096 or not 1 <= octaves <= 8:
        raise ValueError("invalid scale/octaves")


def generate(seed="demo", width=48, height=32, x0=0, y0=0, world_width=192,
             world_height=128, shape="island", sea_level=0.48, scale=48., octaves=5):
    validate_args(width, height, world_width, world_height, x0, y0, shape, sea_level, scale, octaves)
    elevation_key = seed_key(seed, "elevation")
    moisture_key = seed_key(seed, "moisture")
    temp_key = seed_key(seed, "temperature")
    shape_key = seed_key(seed, "landmask")
    grid, heights, wetness = [], [], []
    for local_y in range(height):
        gy = y0 + local_y
        line, hline, mline = [], [], []
        for local_x in range(width):
            gx = x0 + local_x
            h = fbm(elevation_key, gx, gy, scale, octaves)
            moisture = fbm(moisture_key, gx, gy, scale * 1.3, 4)
            temperature = fbm(temp_key, gx, gy, scale * 2, 3)
            if shape != "infinite":
                nx = 2 * (gx + 0.5) / world_width - 1
                ny = 2 * (gy + 0.5) / world_height - 1
                edge = clamp01(math.sqrt(nx*nx + ny*ny) / 1.02)
                island_mask = (1 - smooth(edge))
                if shape == "archipelago":
                    patches = fbm(shape_key, gx, gy, scale * 1.8, 3)
                    # Several possible islands, but the border remains sea.
                    h = 0.37 * h + 0.63 * (patches * island_mask)
                else:
                    h = 0.55 * h + 0.45 * island_mask
            h = clamp01(h)
            temperature = clamp01(0.55 * temperature + 0.45 * (1 - abs(2 * (gy + .5) / world_height - 1)))
            line.append(biome(h, moisture, temperature, sea_level))
            hline.append(round(h, 6))
            mline.append(round(moisture, 6))
        grid.append("".join(line))
        heights.append(hline)
        wetness.append(mline)
    counts = dict(sorted(Counter("".join(grid)).items()))
    return {"schema": "pcg-map-v1", "kind": "world", "algorithm": ALGORITHM,
            "seed": str(seed), "metadata": {"shape":shape,"origin":[x0,y0],
            "world_size":[world_width,world_height],"width":width,"height":height,
            "sea_level":sea_level,"scale":scale,"octaves":octaves,
            "coords":"global-x-right-y-down", "tile_legend":TILES},
            "grid":grid, "heightfield":heights, "moisture":wetness,
            "metrics":{"tile_counts":counts,"water_fraction":round((counts.get("W",0)+counts.get("S",0))/(width*height),6)}}


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--seed", default="demo")
    p.add_argument("--width", type=int, default=48)
    p.add_argument("--height", type=int, default=32)
    p.add_argument("--origin-x", type=int, default=0)
    p.add_argument("--origin-y", type=int, default=0)
    p.add_argument("--world-width", type=int, default=192)
    p.add_argument("--world-height", type=int, default=128)
    p.add_argument("--shape", choices=["island","archipelago","infinite"], default="island")
    p.add_argument("--sea-level", type=float, default=0.48)
    p.add_argument("--scale", type=float, default=48.)
    p.add_argument("--octaves", type=int, default=5)
    p.add_argument("--output", help="JSON path; otherwise stdout")
    args = p.parse_args(argv)
    try:
        result = generate(args.seed, args.width, args.height, args.origin_x,args.origin_y,
                          args.world_width, args.world_height, args.shape,args.sea_level,args.scale,args.octaves)
    except ValueError as e:
        p.error(str(e))
    serialized = json.dumps(result, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    if args.output:
        Path(args.output).write_text(serialized + "\n", encoding="utf-8")
    else:
        print(serialized)


if __name__ == "__main__":
    main()
