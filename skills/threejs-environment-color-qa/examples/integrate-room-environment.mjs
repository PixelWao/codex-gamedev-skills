// Copyright (c) 2026 Waldemar Soroka — MIT
// Run this inside an existing npm Three.js app (requires installed `three`).
// No new renderer or loop: caller supplies its existing WebGLRenderer and Scene.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {createEnvironmentOwner} from './environment-owner.mjs';

export function attachNeutralIBL({renderer,scene}) {
  if(!renderer || !scene) throw new TypeError('Supply existing renderer and scene');
  const owner=createEnvironmentOwner({
    scene,
    makeGenerator:()=>new THREE.PMREMGenerator(renderer),
    makeRoom:()=>new RoomEnvironment(),
  });
  owner.setRoomEnvironment(0.04);
  return owner; // caller must dispose on scene unload
}
