# Blockout protocol

1. Define measurable goals, critical route, player abilities, hazards and exit.
2. Capture player collision dimensions, maximum speed, acceleration, jump initial velocity, gravity and camera envelope from the live game. Record units and coordinate conventions.
3. Start with geometry primitives. Use negative Y for downward display only in Canvas if appropriate; analytic helper uses positive Y upward. Convert intentionally.
4. Probe reachable edges for equal-height, uphill and downhill landings. `jumpEnvelope` ignores collisions and cannot certify moving/one-way platforms or wall kicks. Use engine simulation adapters and playtests for these.
5. Check 3D passage width and height using `checkAabbClearance` with the actual agent bounding dimensions; Three.js world bounds can be obtained from `Box3.setFromObject()` after updating world matrices.
6. Maintain design intent: introduce → develop → twist → test, clear critical path, optional branches, rest before climax.
7. Review with actual players: path recognition, discoverability, misclicks, deaths, completion time and camera visibility; fix whitebox before dressing.

Read https://threejs.org/docs/pages/Box3.html and https://book.leveldesignbook.com/process/blockout for reference. These references describe ideas; code here is independently authored.
