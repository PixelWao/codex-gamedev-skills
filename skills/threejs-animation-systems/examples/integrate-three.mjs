// MIT — Copyright (c) 2026 Waldemar Soroka
import { AnimationMixer, LoopOnce } from 'three';
import { createAnimationController } from './animation-controller.mjs';

export function attachCharacterAnimations(root, clips, gameUpdateRegistry) {
  const mixer = new AnimationMixer(root);
  const controller = createAnimationController({
    mixer, root, clips,
    onFinished: state => console.debug('Completed:', state)
  });
  // This registration API is a PROJECT INTEGRATION PLACEHOLDER, not a Three.js API.
  // Replace with your existing authoritative game update subscription.
  const unsubscribe = gameUpdateRegistry.register(dtSeconds => controller.update(dtSeconds));
  return {
    playIdle: () => controller.transition('Idle'),
    attack: () => controller.transition('Attack', { fade: 0.1, once: true, loopOnce: LoopOnce }),
    available: controller.available,
    dispose() { unsubscribe(); controller.dispose(); }
  };
}
