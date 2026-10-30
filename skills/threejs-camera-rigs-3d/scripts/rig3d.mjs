/** Renderer-neutral camera rig math. MIT (c) 2026 Waldemar Soroka. */
const isNum=(x)=>Number.isFinite(x);const valid=v=>v&&['x','y','z'].every(k=>isNum(v[k]));
const copy=v=>({x:v.x,y:v.y,z:v.z});const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});const scale=(a,s)=>({x:a.x*s,y:a.y*s,z:a.z*s});
const length=a=>Math.hypot(a.x,a.y,a.z);const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));const alpha=(r,dt)=>1-Math.exp(-r*dt);
export function lerpVec3(a,b,t){if(!valid(a)||!valid(b)||!isNum(t))throw new TypeError('invalid vectors/t');return add(a,scale(sub(b,a),t))}
export function groupFraming(targets,{verticalFovDegrees=50,aspect=16/9,padding=1.15,minDistance=0.5}={}){
  if(!Array.isArray(targets)||targets.length===0)throw new RangeError('targets cannot be empty');
  if(![verticalFovDegrees,aspect,padding,minDistance].every(Number.isFinite)||!(verticalFovDegrees>0&&verticalFovDegrees<179&&aspect>0&&padding>=1&&minDistance>0))throw new RangeError('bad framing config');
  const lo={x:Infinity,y:Infinity,z:Infinity},hi={x:-Infinity,y:-Infinity,z:-Infinity};
  for(const p of targets){if(!valid(p))throw new TypeError('invalid target');for(const axis of ['x','y','z']){lo[axis]=Math.min(lo[axis],p[axis]);hi[axis]=Math.max(hi[axis],p[axis])}}
  const center=scale(add(lo,hi),.5),ext=scale(sub(hi,lo),.5);
  const halfV=verticalFovDegrees*Math.PI/360;const halfH=Math.atan(Math.tan(halfV)*aspect);
  // Depth extents along view axis require additional clearance, approximation for default world-aligned view.
  const distance=Math.max(minDistance,padding*Math.max(ext.y/Math.tan(halfV),ext.x/Math.tan(halfH))+ext.z*padding);
  return {center,distance,extents:ext};
}
export class OrbitCameraRig {
  constructor({target={x:0,y:0,z:0},yaw=0,pitch=.35,idealDistance=7,minDistance=.5,maxDistance=25,
    pitchMin=-1.35,pitchMax=1.35,focusRate=12,releaseRate=5,collisionMargin=.18,bounds=null}={}){
    if(!valid(target))throw new TypeError('invalid target');
    for(const [k,v] of Object.entries({yaw,pitch,idealDistance,minDistance,maxDistance,pitchMin,pitchMax,focusRate,releaseRate,collisionMargin}))if(!isNum(v))throw new TypeError(`${k} not finite`);
    if(!(minDistance>0&&maxDistance>=minDistance&&idealDistance>=minDistance&&idealDistance<=maxDistance&&pitchMin<=pitchMax&&focusRate>=0&&releaseRate>=0&&collisionMargin>=0))throw new RangeError('invalid rig options');
    this.target=copy(target);this.focus=copy(target);this.yaw=yaw;this.pitch=clamp(pitch,pitchMin,pitchMax);this.idealDistance=idealDistance;this.distance=idealDistance;
    Object.assign(this,{minDistance,maxDistance,pitchMin,pitchMax,focusRate,releaseRate,collisionMargin,bounds});
  }
  setAngles(yaw,pitch){if(!isNum(yaw)||!isNum(pitch))throw new RangeError('invalid angle');this.yaw=yaw;this.pitch=clamp(pitch,this.pitchMin,this.pitchMax);return this}
  setTarget(target,{cut=false}={}){if(!valid(target))throw new TypeError('invalid target');this.target=copy(target);if(cut){this.focus=this.clampTarget(target);this.distance=this.idealDistance}return this}
  setDistance(distance){if(!isNum(distance))throw new TypeError('invalid distance');this.idealDistance=clamp(distance,this.minDistance,this.maxDistance);return this}
  clampTarget(p){if(!this.bounds)return copy(p);const out=copy(p);for(const k of ['x','y','z']){const lo=this.bounds[`min${k.toUpperCase()}`],hi=this.bounds[`max${k.toUpperCase()}`];if(lo!==undefined||hi!==undefined){if(!isNum(lo)||!isNum(hi)||lo>hi)throw new RangeError('invalid bounds');out[k]=clamp(p[k],lo,hi)}}return out}
  getDirection(){const c=Math.cos(this.pitch);return {x:Math.sin(this.yaw)*c,y:Math.sin(this.pitch),z:Math.cos(this.yaw)*c}}
  update(dt,{collisionQuery=null}={}){
    if(!isNum(dt)||dt<0)throw new RangeError('dt must be >= 0');
    const desired=this.clampTarget(this.target);this.focus=lerpVec3(this.focus,desired,alpha(this.focusRate,dt));
    const direction=this.getDirection();let requested=this.idealDistance;
    if(collisionQuery){const result=collisionQuery({origin:copy(this.focus),direction:copy(direction),maxDistance:requested,excludePlayer:true});
      if(result!==null&&result!==undefined){const hit=typeof result==='number'?result:result.distance;if(!isNum(hit)||hit<0)throw new TypeError('invalid collision distance');requested=clamp(hit-this.collisionMargin,this.minDistance,this.idealDistance)}}
    if(requested<this.distance)this.distance=requested;else this.distance+= (requested-this.distance)*alpha(this.releaseRate,dt);
    return this.pose();
  }
  pose(){return{position:add(this.focus,scale(this.getDirection(),this.distance)),lookAt:copy(this.focus),distance:this.distance,yaw:this.yaw,pitch:this.pitch}}
}
/** Adapter: caller passes its existing Three camera; no new renderer / loop / physics world. */
export function applyPoseToThreeCamera(camera,pose){camera.position.set(pose.position.x,pose.position.y,pose.position.z);camera.lookAt(pose.lookAt.x,pose.lookAt.y,pose.lookAt.z)}
/** Perspective or orthographic camera: updating field-of-view or viewport must refresh projection. */
export function resizeThreeCamera(camera,width,height){if(!(Number.isFinite(width)&&Number.isFinite(height)&&width>0&&height>0))throw new RangeError('invalid viewport');if(camera.isPerspectiveCamera){camera.aspect=width/height;camera.updateProjectionMatrix()}else if(camera.isOrthographicCamera){const cy=(camera.top+camera.bottom)/2,h=(camera.top-camera.bottom)/2,cx=(camera.left+camera.right)/2;const w=h*width/height;camera.left=cx-w;camera.right=cx+w;camera.top=cy+h;camera.bottom=cy-h;camera.updateProjectionMatrix()}else throw new TypeError('camera must be perspective or orthographic')}
