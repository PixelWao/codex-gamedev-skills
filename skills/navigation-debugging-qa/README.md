# navigation-debugging-qa

Install this *folder* in `%USERPROFILE%\.agents\skills\` for global Codex use, or `.agents/skills/` inside an individual repo. Do not install as a nested directory inside the old `game-ai` skill. Disable the old `game-ai` if it conflicts.

Open `SKILL.md` first. The skill is self-contained. All scripts run locally, without network installation; optional real-world integrations require the project's existing dependencies.

Run the tests in `tests/` and read the applicable QA instructions in the references. The scripts are reference implementations, not drop-in replacements for an existing physics solver, renderer or NPC decision system.
