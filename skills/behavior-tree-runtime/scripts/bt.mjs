/** Independent BT reference runtime. No engine dependencies; one stateful tree per agent. */
export const Status=Object.freeze({READY:'READY',RUNNING:'RUNNING',SUCCESS:'SUCCESS',FAILURE:'FAILURE'});
const done=s=>s===Status.SUCCESS||s===Status.FAILURE;
function check(ctx){if(!ctx||!(ctx.bb instanceof Map)||!Number.isFinite(ctx.time)||!Number.isFinite(ctx.dt)||ctx.dt<0)throw new TypeError('context needs Map bb, finite time and nonnegative finite dt');}
export class Node{
 constructor(name='node'){this.name=name;this.status=Status.READY;}
 tick(ctx){check(ctx);if(done(this.status))return this.status;let from=this.status;const s=this._tick(ctx);if(![Status.RUNNING,Status.SUCCESS,Status.FAILURE].includes(s))throw new TypeError('invalid status');this.status=s;if(ctx.trace&&from!==s)ctx.trace({kind:'transition',node:this.name,from,to:s,t:ctx.time});return s;}
 _tick(){throw new Error('abstract');} _abort(){} _resetTransient(){}
 abort(ctx){if(this.status===Status.RUNNING){this._abort(ctx);ctx?.trace?.({kind:'abort',node:this.name,t:ctx.time});}this._resetTransient();this.status=Status.READY;}
 reset(ctx){if(this.status===Status.RUNNING)this.abort(ctx);else{this._resetTransient();this.status=Status.READY;}}
}
export class Action extends Node{
 constructor(name,step,onAbort=()=>{}){super(name);if(typeof step!=='function'||typeof onAbort!=='function')throw new TypeError('action callbacks');this.step=step;this.onAbort=onAbort;}
 _tick(ctx){return this.step(ctx);} _abort(ctx){this.onAbort(ctx);}
}
export class Condition extends Node{constructor(name,predicate){super(name);this.predicate=predicate;} _tick(ctx){return this.predicate(ctx)?Status.SUCCESS:Status.FAILURE;}}
export class Wait extends Node{constructor(duration,name='wait'){super(name);if(!Number.isFinite(duration)||duration<0)throw new RangeError('duration');this.duration=duration;this.elapsed=0;} _tick(ctx){this.elapsed+=ctx.dt;return this.elapsed>=this.duration?Status.SUCCESS:Status.RUNNING;} _resetTransient(){this.elapsed=0;}}
class Composite extends Node{
 constructor(name,children){super(name);if(!Array.isArray(children)||new Set(children).size!==children.length||children.some(c=>!(c instanceof Node)))throw new TypeError('unique node children required');this.children=children;}
 _abort(ctx){for(const c of this.children)c.reset(ctx);}
 reset(ctx){super.reset(ctx);for(const c of this.children)c.reset(ctx);}
}
export class Sequence extends Composite{
 constructor(children,name='sequence'){super(name,children);this.index=0;}
 _tick(ctx){for(;this.index<this.children.length;this.index++){const s=this.children[this.index].tick(ctx);if(s!==Status.SUCCESS)return s;}return Status.SUCCESS;}
 _resetTransient(){this.index=0;}
}
export class Selector extends Composite{
 constructor(children,name='selector'){super(name,children);this.index=0;}
 _tick(ctx){for(;this.index<this.children.length;this.index++){const s=this.children[this.index].tick(ctx);if(s!==Status.FAILURE)return s;}return Status.FAILURE;}
 _resetTransient(){this.index=0;}
}
export class ReactiveSelector extends Composite{
 constructor(children,name='reactive-selector'){super(name,children);this.active=-1;}
 _tick(ctx){for(let i=0;i<this.children.length;i++){
   const child=this.children[i]; if(done(child.status))child.reset(ctx);
   const s=child.tick(ctx);if(s===Status.FAILURE)continue;
   if(this.active>=0&&this.active!==i)this.children[this.active].abort(ctx);
   this.active=s===Status.RUNNING?i:-1;return s;
 }if(this.active>=0)this.children[this.active].abort(ctx);this.active=-1;return Status.FAILURE;}
 _resetTransient(){this.active=-1;}
}
export class ParallelAll extends Composite{
 constructor(children,name='parallel-all'){super(name,children);}
 _tick(ctx){let all=true;for(const c of this.children){const s=done(c.status)?c.status:c.tick(ctx);if(s===Status.FAILURE){for(const o of this.children)if(o!==c&&o.status===Status.RUNNING)o.abort(ctx);return Status.FAILURE;}if(s!==Status.SUCCESS)all=false;}return all?Status.SUCCESS:Status.RUNNING;}
}
export class Guard extends Node{
 constructor(name,predicate,child){super(name);if(!(child instanceof Node)||typeof predicate!=='function')throw new TypeError('guard args');this.predicate=predicate;this.child=child;}
 _tick(ctx){if(!this.predicate(ctx)){if(this.child.status===Status.RUNNING)this.child.abort(ctx);return Status.FAILURE;}return this.child.tick(ctx);}
 _abort(ctx){this.child.reset(ctx);}
 reset(ctx){super.reset(ctx);this.child.reset(ctx);}
}
export class Inverter extends Node{
 constructor(child,name='inverter'){super(name);if(!(child instanceof Node))throw new TypeError('child node');this.child=child;}
 _tick(ctx){const s=this.child.tick(ctx);return s===Status.SUCCESS?Status.FAILURE:s===Status.FAILURE?Status.SUCCESS:s;}
 _abort(ctx){this.child.abort(ctx);}
 reset(ctx){super.reset(ctx);this.child.reset(ctx);}
}
export class Repeat extends Node{
 constructor(child,count,name='repeat'){super(name);if(!(child instanceof Node)||!Number.isSafeInteger(count)||count<0)throw new TypeError('count >=0');this.child=child;this.count=count;this.completed=0;}
 _tick(ctx){if(this.completed>=this.count)return Status.SUCCESS;if(this.child.status===Status.SUCCESS)this.child.reset(ctx);
  const s=this.child.tick(ctx);if(s===Status.FAILURE)return Status.FAILURE;
  if(s===Status.SUCCESS){this.completed++;return this.completed===this.count?Status.SUCCESS:Status.RUNNING;}
  return Status.RUNNING;}
 _abort(ctx){this.child.abort(ctx);}
 _resetTransient(){this.completed=0;}
 reset(ctx){super.reset(ctx);this.child.reset(ctx);}
}
export class Cooldown extends Node{
 constructor(child,seconds,name='cooldown'){super(name);if(!(child instanceof Node)||!Number.isFinite(seconds)||seconds<0)throw new TypeError('cooldown args');this.child=child;this.seconds=seconds;this.readyAt=-Infinity;}
 _tick(ctx){if(ctx.time<this.readyAt)return Status.FAILURE;const s=this.child.tick(ctx);if(s===Status.SUCCESS)this.readyAt=ctx.time+this.seconds;return s;}
 _abort(ctx){if(this.child.status===Status.RUNNING)this.child.abort(ctx);}
 reset(ctx){super.reset(ctx);this.child.reset(ctx);}
 clearCooldown(){this.readyAt=-Infinity;}
}
export class Tree{constructor(root){if(!(root instanceof Node))throw new TypeError('root');this.root=root;}
 tick(ctx){check(ctx);if(done(this.root.status))this.root.reset(ctx);return this.root.tick(ctx);}abort(ctx){this.root.abort(ctx);}reset(ctx){this.root.reset(ctx);}}
