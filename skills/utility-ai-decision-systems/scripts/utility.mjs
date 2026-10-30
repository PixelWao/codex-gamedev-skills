/** Utility AI reference: pure scores, finite numeric contracts, seeded random selection. */
export function finite(x,name='value'){if(typeof x!=='number'||!Number.isFinite(x))throw new RangeError(`${name} must be finite`);return x;}
export function clamp01(x){return Math.min(1,Math.max(0,finite(x)));}
export function inverseLerp(x,a,b){finite(x);finite(a);finite(b);return a===b?(x>=b?1:0):clamp01((x-a)/(b-a));}
export const curves=Object.freeze({linear:clamp01,smoothstep:t=>{t=clamp01(t);return t*t*(3-2*t);},polynomial:(t,p=2)=>{finite(p);if(p<=0)throw new RangeError('exponent > 0');return clamp01(Math.pow(clamp01(t),p));},
 exponential:(t,k=4)=>{t=clamp01(t);finite(k);if(Math.abs(k)<1e-6)return t; if(Math.abs(k)>50)throw new RangeError('|k| must <=50');return clamp01(Math.expm1(k*t)/Math.expm1(k));},
 sigmoid:(t,k=8,mid=.5)=>{t=clamp01(t);finite(k);finite(mid);return clamp01(1/(1+Math.exp(-k*(t-mid))));}});
export function combine(factors,mode='product'){if(!Array.isArray(factors))throw new TypeError('factors must array');const f=factors.map(clamp01);if(!f.length)return 1;
 if(mode==='mean')return f.reduce((a,b)=>a+b,0)/f.length;
 const product=f.reduce((a,b)=>a*b,1);if(mode==='product')return product;
 if(mode==='compensated-product'){const adjustment=1-1/f.length;return clamp01(product+(1-product)*adjustment*product);}
 throw new RangeError('mode must be product, mean, or compensated-product');}
/** Deterministic RNG; reference only. */
export function mulberry32(seed){if(!Number.isSafeInteger(seed))throw new TypeError('integer seed');let state=seed>>>0;return ()=>{let t=state+=0x6D2B79F5;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function validateAction(a){if(!a||typeof a.name!=='string'||!a.name||typeof a.score!=='function')throw new TypeError('action name and score required');}
export class Evaluator{
 constructor(actions=[],{rng=mulberry32(1),hysteresis=.04}={}){if(!Array.isArray(actions)||typeof rng!=='function')throw new TypeError('actions/rng');finite(hysteresis);if(hysteresis<0)throw new RangeError('hysteresis');this.actions=actions;this.rng=rng;this.hysteresis=hysteresis;this.current=null;for(const a of actions)validateAction(a);if(new Set(actions.map(a=>a.name)).size!==actions.length)throw new Error('duplicate action names');}
 evaluate(facts){const eligible=[];for(const a of this.actions){if(a.available&&!a.available(facts))continue;const raw=finite(a.score(facts),`${a.name} score`);if(raw<0||raw>1)throw new RangeError(`${a.name}: score out of [0,1]`);eligible.push({name:a.name,score:raw,adjusted:raw+(this.current===a.name?this.hysteresis:0)});}return eligible;}
 choose(facts,{strategy='best',temperature=.2}={}){const candidates=this.evaluate(facts);if(!candidates.length){this.current=null;return null;}
 let winner;
 if(strategy==='best'){winner=candidates.reduce((a,b)=>b.adjusted>a.adjusted?b:a);}
 else if(strategy==='softmax'||strategy==='weighted'){
   let weights;if(strategy==='softmax'){finite(temperature,'temperature');if(temperature<=0)throw new RangeError('temperature > 0');const max=Math.max(...candidates.map(x=>x.adjusted));weights=candidates.map(x=>Math.exp((x.adjusted-max)/temperature));}
   else weights=candidates.map(x=>x.adjusted);
   const total=weights.reduce((a,b)=>a+b,0);if(!Number.isFinite(total)||total<0)throw new RangeError('bad weights');
   if(total===0)winner=candidates[0];else{const r=finite(this.rng(),'rng');if(r<0||r>=1)throw new RangeError('rng outside [0,1)');let v=r*total;let i=0;while(i<weights.length-1&&v>=weights[i])v-=weights[i++];winner=candidates[i];}
 }else throw new RangeError('unknown strategy');
 this.current=winner.name;return {...winner,all:candidates};}
}
