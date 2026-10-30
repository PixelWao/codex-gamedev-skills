/** Geometry-only level-design helpers. Y is UP for ballistic calculations. No game loop. */
export function finiteNumber(value, label) { if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite`); return value; }
export function positive(value, label) { finiteNumber(value,label); if (value <= 0) throw new RangeError(`${label} must be > 0`); return value; }
export function jumpEnvelope({runSpeed, jumpSpeed, gravity, deltaY=0, clearance=0}) {
  positive(runSpeed,'runSpeed'); positive(jumpSpeed,'jumpSpeed'); positive(gravity,'gravity'); finiteNumber(deltaY,'deltaY');
  if (!(Number.isFinite(clearance) && clearance >= 0)) throw new RangeError('clearance must be nonnegative');
  // Landing must be at least deltaY+clearance above takeoff.
  const effectiveRise=deltaY+clearance;
  const discriminant=jumpSpeed*jumpSpeed-2*gravity*effectiveRise;
  if (discriminant < -1e-10) return {reachable:false, maxDistance:0, landingTime:null, peakHeight:jumpSpeed**2/(2*gravity),reason:'HEIGHT_UNREACHABLE'};
  const descendingTime=(jumpSpeed+Math.sqrt(Math.max(0,discriminant)))/gravity;
  return {reachable:true,maxDistance:runSpeed*descendingTime,landingTime:descendingTime,peakHeight:jumpSpeed**2/(2*gravity),reason:null};
}
export function checkJump(spec) {
  const dx=finiteNumber(spec.deltaX,'deltaX');
  const tolerance=spec.tolerance ?? 0;
  if (!(Number.isFinite(tolerance)&&tolerance>=0)) throw new RangeError('tolerance must be nonnegative');
  const envelope=jumpEnvelope(spec);
  if (!envelope.reachable) return {...envelope,possible:false,margin:-Infinity};
  const margin=envelope.maxDistance - Math.max(0,Math.abs(dx)-tolerance);
  return {...envelope,possible:margin>=-1e-9, margin};
}
export function checkAabbClearance(bounds, agent) {
  const dim=['x','y','z'];
  const failures=[];
  for(const axis of dim) {
    if (!bounds.min || !bounds.max || !Number.isFinite(bounds.min[axis]) || !Number.isFinite(bounds.max[axis]) || bounds.max[axis]<bounds.min[axis]) throw new RangeError(`invalid ${axis} bounds`);
    if (!Number.isFinite(agent[axis]) || agent[axis]<=0) throw new RangeError(`invalid ${axis} agent size`);
    if (bounds.max[axis]-bounds.min[axis]+1e-9 < agent[axis]) failures.push(axis);
  }
  return {fits:failures.length===0,insufficientAxes:failures};
}
export function validatePlatforms(platforms, agent) {
  if(!Array.isArray(platforms)) throw new TypeError('platforms array required');
  const issues=[]; const ids=new Set();
  for (const p of platforms) {
    if (!p || typeof p.id!=='string' || !p.id.trim()) {issues.push({code:'INVALID_PLATFORM_ID',id:null});continue;}
    if(ids.has(p.id)) issues.push({code:'DUPLICATE_PLATFORM',id:p.id}); ids.add(p.id);
    for(const f of ['x','y','width']) if(!Number.isFinite(p[f]) || (f==='width'&&p[f]<=0)) issues.push({code:'INVALID_PLATFORM_GEOMETRY',id:p.id,field:f});
  }
  const links=[];
  for(const from of platforms) for (const to of platforms) {
    if(!from?.id || !to?.id || from.id===to.id || ![from.x,from.y,from.width,to.x,to.y,to.width].every(Number.isFinite)) continue;
    // Rightward gap from the right ledge to the left ledge; standing-overlap requires no jump.
    const dx=Math.max(0,to.x-(from.x+from.width));
    if(to.x < from.x) continue;
    const result=checkJump({...agent,deltaX:dx,deltaY:to.y-from.y});
    links.push({from:from.id,to:to.id,deltaX:dx,deltaY:to.y-from.y,possible:result.possible,margin:Number.isFinite(result.margin)?result.margin:null});
  }
  return {issues,links};
}
/** Optional authoritative simulation adapter: caller's physics engine advances the character. */
export function sampleTraversal({initialState,controls,advance,isGoal,maxSteps=300,dt=1/60}) {
  if (typeof advance!=='function'||typeof isGoal!=='function') throw new TypeError('advance and isGoal callbacks required');
  if(!Number.isSafeInteger(maxSteps)||maxSteps<1 || !Number.isFinite(dt)||dt<=0) throw new RangeError('invalid simulation settings');
  let state=structuredClone(initialState);
  if(isGoal(state)) return {status:'reachable',steps:0,state};
  for(let i=0;i<maxSteps;i++) {
    state=advance(state,controls,dt,i);
    if(state==null) throw new TypeError('advance returned no state');
    if(isGoal(state)) return {status:'reachable',steps:i+1,state};
  }
  return {status:'inconclusive',steps:maxSteps,state}; // NOT proof of impossibility
}
/** Minimal Canvas2D blockout overlay; caller owns Canvas and camera transform. */
export function drawCanvasPlatforms(ctx, platforms, {color='#7dd3fc',showIds=true}={}) {
  if(!ctx || typeof ctx.fillRect!=='function') throw new TypeError('CanvasRenderingContext2D required');
  ctx.save(); try {
    ctx.fillStyle=color;
    for(const p of platforms) {ctx.fillRect(p.x,p.y,p.width,p.height??8); if(showIds && typeof ctx.fillText==='function')ctx.fillText(p.id,p.x,p.y-6);}
  } finally {ctx.restore();}
}
/** Optional Three.js injected adapter, no renderer/scene created. Object ownership returned to caller. */
export function addThreeBlockout({THREE,scene,boxes,material}) {
  if(!THREE?.BoxGeometry || !THREE?.Mesh || !scene?.add) throw new TypeError('Inject existing THREE and scene');
  const made=[];
  for(const b of boxes){
    if(!['x','y','z','width','height','depth'].every(k=>Number.isFinite(b[k]))||[b.width,b.height,b.depth].some(v=>v<=0))throw new RangeError('invalid 3D blockout box');
    const geometry=new THREE.BoxGeometry(b.width,b.height,b.depth);
    const mesh=new THREE.Mesh(geometry,material);
    mesh.position.set(b.x,b.y,b.z); mesh.userData.levelBlockoutId=b.id;
    scene.add(mesh); made.push({mesh,geometry});
  }
  return {meshes:made.map(o=>o.mesh),dispose(){for(const {mesh,geometry} of made){scene.remove(mesh);geometry.dispose();}}};
}
