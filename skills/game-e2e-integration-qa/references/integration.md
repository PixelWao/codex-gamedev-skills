# Integration playbook

Suggested 2D smoke: start new game, dismiss onboarding, move, jump, interact, pause, return, save and reload. Suggested 3D smoke: ensure renderer initializes, camera moves, valid glTF scene loads, Rapier collider is present, no errors, controls function.
Input safety: release held keys via key_up; browser is closed automatically.
Comparison matrix: desktop 1280x720, mobile 390x844 and 844x390, ultrawide 3440x1440. Gameplay state oracle and assertions must come from actual project interfaces.
Use game-ui-accessibility-qa for accessibility audits, camera-debugging-qa for camera traces, fps-shooter tests for weapon FSM, and physics QA for solver details.
