/** Container-based viewport for WebGLRenderer (r180+); pure dependency-injected JS. */
function positiveFinite(number) { return Number.isFinite(number) && number > 0; }
export function computeViewport({ width, height, dpr = 1, maxDpr = 2, maxPixels = 3_000_000 }) {
  if (![width, height, dpr, maxDpr, maxPixels].every(positiveFinite)) return null;
  const cssWidth = Math.max(1, Math.round(width));
  const cssHeight = Math.max(1, Math.round(height));
  const ratio = Math.min(dpr, maxDpr, Math.sqrt(maxPixels / (cssWidth * cssHeight)));
  return { width: cssWidth, height: cssHeight, pixelRatio: ratio };
}

export function createViewportController({ renderer, camera, container, getDpr = () => 1,
  maxDpr = 2, maxPixels = 3_000_000, orthographicHalfHeight = undefined,
  ResizeObserverClass = typeof ResizeObserver !== 'undefined' ? ResizeObserver : null,
  windowTarget = typeof window !== 'undefined' ? window : null, onResize = () => {} }) {
  if (!renderer || typeof renderer.setSize !== 'function' || typeof renderer.setPixelRatio !== 'function') throw new TypeError('WebGLRenderer-compatible renderer required');
  if (!camera || typeof camera.updateProjectionMatrix !== 'function') throw new TypeError('camera required');
  if (!container || typeof container.getBoundingClientRect !== 'function') throw new TypeError('container required');
  let currentKey = null;
  let disposed = false;
  function update() {
    if (disposed) return false;
    const rect = container.getBoundingClientRect();
    const view = computeViewport({ width: rect.width, height: rect.height, dpr: getDpr(), maxDpr, maxPixels });
    if (!view) return false; // hidden panels with zero size: don't corrupt projection.
    const key = `${view.width}:${view.height}:${view.pixelRatio.toFixed(6)}`;
    if (key === currentKey) return false;
    const aspect = view.width / view.height;
    if (camera.isPerspectiveCamera) camera.aspect = aspect;
    else if (camera.isOrthographicCamera) {
      if (!positiveFinite(orthographicHalfHeight)) throw new Error('orthographicHalfHeight is required for orthographic camera');
      camera.left = -orthographicHalfHeight * aspect;
      camera.right = orthographicHalfHeight * aspect;
      camera.top = orthographicHalfHeight;
      camera.bottom = -orthographicHalfHeight;
    } else throw new Error('Unsupported camera projection');
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(view.pixelRatio);
    renderer.setSize(view.width, view.height, false);
    currentKey = key;
    onResize(view);
    return true;
  }
  const observer = ResizeObserverClass ? new ResizeObserverClass(update) : null;
  if (observer) observer.observe(container);
  if (windowTarget?.addEventListener) windowTarget.addEventListener('resize', update);
  update();
  return {
    update,
    dispose() {
      if (disposed) return;
      disposed = true;
      observer?.disconnect();
      windowTarget?.removeEventListener?.('resize', update);
    },
  };
}
