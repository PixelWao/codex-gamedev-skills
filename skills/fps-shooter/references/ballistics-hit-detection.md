# Hitscan, collision priority, damage, and projectiles

## World blocking is mandatory

1. Project a ray from camera to determine point of aim. This cast includes *world + damageable* colliders, not only damageable colliders.
2. Project from the actual muzzle position towards that aim point. The muzzle ray must include collidable walls, doors, scenery, and actor hitboxes. If it finds an obstacle first, that obstacle wins.
3. Determine impact material, damageability and hit zone **after** deciding what blocked the shot. Use a single authoritative collision space per interaction. Render geometry ray hits can differ from physics colliders.
4. Exclude only the shooter's own collision shape (or explicitly self-colliders). Do not blanket-exclude all dynamic bodies.

`src/ballistics.mjs#fireHitscan` returns both camera and barrel casts and never awards damage. Game-specific hitbox metadata and authoritative health systems determine damage, armor and kill credit.

### Spread vs recoil

`sampleCone` samples unit-solid-angle distribution inside a cone using `cos(theta) = 1 - U (1-cos(maxAngle))` and uniform azimuth. This differs from independent uniform yaw/pitch (square footprint) and from uniform radius on a tangent plane. Other patterns (pellet shotgun, horizontal spray, fixed spread) should be explicitly named and tested.

### Projectile collision

`advanceProjectile` takes `{position,velocity,gravity,radius,maxLife,maxRange}` and a sweep callback `(start,end,radius,options)`. Returned `fraction` is the fraction along the attempted segment, not seconds. The function applies a constant-acceleration step, limits displacement by remaining range, and invokes the sweep query before committing the new position. If the world contains moving targets, severe curvature, or fast projectiles, validate substep size / relative motion; a single straight sweep may not cover every motion.

Use a **sphere cast** or equivalent when radius > 0. An endpoint overlap alone can miss thin walls. Avoid applying damage again after `done` is true. Lifetime/range caps prevent abandoned projectiles persisting forever.

### Damage

`DamageLedger` demonstrates idempotent event IDs. Keep actor HP authoritative, handle penetration, armor, shields and destructible tiles in the owning systems, and key events by session + attacker + weapon + shot ID (and pellet/hit index where appropriate). Use unique IDs; do not clear the ledger during combat.
