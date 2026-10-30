// Copyright (c) 2026 Waldemar Soroka — MIT
// Example: caller created textures and declared their correct colorSpace once.
import {createPBRMaterial} from './create-material.mjs';
export function createStoneSurface(THREE,{albedo,normal,roughness}){
  const asset=createPBRMaterial(THREE,{
    type:'MeshStandardMaterial',
    parameters:{metalness:0,roughness:0.75},
    maps:{map:albedo,normalMap:normal,roughnessMap:roughness},
  });
  // Dispose this material only after no meshes use it; the texture loader retains maps.
  return asset;
}
