# Destruction QA for physically interacting fragments

## Fracture is both topology and a state transition

The intact building body/collider graph and the broken-piece graph must have a controlled handoff. Define a single owner for the fracture event. Remove/disable the source colliders **at a safe world update boundary** before inserting fragments if the two graphs would overlap. Preserve game-relevant IDs, event associations and mission statistics.

**No mass or momentum from nowhere:** track source mass, fragment masses, velocities, and injected impulse from explosion/crane impact. Gameplay may intentionally violate physical conservation for effect, but document the deviation and ensure it is stable/repeatable. Distinguish animation bursts from simulated physics impulse.

## Diagnostic failure modes

- Immediate launch of debris: overlapping piece colliders, explosive penetration correction, inflated contact margins, extreme restitution.
- Pieces interpenetrate floor: missing colliders, narrow/fine triangulated geometry, high velocity and CCD limitations.
- Pieces remain trapped around wheels: fragment thickness/gap, collision layers, mass ratios, vehicle clearance, step limits.
- Huge performance spikes: high contact pair count, complex triangle meshes, too many awake fragments, expensive per-body CCD, joint graph enlargement.
- Player/observer failure zones malfunction: swapped layer masks, collider lifecycle, erased trigger IDs.

## Shape strategy

Use simple validated convex colliders per fragment where adequate. Avoid treating a rendering triangle soup as an appropriate dynamic collider merely because it's visually accurate. For concave debris, determine whether compound convex pieces or gameplay-specific collision approximations are appropriate; verify no important pass-through areas get blocked unexpectedly.

## Benchmark matrix

Scenarios: (A) unbroken structure idle; (B) targeted strike; (C) cascading collapse; (D) dense rubble and wheel/ball passage; (E) return/reload. Track active bodies, collider count, joint count, contacts, worst penetration, nonfinite states, step-time p95/p99, number of fragments and gameplay completion condition.

A reduced fragment count is not by itself a gameplay success: intact geometry, dust effects, damage progression and the ability to interact with rubble must be preserved unless changed intentionally.
