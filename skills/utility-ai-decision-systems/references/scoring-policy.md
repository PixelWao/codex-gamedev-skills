# Scoring policy

1. **Gates first:** ammo, line of sight, equipment, and cooldown determine whether the action is eligible. Do not approximate an impossible action with a tiny positive score.
2. **Curves:** `inverseLerp` supports reversed ranges, `sigmoid` has adjustable midpoint, exponential should be linear as `k→0`. Non-finite input is an error, not implicit zero.
3. **Aggregation:** arithmetic mean tolerates weak factors; product means a zero factor vetoes; compensated product may mitigate low mean scores but **cannot turn a zero product into positive**.
4. **Softmax:** exp((score-max)/T) for stable finite exponentials. Temperature >0. Sum of weights >0. Seeded RNG means reproducibility only when evaluation order and simulation inputs are also reproducible.
5. **Stability:** use switching margin against the *current eligible* action. Extra `minHold` or `maxReplanRate` may be appropriate in host NPC state machines; distinguish deliberate safety interrupts from ordinary re-selection.
6. **Budget:** evaluate sensors at different cadence if costly. Use observability: action name, gates, considerations, raw score, adjusted score, decision time.

Always write tests for empty lists, invalid values, `temperature≈0`, opposite ranges, 0 factors, equal ties, eligibility changes and seeds.
