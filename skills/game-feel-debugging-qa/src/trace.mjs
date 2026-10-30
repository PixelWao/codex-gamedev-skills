// MIT Copyright (c) 2026 Waldemar Soroka
export class TraceRecorder{
 constructor({maxEvents=100000}={}){if(!Number.isInteger(maxEvents)||maxEvents<=0)throw new RangeError('maxEvents');this.maxEvents=maxEvents;this.events=[];this.dropped=0;}
 push(e){if(typeof e?.type!=='string'||!Number.isFinite(e.atMs))throw new TypeError('trace requires type and atMs');if(this.events.length>=this.maxEvents){this.dropped++;return false;}this.events.push({...e});return true;}
 jsonl(){return this.events.map(x=>JSON.stringify(x)).join('\n')+(this.events.length?'\n':'');}
 clear(){this.events=[];this.dropped=0;}
}
