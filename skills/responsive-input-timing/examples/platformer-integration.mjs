// Illustrative integration code, **existing controller owns physical impulse**.
import {JumpAssist,FixedStepEdgeQueue} from '../src/timing.mjs';
const queue=new FixedStepEdgeQueue();const jumping=new JumpAssist({bufferMs:120,coyoteMs:100});
let nextId=0;
export function onActionEdges(edges) {
  for (const e of edges) if(e.action==='jump')queue.capture({...e});
}
// Caller must pass DOM-time-compatible tickTimeMs, not seconds of unrelated simulation clock.
export function existingFixedStep({tickTimeMs,grounded,applyJumpImpulse,cutJumpHeight}) {
  for (const edge of queue.drainThrough(tickTimeMs)) {
    if(edge.type==='pressed')jumping.press(edge.time,`jump-${++nextId}`);
    if(edge.type==='released' && jumping.release(edge.time))cutJumpHeight?.();
  }
  jumping.setGrounded(tickTimeMs,Boolean(grounded));
  const request=jumping.tryConsume(tickTimeMs);
  if(request)applyJumpImpulse(request);
  return request;
}
export function cancelPendingInput(tickTimeMs){queue.cancel();jumping.cancel(tickTimeMs);}
