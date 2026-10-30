// MIT (c) 2026 Waldemar Soroka — instrumentation, never required by input runtime.
export class InputTraceRecorder {
  constructor({clock=()=>performance.now()}={}){this.clock=clock;this.events=[];this.last=-Infinity;}
  add(type,properties={},time=this.clock()){
    if(typeof type!=='string'||!type||!Number.isFinite(time)||time<0||time<this.last)throw new RangeError('invalid event/time');
    if(!properties||typeof properties!=='object'||Array.isArray(properties))throw new TypeError('properties required');
    if('type' in properties||'time' in properties)throw new TypeError('type/time cannot be overridden');
    this.last=time;const record={time,type,...properties};this.events.push(record);return record;
  }
  exportJSONL(){return this.events.map(e=>JSON.stringify(e)).join('\n')+(this.events.length?'\n':'');}
  reset(){this.events=[];this.last=-Infinity;}
}
