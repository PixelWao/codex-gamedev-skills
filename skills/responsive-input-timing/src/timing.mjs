// MIT (c) 2026 Waldemar Soroka. Pure input timing; caller owns physics.
const check=(n,name)=>{if(!Number.isFinite(n)||n<0)throw new RangeError(`${name} must be finite and nonnegative`);return n;};
export class JumpAssist {
  constructor({bufferMs=120,coyoteMs=100}={}){
    this.bufferMs=check(bufferMs,'bufferMs');this.coyoteMs=check(coyoteMs,'coyoteMs');
    this.lastTime=-Infinity;this.onGround=false;this.lastGrounded=-Infinity;
    this.pending=null;this.usedIds=new Set();this.armed=true;this.wasAirborne=true;this.jumpHeld=false;
  }
  _time(time){check(time,'time');if(time<this.lastTime)throw new RangeError('non-monotonic input timestamp');this.lastTime=time;return time;}
  setGrounded(time,grounded){this._time(time);if(typeof grounded!=='boolean')throw new TypeError('boolean grounded required');
    if(grounded){if(!this.onGround)this.armed=true;this.lastGrounded=time;this.wasAirborne=false;}
    else if(this.onGround){this.lastGrounded=time;this.wasAirborne=true;}
    this.onGround=grounded;
  }
  press(time,id){this._time(time);if(typeof id!=='string'||!id)throw new TypeError('unique input id required');
    if(this.usedIds.has(id))return false;this.usedIds.add(id);this.pending={id,at:time};this.jumpHeld=true;return true;
  }
  release(time){this._time(time);const wasHeld=this.jumpHeld;this.jumpHeld=false;return wasHeld;}
  tryConsume(time){this._time(time);
    const p=this.pending;if(!p)return null;
    if(time-p.at>this.bufferMs){this.pending=null;return null;}
    const canJump=this.armed&&(this.onGround || (this.lastGrounded!==-Infinity && time-this.lastGrounded<=this.coyoteMs));
    if(!canJump)return null;
    this.armed=false;this.pending=null;return {type:'jump',inputId:p.id,at:time,latencyMs:time-p.at,grounded:this.onGround};
  }
  cancel(time){this._time(time);this.pending=null;this.jumpHeld=false;}
  snapshot(){return {grounded:this.onGround,armed:this.armed,pending:this.pending?{...this.pending}:null,held:this.jumpHeld};}
}
export class InputTimeline {
  constructor(){this.events=[];this.last=-Infinity;this.ids=new Set();}
  record(evt){if(!evt||typeof evt.type!=='string'||!Number.isFinite(evt.time)||evt.time<0)throw new TypeError('invalid event');
    if(evt.time<this.last)throw new RangeError('events out of order');
    if(evt.id!==undefined){if(typeof evt.id!=='string'||!evt.id)throw new TypeError('invalid ID');if(this.ids.has(evt.id))throw new Error('duplicate event id');this.ids.add(evt.id);}
    this.last=evt.time;this.events.push(JSON.parse(JSON.stringify(evt)));
  }
  replay(handler){if(typeof handler!=='function')throw new TypeError('handler required');for(const e of this.events)handler({...e});}
  toJSONL(){return this.events.map(e=>JSON.stringify(e)).join('\n')+(this.events.length?'\n':'');}
  static fromJSONL(text){const timeline=new InputTimeline();for(const line of text.split(/\r?\n/))if(line.trim())timeline.record(JSON.parse(line));return timeline;}
}
/** Keep the IO event queue separate from physics. Drain edges ONCE per physics tick. */
export class FixedStepEdgeQueue {
  constructor(){this.items=[];this.last=-Infinity;this.seen=new Set();}
  capture(e){if(!Number.isFinite(e?.time)||e.time<0||e.time<this.last)throw new RangeError('invalid capture time');
    if(typeof e?.action!=='string'||!e.action||!['pressed','released'].includes(e.type))throw new TypeError('invalid edge');
    this.last=e.time;this.items.push({...e});
  }
  drainThrough(time){check(time,'tick time');const ready=[],rest=[];
    for(const e of this.items){(e.time<=time?ready:rest).push(e);}
    this.items=rest;return ready;
  }
  cancel(){this.items=[];}
}
