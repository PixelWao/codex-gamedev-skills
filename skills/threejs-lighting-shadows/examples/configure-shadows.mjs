// Copyright (c) 2026 Waldemar Soroka — MIT
// Tune existing DirectionalLight only. Never create renderer or animation loop.
export function configureDirectionalShadows(light, options={}) {
  const shadow=light?.shadow, camera=shadow?.camera;
  if(!camera?.isOrthographicCamera || !shadow?.mapSize?.set) throw new TypeError('DirectionalLight with orthographic shadow camera required');
  const b=options.bounds ?? {left:-12,right:12,top:12,bottom:-12};
  const near=options.near ?? 0.5, far=options.far ?? 80;
  const size=options.mapSize ?? 1024;
  const nums=[b.left,b.right,b.top,b.bottom,near,far,size];
  if(!nums.every(x=>typeof x==='number'&&Number.isFinite(x))) throw new RangeError('Invalid non-finite shadow parameter');
  if(!(b.left<b.right&&b.bottom<b.top&&near>0&&far>near)) throw new RangeError('Invalid shadow frustum');
  if(!Number.isInteger(size) || size<64 || size>8192 || (size&(size-1))!==0) throw new RangeError('mapSize must be power of two 64..8192; verify hardware limit');
  const bias=options.bias??0, normalBias=options.normalBias??0;
  if(![bias,normalBias].every(Number.isFinite)) throw new RangeError('Non-finite bias');
  if(Math.abs(bias)>0.02 || normalBias<0 || normalBias>2) throw new RangeError('Bias outside review limits, inspect scene scale');
  Object.assign(camera,{left:b.left,right:b.right,top:b.top,bottom:b.bottom,near,far});
  camera.updateProjectionMatrix();
  shadow.mapSize.set(size,size);
  shadow.bias=bias;shadow.normalBias=normalBias;
  light.castShadow=true;
  if(options.staticShadow===true) shadow.autoUpdate=false;
  else if(options.staticShadow===false) shadow.autoUpdate=true;
  shadow.needsUpdate=true;
  return light;
}
export function invalidateShadow(light){
  if(!light?.shadow)throw new TypeError('Shadow-casting light required');
  light.shadow.needsUpdate=true;
}
export function enableRendererShadows(renderer){
  if(!renderer?.shadowMap) throw new TypeError('Renderer shadowMap required');
  renderer.shadowMap.enabled=true;
  return renderer;
}
