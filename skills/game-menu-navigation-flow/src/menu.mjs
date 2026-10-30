/** MIT © 2026 Waldemar Soroka. One owner for screen flow, no extra game loop. */
export class ScreenStack {
  #entries=[];
  constructor({onChange=()=>{}}={}){this.onChange=onChange;}
  get size(){return this.#entries.length;}
  get current(){return this.#entries.at(-1)?.screen??null;}
  push(screen){
    if(!screen||typeof screen.activate!=='function'||typeof screen.deactivate!=='function')throw new TypeError('screen activate/deactivate required');
    if(this.#entries.some(e=>e.screen===screen))throw new Error('duplicate screen');
    const old=this.current;old?.deactivate();
    try{screen.activate();this.#entries.push({screen});}
    catch(e){old?.activate();throw e;}
    this.onChange(this.current,this.size);return screen;
  }
  pop(){
    if(this.size===0)return null;
    const top=this.#entries.pop().screen;top.deactivate();top.dispose?.();
    this.current?.activate();this.onChange(this.current,this.size);return top;
  }
  clear(){while(this.size)this.pop();}
}
export function domScreen(element,{defaultFocus=()=>element.querySelector('button:not([disabled]),[href],input:not([disabled]),[tabindex="0"]')}={}){
  if(!element)throw new TypeError('element required');
  let prior=null;
  return {activate(){prior=element.ownerDocument.activeElement;element.hidden=false;element.inert=false;const focus=defaultFocus();focus?.focus?.();},deactivate(){element.inert=true;element.hidden=true;if(prior?.isConnected&&!prior.inert)prior.focus?.();}};
}
export function createModalController(dialog,{fallbackFocus=null}={}){
  if(!dialog||typeof dialog.showModal!=='function'||typeof dialog.close!=='function')throw new TypeError('native HTMLDialogElement required');
  let trigger=null;let active=false;
  const onClose=()=>{active=false;if(trigger?.isConnected&&!trigger.inert)trigger.focus?.();trigger=null;};
  dialog.addEventListener('close',onClose);
  return {
    open(){if(active)return false;trigger=dialog.ownerDocument.activeElement;dialog.showModal();active=true;return true;},
    close(){if(!active)return false;dialog.close();/* native close event restores focus */return true;},
    get isOpen(){return active;},
    dispose(){dialog.removeEventListener('close',onClose);if(active)dialog.close();active=false;trigger=null;},
    focusFallback(){fallbackFocus?.focus?.();}
  };
}
export function createInputRouter({onAction,keyboardTarget=globalThis.document,gamepads=()=>globalThis.navigator?.getGamepads?.()??[],threshold=0.55}={}){
  if(typeof onAction!=='function')throw new TypeError('onAction required');
  if(!(threshold>0&&threshold<1))throw new RangeError('threshold must be (0,1)');
  const prev=new Map();let disposed=false;
  const kb={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',Enter:'confirm',' ':'confirm',Escape:'back',Backspace:'back'};
  function keydown(e){if(disposed||e.repeat||e.isComposing)return; const action=kb[e.key];if(!action)return;const t=e.target; if((t?.matches?.('input,textarea,[contenteditable="true"]'))&&action!=='back')return;onAction(action,'keyboard');if(action!=='back'||!t?.matches?.('input,textarea'))e.preventDefault?.();}
  keyboardTarget?.addEventListener?.('keydown',keydown);
  function poll(){
    if(disposed)return;
    const pads=gamepads()??[];const live=new Set();
    for(const p of pads){if(!p||!p.connected)continue;live.add(p.index);const pressed=(n)=>!!p.buttons?.[n]?.pressed;const axes=p.axes??[];
      const states={confirm:pressed(0),back:pressed(1),up:pressed(12)||(axes[1]??0)<-threshold,down:pressed(13)||(axes[1]??0)>threshold,left:pressed(14)||(axes[0]??0)<-threshold,right:pressed(15)||(axes[0]??0)>threshold};
      const last=prev.get(p.index)??{};
      for(const [action,on] of Object.entries(states))if(on&&!last[action])onAction(action,'gamepad');
      prev.set(p.index,states);
    }
    for(const k of prev.keys())if(!live.has(k))prev.delete(k);
  }
  return {poll,dispose(){disposed=true;prev.clear();keyboardTarget?.removeEventListener?.('keydown',keydown);}};
}
export function bindPointerActions(surface,{onStart,onEnd,onCancel}={}){
  if(!surface)throw new TypeError('surface required');
  const active=new Map();
  function down(e){if(active.has(e.pointerId))return;active.set(e.pointerId,{x:e.clientX,y:e.clientY});surface.setPointerCapture?.(e.pointerId);onStart?.(e.pointerId,{x:e.clientX,y:e.clientY});}
  function up(e){if(!active.delete(e.pointerId))return;onEnd?.(e.pointerId,{x:e.clientX,y:e.clientY});if(surface.hasPointerCapture?.(e.pointerId))surface.releasePointerCapture(e.pointerId);}
  function cancel(e){if(!active.delete(e.pointerId))return;onCancel?.(e.pointerId);if(surface.hasPointerCapture?.(e.pointerId))surface.releasePointerCapture(e.pointerId);}
  for(const [ev,fn] of [['pointerdown',down],['pointerup',up],['pointercancel',cancel],['lostpointercapture',cancel]])surface.addEventListener(ev,fn);
  return {get activeCount(){return active.size;},dispose(){for(const id of active.keys())onCancel?.(id);active.clear();for(const [ev,fn] of [['pointerdown',down],['pointerup',up],['pointercancel',cancel],['lostpointercapture',cancel]])surface.removeEventListener(ev,fn);}};
}
