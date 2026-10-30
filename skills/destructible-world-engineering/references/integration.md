# Integration playbook

WRECK CREW: model support anchors, columns, beams; wrecking ball impulses create damage events; physics and graphics are updated by game after step. MELTDOWN: use tiles or material regions and a separate fluid system (do not treat water/steam as structural nodes). CRASH LAB: destructible block layers and portal links must update collision and navigation coherently.
Ordering contract: physics.step → gather collisions → graph.enqueue* → graph.flush → synchronize bodies/meshes → mark nav regions dirty → persist journal.
Event ID should combine authoritative tick and collision identity, with dedup window bounded by `maxSeen`. Repeating an ID within that window is ignored.
