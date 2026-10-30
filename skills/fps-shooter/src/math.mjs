// MIT © 2026 Waldemar Soroka. Pure deterministic combat math.
export function requireFinite(value, label) {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite`);
  return value;
}
export function requirePositive(value, label) {
  requireFinite(value, label);
  if (value <= 0) throw new RangeError(`${label} must be > 0`);
  return value;
}
export function clamp(value, lo, hi) { return Math.max(lo, Math.min(hi, value)); }
export function add(a,b) { return {x:a.x+b.x,y:a.y+b.y,z:a.z+b.z}; }
export function sub(a,b) { return {x:a.x-b.x,y:a.y-b.y,z:a.z-b.z}; }
export function scale(a,s) { return {x:a.x*s,y:a.y*s,z:a.z*s}; }
export function dot(a,b) { return a.x*b.x+a.y*b.y+a.z*b.z; }
export function cross(a,b) { return {x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x}; }
export function length(v) { return Math.hypot(v.x,v.y,v.z); }
export function unit(v) {
  if (![v?.x,v?.y,v?.z].every(Number.isFinite)) throw new RangeError('vector must be finite');
  const n = length(v); if (n <= 1e-12) throw new RangeError('zero-length direction');
  return scale(v,1/n);
}
export function distance(a,b) { return length(sub(a,b)); }
export function seededRng(seed=1) {
  let state=(requireFinite(seed,'seed') >>> 0);
  return () => { state += 0x6D2B79F5; let t=state; t=Math.imul(t ^ t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296; };
}
// Uniform per unit solid angle within a cone (not independent yaw/pitch).
export function sampleCone(axis, halfAngleRad, random=Math.random) {
  const w=unit(axis); requireFinite(halfAngleRad,'halfAngleRad');
  if (halfAngleRad<0 || halfAngleRad>=Math.PI/2) throw new RangeError('cone half-angle in [0, π/2)');
  if (halfAngleRad===0) return w;
  const u=random(), v=random();
  if (![u,v].every(n=>Number.isFinite(n)&&n>=0&&n<1)) throw new RangeError('rng outputs must lie in [0,1)');
  const c=1-u*(1-Math.cos(halfAngleRad)), s=Math.sqrt(Math.max(0,1-c*c)), phi=2*Math.PI*v;
  const ref=Math.abs(w.z)<.9? {x:0,y:0,z:1}:{x:0,y:1,z:0};
  const tangent=unit(cross(ref,w)), bitangent=cross(w,tangent);
  return unit(add(scale(w,c),add(scale(tangent,s*Math.cos(phi)),scale(bitangent,s*Math.sin(phi)))));
}
export function damageFalloff(distanceMeters, near, far, minimum=0.4) {
  requireFinite(distanceMeters,'distanceMeters'); if(distanceMeters<0)throw new RangeError('distance must be >=0');
  requireFinite(near,'near');requireFinite(far,'far');
  if(near<0||far<=near||minimum<0||minimum>1||!Number.isFinite(minimum))throw new RangeError('invalid falloff');
  return distanceMeters<=near?1:distanceMeters>=far?minimum:1-(1-minimum)*(distanceMeters-near)/(far-near);
}
export function idealTtk({hp,damage,roundsPerSecond}) {
  requirePositive(hp,'hp'); requirePositive(damage,'damage'); requirePositive(roundsPerSecond,'roundsPerSecond');
  const shots=Math.ceil(hp/damage);
  return {shots,seconds:(shots-1)/roundsPerSecond}; // Perfect hits, first shot at t=0; no reload/armor/travel.
}
