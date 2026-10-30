# Visual comparison protocol

1. Freeze camera, time, seed, animations, light state and deterministic particle behavior. Use the same source assets, viewport, DPR, tone mapping, GPU backend and color settings.
2. Capture the baseline and candidate screenshots in the same pixel format and dimensions. Do not resize images to mask resolution regressions.
3. Exclude cursor/tool overlays, clock, dynamically varying UI, and other deliberately nondeterministic regions by using proper capture procedures. For genuinely maskable UI, document masking explicitly rather than silently changing tests.
4. Calculate mean absolute per-channel pixel difference (MAE), max difference and percentage of pixels exceeding channel delta. Compare alpha too if RGBA (our checker converts to RGBA).
5. Set thresholds for specific contexts (pixel-art vs anti-aliased 3D). No universal acceptable percentage exists.
6. Inspect the diff image manually; equal MAE can correspond to different visual defects. Check halo/alpha edge and saturated bloom regions separately.
7. If reference image is generated on another GPU, nondeterministic antialiasing and drivers can legitimately differ. Capture per-platform reference if needed.

The packaged checker accepts PPM P6 without third-party libraries; PNG/JPEG require Pillow. Its output is channel-based difference, **not perceptual colorimetry**. It cannot tell whether art direction is better or gameplay is more readable.
