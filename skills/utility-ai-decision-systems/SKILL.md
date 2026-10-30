---
name: utility-ai-decision-systems
description: Use for NPC Utility AI considerations, scores, stable softmax, seeded choice and hysteresis; not Behavior Tree execution.
---
# Utility AI Decision Systems

Choose this skill for score-based selection among eligible NPC actions. Read `references/scoring-policy.md`, and check sample implementation in `scripts/utility.mjs`.

## Workflow
1. Define the action candidates, *availability gates*, sensors, ranges and side-effect-free score functions. Record score reasoning; invalid facts must not silently become desirable actions.
2. Normalize input factors to `[0,1]` with explicit treatment of inverted bounds; choose sum or product combining **deliberately**. Any zero in a product is a genuine veto, even when using compensation.
3. Exclude unavailable actions before scoring and selection. Empty eligible list returns `null`, never a random fallback.
4. For probabilistic choices use seeded RNG; stable softmax subtracts maximum score before exponentiation. Temperature must be finite and >0; include deterministic argmax and weighted alternatives.
5. Use a clear hysteresis policy for close scores; leave explicit interrupts for urgent threats. Never reset cooldown just because an action loses selection.
6. Run tests `node --test tests/*.test.mjs`, example `node examples/combat.mjs`, optional `tsc --noEmit -p tsconfig.json`. Sample code is not a combat system or physics controller.
7. Return concise score table with input values, eligibility, chosen action, reason and replay seed. Check CPU cost separately when many NPCs score simultaneously.

## Contracts
- Curves reject `NaN`/Infinity; exponential at `k=0` is linear; no divide-by-zero.
- Scores are finite nonnegative; default factors and action weights are normalized `[0,1]`.
- Pure scoring and seeded selection; actual action execution belongs to game commands/BT.
- Do not force a new library or migration; adapt the existing decision system if it already works.

## Files
`scripts/utility.mjs` and `scripts/utility.d.mts` implement example APIs; `references/scoring-policy.md` explains tuning; `references/csharp-interop.md` covers C#; tests and samples cover edge conditions.

See also `references/hybrid-bt.md` for combining score-based choice with an existing Behavior Tree; do not install a second AI runtime automatically.
