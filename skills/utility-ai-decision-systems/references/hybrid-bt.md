# Integrating Utility AI inside a behavior tree

Keep the BT responsible for *when* a kind of decision may occur and whether it is interrupted. Inside an `AttackChoice` / `ChooseTarget` leaf use an `Evaluator` to rank **eligible** actions and return the name as a command to the existing game model. Do not create a second per-frame AI update loop.

Example pattern:

```js
const attackChoice = new Action('attack-choice', ({bb}) => {
  const facts = bb.get('combatFacts');
  const selection = evaluator.choose(facts, {strategy: 'best'});
  if (!selection) return Status.FAILURE;
  bb.set('selectedAttack', selection.name);
  return Status.SUCCESS;
});
```

A running attack should remain committed unless the BT explicitly aborts it or game policy says it can be interrupted; do not call `choose()` every render frame to replace actions mid-animation. For loss-of-vision handling, guard the entire combat subtree and release reservations in `onAbort`.

Use a seeded RNG for stochastic selection; note that identical RNG seeds only guarantee identical decisions if fact evaluations, action ordering and update scheduling are also deterministic.
