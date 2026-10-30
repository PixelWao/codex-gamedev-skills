// Copyright (c) 2026 Waldemar Soroka — MIT
// Does not create a renderer, camera, or render loop; integrate with existing scene.
export function addReferenceSwatches(THREE, scene, {x=0,y=1,z=0,step=2}={}) {
  if (!scene || !THREE) throw new TypeError('scene and THREE required');
  const group=new THREE.Group();
  const geometry=new THREE.SphereGeometry(0.65,32,24);
  const roughnessLevels=[0.1,0.5,0.9], metalnessLevels=[0,0.5,1];
  const materials=[];
  for (let row=0;row<3;row++) for (let col=0;col<3;col++) {
    const material=new THREE.MeshStandardMaterial({color:0xb8bbc0,metalness:metalnessLevels[row],roughness:roughnessLevels[col]});
    const mesh=new THREE.Mesh(geometry,material);
    mesh.position.set(x+(col-1)*step,y+(1-row)*step,z);
    group.add(mesh); materials.push(material);
  }
  scene.add(group);
  let closed=false;
  return {
    group, dispose(){ if(closed)return; closed=true; scene.remove(group); materials.forEach(m=>m.dispose()); geometry.dispose(); },
  };
}
