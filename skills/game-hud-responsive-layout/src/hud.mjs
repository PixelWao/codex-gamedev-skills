/** MIT © 2026 Waldemar Soroka. DOM/Canvas game HUD utilities. */
const finite = (x, label) => { if (!Number.isFinite(x)) throw new RangeError(`${label} must be finite`); return x; };
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export function safeRect(viewport, insets = {}) {
  const width = finite(viewport.width, 'width'), height = finite(viewport.height, 'height');
  if (width <= 0 || height <= 0) throw new RangeError('viewport dimensions must be positive');
  const sides = {};
  for (const k of ['top', 'right', 'bottom', 'left']) {
    sides[k] = finite(insets[k] ?? 0, k);
    if (sides[k] < 0) throw new RangeError(`${k} negative`);
  }
  // Insets are in CSS viewport pixels, never screen coordinates.
  const l = clamp(sides.left, 0, width), r = clamp(sides.right, 0, width - l);
  const t = clamp(sides.top, 0, height), b = clamp(sides.bottom, 0, height - t);
  return { x:l, y:t, width:width-l-r, height:height-t-b, insets:{top:t,right:r,bottom:b,left:l} };
}
export function layoutForViewport({width, height, dpr = 1, insets = {}, referenceWidth=1280, referenceHeight=720, minScale=0.65, maxScale=2}) {
  finite(dpr,'dpr'); finite(referenceWidth,'referenceWidth'); finite(referenceHeight,'referenceHeight');
  if (dpr<=0 || referenceWidth<=0 || referenceHeight<=0 || minScale<=0 || maxScale<minScale) throw new RangeError('invalid layout parameters');
  const safe = safeRect({width,height},insets);
  const scale = clamp(Math.min(safe.width/referenceWidth, safe.height/referenceHeight), minScale, maxScale);
  return { cssWidth:width, cssHeight:height, backingWidth:Math.round(width*dpr), backingHeight:Math.round(height*dpr), dpr, safe, scale };
}
export function configureCanvas(canvas, width, height, dpr=1) {
  if (!canvas || !canvas.style || !canvas.getContext) throw new TypeError('canvas required');
  const layout = layoutForViewport({width,height,dpr});
  canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
  canvas.width=layout.backingWidth; canvas.height=layout.backingHeight;
  const ctx=canvas.getContext('2d');
  if(!ctx) throw new Error('Canvas 2D unavailable');
  // Absolute transform; repeated resize cannot accumulate scale.
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return {ctx,layout};
}
export function healthFraction(current,maximum) {
  finite(current,'health'); finite(maximum,'maximum health');
  return maximum <= 0 ? 0 : clamp(current/maximum,0,1);
}
export function bindHud({store, select, render}) {
  if(!store || typeof store.subscribe!=='function' || typeof store.getSnapshot!=='function' || typeof select!=='function' || typeof render!=='function') throw new TypeError('store/getSnapshot/subscribe, select and render required');
  let alive=true; let last=Symbol('first');
  const update=()=>{ if(!alive) return; const next=select(store.getSnapshot()); if (!Object.is(next,last)) {last=next;render(next);} };
  // Subscribe before snapshot so changes between operations are not lost.
  const unsubscribe=store.subscribe(update);
  if(typeof unsubscribe!=='function') throw new TypeError('subscribe must return unsubscribe');
  update();
  return ()=>{ if(!alive)return;alive=false;unsubscribe(); };
}
export function makeHudStore(initial={}) {
  let snapshot={...initial};const listeners=new Set();
  return {getSnapshot:()=>snapshot, subscribe:(fn)=>{listeners.add(fn);return()=>listeners.delete(fn);}, patch:(p)=>{snapshot={...snapshot,...p};for(const fn of [...listeners])fn();}};
}
export function projectThreeToCss(worldPoint,camera,rect,Vector3Ctor) {
  if (!Vector3Ctor || !camera || !rect || !worldPoint) throw new TypeError('Three Vector3 constructor, camera, rect and point required');
  const p=new Vector3Ctor(worldPoint.x,worldPoint.y,worldPoint.z);
  // Camera must have its world matrices updated by scene owner before calling.
  p.applyMatrix4(camera.matrixWorldInverse);
  const behind=p.z>=0;
  p.applyMatrix4(camera.projectionMatrix);
  // Three perspective projection: visible clip cube only when -1 <= z <= 1.
  const visible=!behind && p.x>=-1&&p.x<=1&&p.y>=-1&&p.y<=1&&p.z>=-1&&p.z<=1;
  return {x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2, visible, behind};
}
export function watchViewport(element,onChange,{observerCtor=globalThis.ResizeObserver,visualViewport=globalThis.visualViewport,windowObject=globalThis.window}={}) {
  if(!element||!onChange||typeof observerCtor!=='function') throw new TypeError('ResizeObserver required');
  let active=true;
  const emit=()=>{if(!active)return; const r=element.getBoundingClientRect();if(r.width>0&&r.height>0)onChange({width:r.width,height:r.height,dpr:windowObject?.devicePixelRatio??1});};
  const observer=new observerCtor(emit);observer.observe(element);
  visualViewport?.addEventListener?.('resize',emit);windowObject?.addEventListener?.('resize',emit);
  emit();
  return ()=>{active=false;observer.disconnect();visualViewport?.removeEventListener?.('resize',emit);windowObject?.removeEventListener?.('resize',emit);};
}
