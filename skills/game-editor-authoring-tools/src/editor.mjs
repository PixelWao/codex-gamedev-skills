/** Engine-agnostic level authoring model; stable IDs, transaction-safe undo/redo. MIT © 2026 Waldemar Soroka. */
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const v3=(src,label)=>{if(!src||!['x','y','z'].every(k=>finite(src[k])))throw new TypeError(`invalid ${label}`);return{x:src.x,y:src.y,z:src.z}};
const identity=()=>({x:0,y:0,z:0});
const cp=o=>JSON.parse(JSON.stringify(o));
const idOk=s=>typeof s==='string'&&/^[a-zA-Z0-9_-]{1,96}$/.test(s);
export function snap(value,increment){if(!finite(value)||!finite(increment)||increment<=0)throw new RangeError('invalid snap');return Math.round(value/increment)*increment}
export class LevelDocument {
 constructor(){this.nodes=new Map();this.undoStack=[];this.redoStack=[];this.revision=0}
 #commit(before){this.undoStack.push(before);this.redoStack.length=0;this.revision++}
 #checkpoint(){return this.export()}
 add({id,kind='object',parent=null,position=identity(),rotation=identity(),scale={x:1,y:1,z:1},properties={}}){
  if(!idOk(id)||this.nodes.has(id)||!(parent===null||this.nodes.has(parent)))throw new Error('invalid id or parent');
  const o={id,kind,parent,position:v3(position,'position'),rotation:v3(rotation,'rotation'),scale:v3(scale,'scale'),properties:cp(properties)};
  if(Object.values(o.scale).some(v=>v<=0))throw new Error('scale must be positive');
  const before=this.#checkpoint();this.nodes.set(id,o);this.#commit(before);return cp(o)
 }
 update(id,patch){
  const node=this.nodes.get(id);if(!node)throw new Error('unknown object');
  if('parent'in patch){const newParent=patch.parent;if(newParent===id)throw new Error('self parent');if(newParent!==null&&!this.nodes.has(newParent))throw new Error('missing parent');let p=newParent;while(p!==null){if(p===id)throw new Error('cycle');p=this.nodes.get(p)?.parent??null}}
  const before=this.#checkpoint(),next=cp(node);
  if(patch.position)next.position=v3(patch.position,'position');if(patch.rotation)next.rotation=v3(patch.rotation,'rotation');
  if(patch.scale){next.scale=v3(patch.scale,'scale');if(Object.values(next.scale).some(v=>v<=0))throw new Error('scale must be positive')}
  if('parent'in patch)next.parent=patch.parent;
  if('properties'in patch)next.properties=cp(patch.properties);
  this.nodes.set(id,next);this.#commit(before);return cp(next)
 }
 remove(id){if(!this.nodes.has(id))return false;const before=this.#checkpoint();
  // Parent plus descendants are removed as a unit so document doesn't gain orphans.
  const descendants=new Set([id]);let progress=true;while(progress){progress=false;for(const n of this.nodes.values())if(n.parent!==null&&descendants.has(n.parent)&&!descendants.has(n.id)){descendants.add(n.id);progress=true}}
  for(const key of descendants)this.nodes.delete(key);this.#commit(before);return true
 }
 duplicate(id,newId){const original=this.nodes.get(id);if(!original)throw new Error('unknown object');return this.add({...cp(original),id:newId,parent:original.parent})}
 export(){return {schema:1,nodes:[...this.nodes.values()].map(cp).sort((a,b)=>a.id.localeCompare(b.id))}}
 static fromObject(obj){if(!obj||obj.schema!==1||!Array.isArray(obj.nodes))throw new Error('invalid document');const d=new LevelDocument();
  const visited=new Set();for(const n of obj.nodes){if(!idOk(n.id)||visited.has(n.id))throw new Error('duplicate/invalid id');visited.add(n.id);v3(n.position,'position');v3(n.rotation,'rotation');v3(n.scale,'scale');if(Object.values(n.scale).some(v=>v<=0))throw new Error('invalid scale')}
  for(const n of obj.nodes){if(n.parent!==null&&!visited.has(n.parent))throw new Error('missing parent');let p=n.parent,seen=new Set([n.id]);while(p!==null){if(seen.has(p))throw new Error('cycle');seen.add(p);p=obj.nodes.find(x=>x.id===p)?.parent??null}d.nodes.set(n.id,cp(n))}
  return d
 }
 import(obj){const next=LevelDocument.fromObject(obj);const previous=this.#checkpoint();this.nodes=next.nodes;this.#commit(previous);return this}
 undo(){if(!this.undoStack.length)return false;const previous=this.undoStack.pop();this.redoStack.push(this.#checkpoint());this.nodes=LevelDocument.fromObject(previous).nodes;this.revision++;return true}
 redo(){if(!this.redoStack.length)return false;const next=this.redoStack.pop();this.undoStack.push(this.#checkpoint());this.nodes=LevelDocument.fromObject(next).nodes;this.revision++;return true}
}
/** Adapter: copy document spatial data to already-existing Three.js objects; don't create a renderer or physics world. */
export function applyTransformToThreeNode(model,object3d){
 if(!object3d?.position?.set||!object3d.rotation?.set||!object3d.scale?.set)throw new Error('missing THREE.Object3D setters');
 object3d.position.set(model.position.x,model.position.y,model.position.z);
 object3d.rotation.set(model.rotation.x,model.rotation.y,model.rotation.z);
 object3d.scale.set(model.scale.x,model.scale.y,model.scale.z);
}
