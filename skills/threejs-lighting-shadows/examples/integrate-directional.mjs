// Copyright (c) 2026 Waldemar Soroka — MIT
// Integrate without creating/replacing the render loop.
import {configureDirectionalShadows, enableRendererShadows} from './configure-shadows.mjs';
export function prepareSunShadows({renderer, sun, ground, casters}) {
  enableRendererShadows(renderer);
  configureDirectionalShadows(sun, {
    bounds:{left:-20,right:20,top:20,bottom:-20},near:1,far:75,
    mapSize:1024,normalBias:0.02,
  });
  for(const mesh of casters)mesh.castShadow=true;
  ground.receiveShadow=true;
  return () => { sun.castShadow=false; }; // cleanup caller-owned light/materials elsewhere
}
