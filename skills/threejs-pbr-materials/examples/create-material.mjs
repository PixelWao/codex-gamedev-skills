// Copyright (c) 2026 Waldemar Soroka — MIT
// Dependency-injected adapter: caller owns all supplied textures.
export const COLOR_SLOTS = new Set(['map', 'emissiveMap', 'sheenColorMap', 'specularColorMap']);
export const DATA_SLOTS = new Set(['normalMap','roughnessMap','metalnessMap','aoMap','alphaMap','bumpMap','displacementMap','clearcoatMap','clearcoatRoughnessMap','clearcoatNormalMap','anisotropyMap','iridescenceMap','iridescenceThicknessMap','sheenRoughnessMap','specularIntensityMap','transmissionMap','thicknessMap']);
export const NUMERIC_RANGES = {
  metalness:[0,1], roughness:[0,1], opacity:[0,1], transmission:[0,1], clearcoat:[0,1],
  clearcoatRoughness:[0,1], sheen:[0,1], iridescence:[0,1], anisotropy:[0,1],
  specularIntensity:[0,1], ior:[1,2.333], alphaTest:[0,1],
};

export function validateMaterialSpec(spec) {
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) throw new TypeError('material spec must be an object');
  const kind = spec.type ?? 'MeshStandardMaterial';
  if (!['MeshStandardMaterial','MeshPhysicalMaterial','MeshBasicMaterial'].includes(kind)) throw new RangeError(`Unsupported material: ${kind}`);
  const params = spec.parameters ?? {};
  if (!params || typeof params !== 'object' || Array.isArray(params)) throw new TypeError('parameters must be object');
  for (const [param,limits] of Object.entries(NUMERIC_RANGES)) {
    if (params[param] === undefined) continue;
    const v=params[param];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < limits[0] || v > limits[1]) throw new RangeError(`${param} expected ${limits[0]}..${limits[1]}`);
  }
  if (kind === 'MeshPhysicalMaterial' && Number(params.transmission ?? 0) > 0 && params.opacity !== undefined && params.opacity !== 1) {
    throw new RangeError('Use opacity:1 with physical transmission; test in target renderer');
  }
  const maps=spec.maps ?? {};
  if (!maps || typeof maps !== 'object' || Array.isArray(maps)) throw new TypeError('maps must be an object');
  for (const [slot, texture] of Object.entries(maps)) {
    if (!COLOR_SLOTS.has(slot) && !DATA_SLOTS.has(slot)) throw new RangeError(`Unknown texture role: ${slot}`);
    if (!texture || typeof texture !== 'object') throw new TypeError(`${slot} must be texture object`);
    const expected=COLOR_SLOTS.has(slot) ? 'SRGBColorSpace' : 'NoColorSpace';
    // Never mutate glTF/caller-owned texture. Assert the texture role is correct.
    if (texture.colorSpace !== expected) throw new RangeError(`${slot} expected ${expected}, got ${texture.colorSpace}`);
  }
  return kind;
}

export function createPBRMaterial(THREE, spec) {
  const kind=validateMaterialSpec(spec);
  const MaterialClass=THREE?.[kind];
  if (typeof MaterialClass !== 'function') throw new Error(`Installed Three.js does not support ${kind}`);
  const params={...spec.parameters,...(spec.maps ?? {})};
  const material=new MaterialClass(params);
  let disposed=false;
  return {
    material,
    // This only disposes the exclusively-created material. Textures remain caller-owned.
    dispose() { if (disposed) return; disposed=true; material.dispose(); },
  };
}
