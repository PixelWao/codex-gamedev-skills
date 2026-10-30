/** Camera world-coordinates: +x right,+y down. Browser Canvas-independent. MIT (c) 2026 Waldemar Soroka. */
const finite=(n,label)=>{if(!Number.isFinite(n))throw new TypeError(`${label} must be finite`);return n};
const smooth=(rate,dt)=>1-Math.exp(-rate*dt);
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const cp=p=>({x:p.x,y:p.y});
const axis=(p,delta,half)=>p+Math.sign(delta)*Math.max(0,Math.abs(delta)-half);
export function interpolateTarget(previous,current,alpha){
  if(!(alpha>=0&&alpha<=1))throw new RangeError('alpha must be in [0,1]');
  for (const [i,p] of [previous,current].entries()) for(const k of ['x','y']) finite(p[k],`target${i}.${k}`);
  return {x:previous.x+(current.x-previous.x)*alpha,y:previous.y+(current.y-previous.y)*alpha};
}
export class Camera2D {
  constructor({viewport={width:800,height:600},zoom=1,bounds=null,deadzone={x:40,y:24},lookAhead=80,followRate=9,leadRate=6,pixelSnap=false}={}) {
    this.center={x:0,y:0}; this.focus={x:0,y:0}; this.lead={x:0,y:0}; this.shake={x:0,y:0};
    this.deadzone={...deadzone};this.lookAhead=lookAhead;this.followRate=followRate;this.leadRate=leadRate;this.pixelSnap=Boolean(pixelSnap);
    this.setViewport(viewport.width,viewport.height); this.setZoom(zoom);this.setBounds(bounds);
    for(const [k,v] of Object.entries({lookAhead,followRate,leadRate,deadzoneX:deadzone.x,deadzoneY:deadzone.y})) if(!Number.isFinite(v)||v<0)throw new RangeError(`${k} must be nonnegative and finite`);
  }
  setViewport(width,height){if(!(Number.isFinite(width)&&Number.isFinite(height)&&width>0&&height>0))throw new RangeError('invalid viewport');this.viewport={width,height};return this}
  setZoom(zoom){if(!Number.isFinite(zoom)||zoom<=0)throw new RangeError('zoom must be positive');this.zoom=zoom;return this}
  setBounds(bounds){if(bounds!==null){for(const k of ['minX','minY','maxX','maxY'])finite(bounds[k],`bounds.${k}`);if(bounds.maxX<bounds.minX||bounds.maxY<bounds.minY)throw new RangeError('invalid bounds');}this.bounds=bounds?{...bounds}:null;return this}
  clampView(p){if(!this.bounds)return cp(p);const b=this.bounds;const hx=this.viewport.width/(2*this.zoom),hy=this.viewport.height/(2*this.zoom);
    return {x:b.maxX-b.minX<=2*hx?(b.minX+b.maxX)/2:clamp(p.x,b.minX+hx,b.maxX-hx),y:b.maxY-b.minY<=2*hy?(b.minY+b.maxY)/2:clamp(p.y,b.minY+hy,b.maxY-hy)};
  }
  reset(target){finite(target.x,'x');finite(target.y,'y');this.focus=cp(target);this.lead={x:0,y:0};this.center=this.clampView(target);this.shake={x:0,y:0};return this}
  setShake(offset={x:0,y:0}){finite(offset.x,'shake.x');finite(offset.y,'shake.y');this.shake=cp(offset);return this}
  update(target,velocity={x:0,y:0},dt=1/60){
    for(const k of ['x','y']){finite(target[k],`target.${k}`);finite(velocity[k],`velocity.${k}`)}
    if(!Number.isFinite(dt)||dt<0)throw new RangeError('invalid dt');if(dt===0)return this.renderCenter();
    this.focus.x=axis(this.focus.x,target.x-this.focus.x,this.deadzone.x);this.focus.y=axis(this.focus.y,target.y-this.focus.y,this.deadzone.y);
    const len=Math.hypot(velocity.x,velocity.y);const aim=len>1e-9?{x:velocity.x/len*this.lookAhead,y:velocity.y/len*this.lookAhead}:{x:0,y:0};
    const leadT=smooth(this.leadRate,dt);this.lead.x+=(aim.x-this.lead.x)*leadT;this.lead.y+=(aim.y-this.lead.y)*leadT;
    const desired={x:this.focus.x+this.lead.x,y:this.focus.y+this.lead.y};const t=smooth(this.followRate,dt);
    this.center=this.clampView({x:this.center.x+(desired.x-this.center.x)*t,y:this.center.y+(desired.y-this.center.y)*t});return this.renderCenter();
  }
  renderCenter(){// Shake is a visual offset; apply before final clamp to prevent peeking beyond bounds.
    let p=this.clampView({x:this.center.x+this.shake.x,y:this.center.y+this.shake.y});
    if(this.pixelSnap){p={x:Math.round(p.x*this.zoom)/this.zoom,y:Math.round(p.y*this.zoom)/this.zoom};p=this.clampView(p)}
    return p;
  }
  worldToScreen(p){const c=this.renderCenter();return{x:(p.x-c.x)*this.zoom+this.viewport.width/2,y:(p.y-c.y)*this.zoom+this.viewport.height/2}}
  screenToWorld(p){const c=this.renderCenter();return{x:(p.x-this.viewport.width/2)/this.zoom+c.x,y:(p.y-this.viewport.height/2)/this.zoom+c.y}}
  /** Apply to CanvasRenderingContext2D after ctx.setTransform(1,0,0,1,0,0) and clearRect. */
  applyCanvasTransform(ctx){const c=this.renderCenter();ctx.setTransform(this.zoom,0,0,this.zoom,this.viewport.width/2-c.x*this.zoom,this.viewport.height/2-c.y*this.zoom)}
}
