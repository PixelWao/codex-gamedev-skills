// MIT — Copyright (c) 2026 Waldemar Soroka
/** Return finite percentage or null when Content-Length is unknown. */
export function progressPercent(event) {
  if (!event || !Number.isFinite(event.loaded) || !Number.isFinite(event.total)
      || event.loaded < 0 || event.total <= 0) return null;
  return Math.max(0, Math.min(100, (event.loaded / event.total) * 100));
}
// Usage:
// loader.load(url, onReady, e => {
//   const pct = progressPercent(e);
//   progressUI.textContent = pct === null ? 'Loading…' : `${pct.toFixed(0)}% transferred`;
// }, onError);
// Note: 100% transferred != model decoded or uploaded to GPU.
