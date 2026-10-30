# Changelog

## 2.0.0 — 2026-10-22

- Advanced single-skill modularization preserving one entry point.
- Added r180-safe version detection, with r183+ Timer guidance but no requirement.
- Introduced exclusive render-loop ownership guard, bounded dt, and true event-driven demand rendering.
- Reworked viewport updates for container/ResizeObserver, DPR, pixel budgets and orthographic projection.
- Added pointer-to-NDC helper and transform-preserving guarded reparent operation.
- Replaced unsafe `traverse().dispose()` example with explicit shared-resource lease registry and teardown scopes.
- Added 31 Node unit tests, optional real-Three.js test, runnable standalone demo, release validator and QA template.
- Added MIT licensing of new materials and retained upstream Apache 2.0 license/NOTICE in attribution.
