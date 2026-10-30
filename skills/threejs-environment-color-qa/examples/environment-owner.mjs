// Copyright (c) 2026 Waldemar Soroka — MIT
// Scoped owner of PMREM render targets for *one* Three.js scene.
// The caller must not share owned target textures across scenes.
export function createEnvironmentOwner({scene, makeGenerator, makeRoom}) {
  if(!scene||typeof makeGenerator!=='function'||typeof makeRoom!=='function')throw new TypeError('scene, makeGenerator, makeRoom required');
  const originalEnvironment = scene.environment ?? null;
  let owned=null;let closed=false;let revision=0;
  function commit(target){
    if(!target?.texture||typeof target.dispose!=='function')throw new TypeError('Expected PMREM render target with texture/dispose');
    if(closed){target.dispose();throw new Error('EnvironmentOwner already disposed');}
    const old=owned;
    scene.environment=target.texture;
    owned=target;
    if(old&&old!==target)old.dispose();
    return target.texture;
  }
  function setRoomEnvironment(sigma=0.04){
    if(closed)throw new Error('EnvironmentOwner already disposed');
    if(!Number.isFinite(sigma)||sigma<0)throw new RangeError('sigma invalid');
    const op=++revision;
    let room,gen,target;
    try{
      room=makeRoom();gen=makeGenerator();
      target=gen.fromScene(room,sigma);
      if (op!==revision || closed) throw new Error('Stale environment operation');
      return commit(target);
    }catch(error){if(target && target!==owned) target.dispose();throw error;}
    finally {room?.dispose?.();gen?.dispose?.();}
  }
  async function setHDR(loadHDR){
    if(closed)throw new Error('EnvironmentOwner already disposed');
    if(typeof loadHDR!=='function')throw new TypeError('loadHDR required');
    const op=++revision;
    let hdr,gen,target;
    try{
      hdr=await loadHDR();
      if(closed || op!==revision)throw new Error('Stale environment operation during HDR load');
      gen=makeGenerator();target=gen.fromEquirectangular(hdr);
      if (closed || op!==revision) throw new Error('Stale environment operation after conversion');
      return commit(target);
    } catch(error){if(target&&target!==owned)target.dispose();throw error;}
    finally {hdr?.dispose?.();gen?.dispose?.();}
  }
  function dispose(){
    if(closed)return;closed=true;++revision;
    if(owned){if(scene.environment===owned.texture)scene.environment=originalEnvironment;owned.dispose();owned=null;}
  }
  return {setRoomEnvironment,setHDR,dispose,get ownedTexture(){return owned?.texture??null;}};
}
