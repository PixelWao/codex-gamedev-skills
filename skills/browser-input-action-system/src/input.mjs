// MIT (c) 2026 Waldemar Soroka. Actions are independent of renderers/physics.
const finite = n => Number.isFinite(n);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export function radialDeadzone(x, y, deadzone = 0.2, sensitivity = 1) {
  if (![x, y, deadzone, sensitivity].every(finite) || deadzone < 0 || deadzone >= 1 || sensitivity <= 0)
    throw new RangeError('finite x/y, 0 <= deadzone < 1, sensitivity > 0 required');
  const mag = Math.hypot(x, y);
  if (mag <= deadzone || mag === 0) return {x:0, y:0};
  const scaled = Math.pow(clamp((Math.min(1, mag) - deadzone) / (1 - deadzone), 0, 1), sensitivity);
  return {x:(x / mag) * scaled, y:(y / mag) * scaled};
}
export function axisDeadzone(value, deadzone=0.1, sensitivity=1) {
  if (![value, deadzone, sensitivity].every(finite) || deadzone < 0 || deadzone >= 1 || sensitivity <= 0)
    throw new RangeError('invalid axis calibration');
  const mag=Math.abs(clamp(value,-1,1));
  return mag <= deadzone ? 0 : Math.sign(value)*Math.pow((mag-deadzone)/(1-deadzone),sensitivity);
}
const BINDING_TYPES = new Set(['key','mouse','gamepad-button','gamepad-axis','touch-button','touch-axis']);
function checkBinding(b) {
  if (!b || typeof b !== 'object' || !BINDING_TYPES.has(b.type)) throw new TypeError('unsupported binding');
  if (!['gameplay','menu','global'].includes(b.context)) throw new TypeError('context required');
  if (typeof b.action !== 'string' || !b.action.trim()) throw new TypeError('action required');
  if (['key'].includes(b.type) && (typeof b.code !== 'string' || !b.code)) throw new TypeError('key.code required');
  if (['mouse','gamepad-button','gamepad-axis'].includes(b.type) && (!Number.isInteger(b.button ?? b.axis) || (b.button ?? b.axis) < 0)) throw new TypeError('button/axis index required');
  if (b.type.startsWith('touch-') && (typeof b.zone !== 'string' || !b.zone)) throw new TypeError('touch zone required');
  if (b.type==='touch-axis' && !['x','y'].includes(b.axis)) throw new TypeError('touch-axis axis must be x/y');
  if (b.type==='gamepad-axis' && !['positive','negative','both'].includes(b.direction ?? 'both')) throw new TypeError('invalid gamepad axis direction');
  if (b.scale !== undefined && (!finite(b.scale) || Math.abs(b.scale)>1)) throw new RangeError('invalid scale');
  return {...b};
}
function signature(b) {
  const id = b.type==='key' ? b.code : b.type==='mouse' ? b.button : b.type==='gamepad-button' ? b.button : b.type==='gamepad-axis' ? `${b.axis}/${b.direction??'both'}` : b.type==='touch-axis' ? `${b.zone}/${b.axis}` : b.zone;
  return `${b.context}:${b.type}:${id}`;
}
export function validateBindings(bindings) {
  if (!Array.isArray(bindings)) throw new TypeError('bindings must be an array');
  const out=bindings.map(checkBinding);
  for(let i=0;i<out.length;i++)for(let j=0;j<i;j++) {
    const a=out[i], b=out[j];
    if(a.action===b.action || (a.context!==b.context && a.context!=='global' && b.context!=='global'))continue;
    if(a.type!==b.type)continue;
    let overlaps=false;
    if(a.type==='key')overlaps=a.code===b.code;
    if(a.type==='mouse'||a.type==='gamepad-button')overlaps=a.button===b.button;
    if(a.type==='gamepad-axis')overlaps=a.axis===b.axis && ((a.direction??'both')==='both'||(b.direction??'both')==='both'||a.direction===b.direction);
    if(a.type==='touch-button')overlaps=a.zone===b.zone;
    if(a.type==='touch-axis')overlaps=a.zone===b.zone&&a.axis===b.axis;
    if(overlaps)throw new Error(`binding conflict: ${signature(a)} (${a.action}/${b.action})`);
  }
  return out;
}

