# World pipeline: terrain, climate and geometry

## Preferred separation

`seed/config -> sampled scalar fields -> semantic terrain/biome layers -> gameplay masks -> mesh/tiles/assets`.

**Scalar fields**: gradient noise (Perlin/Simplex) or value noise, with explicit input ranges and normalization. Value noise is used in `scripts/worldgen.py` only to provide a self-contained deterministic reference; it is not equivalent to OpenSimplex in appearance or spectral characteristics. Each octave has a distinct seed namespace; combine fixed world-unit wavelengths and amplitudes. For fBm, divide by the amplitude sum. Never assume every noise library returns [0, 1]; test its range.

**Landmass**: finite-island shaping applies a global radial falloff, not per-chunk falloff. `archipelago` in the included demo blends a coarse domain-specific field with a radial attenuation; it produces stylized patches, **not** tectonics. Verify land fraction across several seeds before relying on it for strategic maps.

**Climate**: elevation, latitude and moisture are separate fields in the demo; temperature is synthetic, with no wind or energy balance. Production climate can introduce orographic rain-shadow, humidity transport and seasons, but only if the game needs them. Design thresholds by actual distribution and gameplay roles, not aesthetically plausible constants.

**Rivers and roads**: never equate a threshold on blue noise with physical drainage. For a hydrological pipeline, choose outlets, fill/depress sinks where required, compute downslope flow, flow accumulation, then drainage/erosion. Preserve watershed constraints; river start/end should be inspectable in debug overlays. Roads/settlements must use actual route cost, not merely paint strokes on arbitrary tiles. For networked strategy maps, separately validate shipping lanes, travel blockers and faction spawn fairness.

**Resources and props**: maintain isolated keyed streams (`seed/resource-type/entity-id`). For tree scatter, jittered lattices or Poisson-disc methods can enforce minimum distance. Do not say Poisson-disc guarantees no clumping at every large scale; it enforces local spacing under configured radius, not balanced biome population. Enforce finite attempts/density caps and report skipped candidates.

## Three.js/3D adapter rules

- Apply stable `(global_x, global_z) -> elevation` mapping; decide whether world `y` is up. Keep all origins consistent with existing project transform.
- Reuse border samples so adjacent chunk geometry has matching vertex positions; edge normals can still seam if computed from truncated local data. For normal continuity, sample the one-cell/tangent halo outside each chunk or compute consistent analytic derivatives.
- Mesh resolutions and LOD should change appearance without changing **authoritative** navigation and collision unexpectedly. Avoid collider rebuilding each frame.
- For streaming, fetch/generate bounded chunks by coordinate key `(algo_version, seed, chunk_x, chunk_y, settings_hash)`; schedule work off the render hot path when profiling supports it. Do not add another `requestAnimationFrame` loop or mutate project-save formats unilaterally.
- Serialization stores semantic tiles and seed/config; if exact terrain snapshots are required for old saves, store tile/height values or pin the entire dependency/runtime contract. Quantize before hash comparisons when platform-specific float differences are acceptable by design.

## Correctness tests

1. Compare entire `grid` and heightfield submatrices between full map and independently generated chunks.
2. Sample negative origins in infinite mode and cell positions around 0 and noise lattice boundaries.
3. Verify sampled values finite, bounded, deterministic and domain-separated.
4. Capture representative biomes / water fractions across fixed seeds, not one image.
5. Profile CPU generation, allocations, upload-to-GPU and mesh draw calls independently.
6. Simulate actual gameplay: faction distance, coast access, unit movement rules and spawn viability.

This is an engineering checklist, not a claim that these capabilities are implemented in the demonstration CLI.
