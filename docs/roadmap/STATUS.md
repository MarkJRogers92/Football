# Roadmap execution status

Last reconciled: 2026-11-15, source `200eb03` (`v0.33.0`).

## Current source and publication

PR #65 (world follow-ups) merged into PR #64 (world systems and pro pipeline), and #64 merged into the default branch at `200eb03f8349977b296e67bb8590a90539c57dd7`. Production commit `ae44ad58b1daf60efd2e181168bd6a5fd1a5176b` serves v0.33.0 at https://markjrogers92.github.io/Football/.

The live artifact matches the verified source build. The publisher's full release gate passed, followed by a live browser playthrough. Exact evidence is in `agent_docs/latest_session_work.md`.

## Next action

Release work is complete. Gather playtesting feedback before expanding the simulation. Do not rebuild systems already present in v0.33.

## Remaining work

- Real iPhone/Safari and screen-reader checks; automated desktop mobile viewports do not establish these.
- Human playtesting for session length, onboarding and whether the world stays enjoyable without chores.
- Fatigue, difficulty presets and alternate playoff formats are separate design/balance decisions, not part of this pass.
- Signed installers and a licence/pricing decision were previously declined or deferred by the owner; do not silently reopen them as blockers.

Use `CHANGELOG.md` for release history and `docs/DYNASTY_WORLD_MEASUREMENTS.md` for balance evidence. Historical release plans are not current task lists.
