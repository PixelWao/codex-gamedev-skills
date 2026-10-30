/** Finite directed level-state exploration. All room pickups are ONCE, not farmable. */
const validId = x=>typeof x==='string' && x.trim().length>0;
const unique = x=>[...new Set(x)].sort();
const hasAll=(owned,required=[])=>required.every(v=>owned.includes(v));
const normalizeKeys=(src={})=>Object.fromEntries(Object.entries(src).filter(([k,v])=>Number.isSafeInteger(v)&&v>0).sort(([a],[b])=>a.localeCompare(b)));
function arrays(v,label){if(v===undefined)return [];if(!Array.isArray(v)||v.some(x=>!validId(x)))throw new TypeError(`${label} must be string[]`);return v}
function costs(o,label){if(o===undefined)return {}; if(!o||Array.isArray(o)||typeof o!=='object'||Object.entries(o).some(([k,v])=>!validId(k)||!Number.isSafeInteger(v)||v<0))throw new TypeError(`${label} must be nonnegative integer map`);return o}
export function validateLevel(level){
 const errors=[],warnings=[];
 if(!level || !level.rooms || Array.isArray(level.rooms)||typeof level.rooms!=='object')return {errors:[{code:'INVALID_ROOMS'}],warnings};
 const rooms=level.rooms, ids=new Set(Object.keys(rooms));
 if(!validId(level.start)||!ids.has(level.start))errors.push({code:'MISSING_START',room:level.start});
 if(!validId(level.goal)||!ids.has(level.goal))errors.push({code:'MISSING_GOAL',room:level.goal});
 const producedAbilities=new Set(arrays(level.startingAbilities,'startingAbilities'));
 const producedFlags=new Set(arrays(level.startingFlags,'startingFlags'));
 const producedDestroyed=new Set(arrays(level.startingDestroyed,'startingDestroyed'));
 const producedKeys=new Set(Object.keys(costs(level.startingKeys,'startingKeys')));
 for(const [id,room] of Object.entries(rooms)){
  if(!validId(id)||!room||!Array.isArray(room.exits)) {errors.push({code:'INVALID_ROOM',room:id});continue;}
  for(const a of arrays(room.grants,'grants'))producedAbilities.add(a);
  for(const a of arrays(room.flags,'flags'))producedFlags.add(a);
  for(const a of arrays(room.destroys,'destroys'))producedDestroyed.add(a);
  for(const k of Object.keys(costs(room.keys,'keys')))producedKeys.add(k);
  for(const [index,edge] of room.exits.entries()){
   if(!edge||!ids.has(edge.to))errors.push({code:'MISSING_TARGET',room:id,index,target:edge?.to});
   for(const a of arrays(edge.setFlags,'setFlags'))producedFlags.add(a);
   for(const a of arrays(edge.destroy,'destroy'))producedDestroyed.add(a);
   costs(edge.requiresKeys,'requiresKeys');costs(edge.consumesKeys,'consumesKeys');
   arrays(edge.requiresAbilities,'requiresAbilities');arrays(edge.requiresFlags,'requiresFlags');arrays(edge.requiresDestroyed,'requiresDestroyed');
  }
 }
 for(const [id,room] of Object.entries(rooms))for(const [index,e] of (room?.exits||[]).entries()){
  for(const a of e.requiresAbilities||[])if(!producedAbilities.has(a))errors.push({code:'UNOBTAINABLE_ABILITY',room:id,index,resource:a});
  for(const a of e.requiresFlags||[])if(!producedFlags.has(a))errors.push({code:'UNOBTAINABLE_FLAG',room:id,index,resource:a});
  for(const a of e.requiresDestroyed||[])if(!producedDestroyed.has(a))errors.push({code:'UNOBTAINABLE_DESTRUCTION',room:id,index,resource:a});
  for(const k of Object.keys(e.requiresKeys||{}))if(!producedKeys.has(k))errors.push({code:'UNOBTAINABLE_KEY',room:id,index,resource:k});
  for(const k of Object.keys(e.consumesKeys||{}))if(!producedKeys.has(k))errors.push({code:'UNOBTAINABLE_KEY',room:id,index,resource:k});
 }
 return {errors,warnings};
}
function enter(level,state,roomId){
 const room=level.rooms[roomId];
 const next={...state, room:roomId,abilities:[...state.abilities],flags:[...state.flags],destroyed:[...state.destroyed],collected:[...state.collected],keys:{...state.keys},checkpoint:state.checkpoint};
 if(!next.collected.includes(roomId)){
  next.collected=unique([...next.collected,roomId]);
  next.abilities=unique([...next.abilities,...(room.grants||[])]);
  next.flags=unique([...next.flags,...(room.flags||[])]);
  next.destroyed=unique([...next.destroyed,...(room.destroys||[])]);
  for(const [k,n] of Object.entries(room.keys||{}))next.keys[k]=(next.keys[k]||0)+n;
 }
 if(room.checkpoint===true)next.checkpoint=roomId;
 return next;
}
export function initialState(level){
 const check=validateLevel(level);if(check.errors.length)throw new Error(`Invalid level: ${check.errors[0].code}`);
 return enter(level,{room:level.start,abilities:unique(level.startingAbilities||[]),flags:unique(level.startingFlags||[]),destroyed:unique(level.startingDestroyed||[]),collected:[],keys:normalizeKeys(level.startingKeys),checkpoint:level.start},level.start);
}
export function encodeState(s){return JSON.stringify([s.room,s.checkpoint,s.abilities,s.flags,s.destroyed,s.collected,Object.entries(normalizeKeys(s.keys))]);}
export function transitions(level,s){
 if(!level.rooms[s.room])throw new Error('missing current room');
 const moves=[];
 for(const [index,e] of level.rooms[s.room].exits.entries()){
  if(!level.rooms[e.to] || !hasAll(s.abilities,e.requiresAbilities) || !hasAll(s.flags,e.requiresFlags) || !hasAll(s.destroyed,e.requiresDestroyed))continue;
  const required=Object.fromEntries(Object.keys({...e.requiresKeys,...e.consumesKeys}).map(k=>[k,Math.max(e.requiresKeys?.[k]||0,e.consumesKeys?.[k]||0)]));
  if(Object.entries(required).some(([k,n])=>(s.keys[k]||0)<n))continue;
  const base={...s, keys:{...s.keys}, flags:unique([...s.flags,...(e.setFlags||[])]),destroyed:unique([...s.destroyed,...(e.destroy||[])])};
  for(const [k,n]of Object.entries(e.consumesKeys||{}))base.keys[k]-=n;
  const to=enter(level,base,e.to);
  moves.push({index,to:e.to,state:to});
 }
 return moves;
}
/** Full state exploration; may return inconclusive if maxStates truncates. */
export function analyzeProgression(level,{maxStates=20000}={}){
 if(!Number.isSafeInteger(maxStates)||maxStates<1)throw new RangeError('maxStates must be positive integer');
 const validation=validateLevel(level);
 if(validation.errors.length)return {status:'invalid',...validation,goalReachable:false,states:0,softlocks:[],witness:null};
 const first=initialState(level), key=encodeState(first), nodes=[{id:key,state:first,path:[first.room]}], visited=new Map([[key,0]]), adjacency=[[]], reverse=[[]];
 let overflow=false;
 for(let i=0;i<nodes.length;i++){
  const n=nodes[i]; if(n.state.room===level.goal)continue; // terminal success
  for(const move of transitions(level,n.state)){
   const id=encodeState(move.state); let j=visited.get(id);
   if(j===undefined){if(nodes.length>=maxStates){overflow=true;break;}
    j=nodes.length;visited.set(id,j);nodes.push({id,state:move.state,path:[...n.path,move.to]});adjacency.push([]);reverse.push([]);
   }
   adjacency[i].push(j);reverse[j].push(i);
  }
  if(overflow)break;
 }
 const wins=[];for(let i=0;i<nodes.length;i++)if(nodes[i].state.room===level.goal)wins.push(i);
 const canReachGoal=new Set(wins),queue=[...wins];for(let head=0;head<queue.length;head++){const i=queue[head];for(const prev of reverse[i])if(!canReachGoal.has(prev)){canReachGoal.add(prev);queue.push(prev)}}
 const softlocks=overflow?[]:nodes.filter((_,i)=>!canReachGoal.has(i)).map(n=>({room:n.state.room,path:n.path,keys:n.state.keys,abilities:n.state.abilities,flags:n.state.flags,destroyed:n.state.destroyed}));
 return {status:overflow?'inconclusive':wins.length?'solvable':'unsolvable',goalReachable:wins.length>0,states:nodes.length,softlocks,witness:wins.length?nodes[wins[0]].path:null,errors:validation.errors,warnings:validation.warnings,coverage:{visitedRooms:unique(nodes.map(n=>n.state.room)),goalStates:wins.length},reason:overflow?'STATE_BUDGET_EXCEEDED':null};
}
/** Conservative checkpoint reset model. Engine-specific persistence must be verified in-game. */
export function respawnAtCheckpoint(state,{retainAbilities=true,retainKeys=false,retainFlags=true,retainDestroyed=true}={}){
 return {...state,room:state.checkpoint,abilities:retainAbilities?[...state.abilities]:[],keys:retainKeys?{...state.keys}:{},flags:retainFlags?[...state.flags]:[],destroyed:retainDestroyed?[...state.destroyed]:[]};
}
export function analyzePacing(beats){
 if(!Array.isArray(beats))throw new TypeError('beats array required');
 const issues=[],taught=new Set();let prior=null;
 for(let i=0;i<beats.length;i++){
  const b=beats[i]; if(!b||!Number.isFinite(b.intensity)||b.intensity<0||b.intensity>1){issues.push({code:'INVALID_INTENSITY',index:i});continue;}
  if(b.type==='teach' && b.mechanic)taught.add(b.mechanic);
  if((b.type==='test'||b.type==='twist')&& b.mechanic&&!taught.has(b.mechanic))issues.push({code:'UNTAUGHT_MECHANIC',index:i,mechanic:b.mechanic});
  if(b.type==='climax'&&prior?.type!=='rest')issues.push({code:'NO_REST_BEFORE_CLIMAX',index:i});
  prior=b;
 }
 return {issues,averageIntensity:beats.length?beats.reduce((s,b)=>s+(Number.isFinite(b.intensity)?b.intensity:0),0)/beats.length:0,beats:beats.length};
}