function editableTarget(target) {
  return Boolean(target?.isContentEditable || ['INPUT','TEXTAREA','SELECT'].includes(String(target?.tagName ?? '').toUpperCase()));
}
export class InputActions {
  constructor(bindings, {context='gameplay', deviceQuietMs=250, toggleActions=[], clock=()=>performance.now()}={}) {
    if (!['gameplay','menu'].includes(context)) throw new RangeError('unknown context');
    this.defaults=validateBindings(bindings);this.bindings=this.defaults.map(b=>({...b}));
    this.context=context;this.clock=clock;this.deviceQuietMs=deviceQuietMs;
    this.physical=new Map();this.touch=new Map();this.states=new Map();this.rawStates=new Map();this.toggleStates=new Map();this.toggleActions=new Set(toggleActions);this.edges=[];
    this.activeDevice=null;this.activeDeviceAt=-Infinity;this._dispose=[];
  }
  _time(time) {const t=time??this.clock();if(!finite(t)||t<0)throw new RangeError('invalid timestamp');return t;}
  _device(name,time,magnitude=1){if(magnitude<0.12)return; if(this.activeDevice!==name && time-this.activeDeviceAt<this.deviceQuietMs)return;this.activeDevice=name;this.activeDeviceAt=time;}
  _set(token,value,time,device){const t=this._time(time);if(!finite(value))throw new RangeError('invalid input value');
    if(Math.abs(value)<1e-8)this.physical.delete(token);else this.physical.set(token,clamp(value,-1,1));
    if(device)this._device(device,t,Math.abs(value));this._recompute(t);
  }
  key(code,down,time,{repeat=false,editable=false,composing=false}={}){
    if(editable || composing)return false;
    if(repeat && down)return false;
    this._set(`key:${code}`,down?1:0,time,'keyboard');return true;
  }
  mouse(button,down,time){this._set(`mouse:${button}`,down?1:0,time,'mouse');}
  touchDown(pointerId,zone,x,y,time,{stickRadius=64}={}) {
    if(this.touch.has(pointerId))return false;
    if(!finite(x)||!finite(y)||!finite(stickRadius)||stickRadius<=0)throw new RangeError('invalid touch');
    this.touch.set(pointerId,{zone,x,y,radius:stickRadius});this._set(`touch:${pointerId}:${zone}:button`,1,time,'touch');return true;
  }
  touchMove(pointerId,x,y,time){const p=this.touch.get(pointerId);if(!p)return false;
    if(!finite(x)||!finite(y))throw new RangeError('invalid touch move');
    const d=radialDeadzone((x-p.x)/p.radius,(y-p.y)/p.radius,0.12);
    this._set(`touch:${pointerId}:${p.zone}:x`,d.x,time,'touch');
    this._set(`touch:${pointerId}:${p.zone}:y`,d.y,time,'touch');return true;
  }
  touchUp(pointerId,time){const p=this.touch.get(pointerId);if(!p)return false;
    this.touch.delete(pointerId);
    for(const suffix of ['button','x','y'])this._set(`touch:${pointerId}:${p.zone}:${suffix}`,0,time,null);
    return true;
  }
  pollGamepads(pads,time) {
    const t=this._time(time), fresh=new Set();
    for(const gp of pads ?? []) {if(!gp || gp.connected===false)continue;
      const idx=gp.index;if(!Number.isInteger(idx) || idx<0)continue;
      (gp.buttons??[]).forEach((v,i)=>{const val=typeof v==='number'?v:(v?.value??(v?.pressed?1:0));const token=`pad:${idx}:button:${i}`;fresh.add(token);this._set(token,clamp(val,0,1),t,'gamepad');});
      (gp.axes??[]).forEach((v,i)=>{const token=`pad:${idx}:axis:${i}`;fresh.add(token);this._set(token,clamp(v,-1,1),t,'gamepad');});
    }
    for(const token of [...this.physical.keys()])if(token.startsWith('pad:') && !fresh.has(token))this._set(token,0,t,null);
  }
  _value(b){
    const values=[];
    if(b.type==='key')values.push(this.physical.get(`key:${b.code}`)??0);
    if(b.type==='mouse')values.push(this.physical.get(`mouse:${b.button}`)??0);
    if(b.type==='gamepad-button')for(const [k,v] of this.physical)if(new RegExp(`^pad:\\d+:button:${b.button}$`).test(k))values.push(v);
    if(b.type==='gamepad-axis')for(const [k,v] of this.physical)if(new RegExp(`^pad:\\d+:axis:${b.axis}$`).test(k)){
      const n=axisDeadzone(v,b.deadzone??0.15,b.sensitivity??1);
      values.push(b.direction==='positive'?Math.max(0,n):b.direction==='negative'?Math.max(0,-n):n);
    }
    if(b.type.startsWith('touch-'))for(const [id,p] of this.touch){if(p.zone!==b.zone)continue;
      values.push(this.physical.get(`touch:${id}:${b.zone}:${b.type==='touch-button'?'button':b.axis}`)??0);
    }
    let value=0;for(const v of values)if(Math.abs(v)>Math.abs(value))value=v;
    return value*(b.scale??1);
  }
  _recompute(time){const next=new Map();for(const b of this.bindings){if(b.context!==this.context && b.context!=='global')continue;
    const v=this._value(b);const old=next.get(b.action)??0;next.set(b.action,clamp(old+v,-1,1));}
    const all=new Set([...next.keys(),...this.states.keys()]);
    const logical=new Map();
    for(const action of all){let current=next.get(action)??0;
      if(this.toggleActions.has(action)){
        const rawPrev=this.rawStates.get(action)??0;
        if(Math.abs(current)>1e-8 && Math.abs(rawPrev)<=1e-8)this.toggleStates.set(action,!this.toggleStates.get(action));
        current=this.toggleStates.get(action)?1:0;
      }
      logical.set(action,current);
      const previous=this.states.get(action)??0;
      if(Math.abs(previous)<=1e-8 && Math.abs(current)>1e-8)this.edges.push({type:'pressed',action,time,value:current});
      if(Math.abs(previous)>1e-8 && Math.abs(current)<=1e-8)this.edges.push({type:'released',action,time,value:0});
    }
    this.rawStates=next;this.states=logical;
  }
  get(action){const value=this.states.get(action)??0;return {held:Math.abs(value)>1e-8,value};}
  drain(){const data=this.edges;this.edges=[];return data;}
  setContext(context,time){if(!['gameplay','menu'].includes(context))throw new RangeError('bad context');this.releaseAll(time);this.context=context;}
  releaseAll(time){this._time(time);this.physical.clear();this.touch.clear();this.states.clear();this.rawStates.clear();this.toggleStates.clear();this.edges=[];}
  setToggleActions(actions,time){if(!Array.isArray(actions)||actions.some(x=>typeof x!=='string'||!x))throw new TypeError('action names required');this.toggleActions=new Set(actions);this.releaseAll(time);}
  resetBindings(time){this.bindings=this.defaults.map(b=>({...b}));this.releaseAll(time);}
  rebind(action,newBinding,time,{replaceIndex=0}={}){
    if(typeof action!=='string')throw new TypeError('action required');
    const b=checkBinding({...newBinding,action});const slots=this.bindings.map((v,i)=>v.action===action&&v.context===b.context?i:-1).filter(i=>i>=0);
    if(slots.length===0||!Number.isInteger(replaceIndex)||replaceIndex<0||replaceIndex>=slots.length)throw new Error('existing action/context/slot required');
    const newBindings=this.bindings.map(v=>({...v}));newBindings[slots[replaceIndex]]=b;
    validateBindings(newBindings);
    // Existing menu actions remain accessible through at least one binding.
    if(!newBindings.some(v=>v.context==='menu'&&v.action==='back'))throw new Error('menu back must stay mapped');
    this.bindings=newBindings;this.releaseAll(time);return true;
  }
  exportProfile(){return JSON.stringify({schema:1,bindings:this.bindings});}
  importProfile(raw,time){const obj=typeof raw==='string'?JSON.parse(raw):raw;
    if(obj?.schema!==1)throw new Error('unsupported profile schema');
    const incoming=validateBindings(obj.bindings);
    if(!incoming.some(v=>v.context==='menu'&&v.action==='back'))throw new Error('menu back required');
    this.bindings=incoming;this.releaseAll(time);
  }
  attachBrowser({window:win,document:doc,element}={}){
    if(!win||!doc||!element)throw new TypeError('window,document,element required');
    const on=(obj,type,fn,opt)=>{obj.addEventListener(type,fn,opt);this._dispose.push(()=>obj.removeEventListener(type,fn,opt));};
    const keys=(e,down)=>{if(down&&(editableTarget(e.target)||e.isComposing))return;
      if(this.key(e.code,down,undefined,{repeat:e.repeat,composing:e.isComposing})){
        if(this.bindings.some(b=>b.type==='key'&&b.code===e.code&&(b.context===this.context||b.context==='global')))e.preventDefault?.();
      }};
    on(win,'keydown',e=>keys(e,true));on(win,'keyup',e=>keys(e,false));
    on(win,'blur',()=>this.releaseAll());on(doc,'visibilitychange',()=>{if(doc.hidden)this.releaseAll();});
    on(element,'pointerdown',e=>{if(e.pointerType==='touch'){
      const zone=e.target?.dataset?.inputZone;if(zone){this.touchDown(e.pointerId,zone,e.clientX,e.clientY);element.setPointerCapture?.(e.pointerId);e.preventDefault?.();}}
      else if(e.pointerType==='mouse')this.mouse(e.button,true);
    });
    on(element,'pointermove',e=>{if(e.pointerType==='touch')this.touchMove(e.pointerId,e.clientX,e.clientY);});
    on(element,'pointerup',e=>{if(e.pointerType==='touch')this.touchUp(e.pointerId);else if(e.pointerType==='mouse')this.mouse(e.button,false);});
    on(element,'pointercancel',e=>this.touchUp(e.pointerId));on(element,'lostpointercapture',e=>this.touchUp(e.pointerId));
    on(win,'pointerup',e=>{if(e.pointerType==='mouse')this.mouse(e.button,false);});
    return ()=>this.dispose();
  }
  dispose(){this.releaseAll();for(const fn of this._dispose.splice(0))fn();}
}
