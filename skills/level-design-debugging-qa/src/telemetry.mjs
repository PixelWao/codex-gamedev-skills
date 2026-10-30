/** Tiny deterministic tracing helper: no network, timers or engine ownership. */
export class LevelTrace {
  constructor(){this.events=[];this.ids=new Set();this.lastTime=-Infinity;}
  record({id,time,type,room,data={}}){
    if(typeof id!=='string'||!id || !Number.isFinite(time)||time<0||typeof type!=='string'||!type ||typeof room!=='string'||!room)throw new TypeError('invalid trace event');
    if(this.ids.has(id))throw new Error(`duplicate event id: ${id}`);
    if(time<this.lastTime)throw new Error('non-monotonic event time');
    const clean=JSON.parse(JSON.stringify(data));
    const event={id,time,type,room,data:clean};
    this.ids.add(id);this.lastTime=time;this.events.push(event);return event;
  }
  summary(){const counts={};for(const e of this.events)counts[e.type]=(counts[e.type]||0)+1;return {count:this.events.length,counts,uniqueRooms:[...new Set(this.events.map(e=>e.room))].sort(),elapsed:this.events.length?this.events.at(-1).time-this.events[0].time:0};}
  toJSONL(){return this.events.map(e=>JSON.stringify(e)).join('\n');}
  clear(){this.events=[];this.ids.clear();this.lastTime=-Infinity;}
}
