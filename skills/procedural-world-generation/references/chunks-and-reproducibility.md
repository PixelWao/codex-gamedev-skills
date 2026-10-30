# Global coordinates, seeds, algorithms and chunk contracts

## Coordinate policy

Set one global map coordinate system (e.g. integer tile x/z), chunk origin as integer multiples of chunk size, and exclusive max bound. `chunk(x0,y0,w,h)` samples the same global field as `whole_world[x0:x0+w, y0:y0+h]`. **Never** renormalize coordinates to local chunk width/height; that creates abrupt seams and different landscapes when render distance changes.

The baseline generator uses three shape modes:

- `infinite`: pure global sampling, accepts negative `origin-x`/`origin-y`.
- `island` and `archipelago`: global sampling with finite world-size mask, requires the requested region to remain inside the declared world.
- No wraparound mode is implemented. For wraparound worlds use cylinder/torus embeddings in 3D/4D noise or another explicitly periodic field, then test equal edge values and normals.

## Domain independence

Do not rely on a single sequential PRNG stream for every feature. Derive independent keys using a stable, documented function from `(master_seed, algorithm_version, domain, tile/object ID)`. If adding decorative grass changes enemy placement, streams are inadvertently coupled.

The included implementation uses SHA-256 to derive 64-bit field keys, then a fixed 64-bit mixer over integer lattice coordinates; this is not intended as cryptography. Perlin/Simplex implementations may vary output by library version, architecture or API initialization. Pin versions and fixtures. JavaScript's `Math.random()` has no user-controlled seed; pass a seedable PRNG to the library.

## Compatibility record for saves

```json
{
  "generator": "your-worldgen",
  "algorithm_version": "world-v1",
  "master_seed": "user-visible-147",
  "field_domains": ["elevation", "moisture", "temperature"],
  "settings": {"world_width": 192, "world_height": 128, "shape": "island"},
  "coordinate_system": "global-x-right-y-down",
  "quantization": "six-decimal-demo-only",
  "dependency_versions": {"your_noise_library": "pinned-version"}
}
```

Hash canonical semantic data (grid, quantized heightfield, versions) with a documented serialization. Never promise byte-identical outputs across runtimes without verifying the numerical behavior. If save compatibility matters, choose a migration or persist generated world material, not merely a seed.

## Determinism tests

- Same seed, same configuration: exact identical data/hash.
- Generation order and chunk sizes don't change tile values.
- Independent keys for separate content domains.
- Invalid regions/NaN/scales fail quickly.
- Algorithm version intentionally changes saved snapshots only with documented migration.
