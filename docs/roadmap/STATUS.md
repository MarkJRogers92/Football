# Roadmap execution status

Last reconciled: 2026-10-25, source `89727e8` (`v0.12.9`) on
`claude/review-improvement-dwjemy`. Production `gh-pages` serves the same
version. The previous revision of this file described v0.11.7 and is obsolete.

| Packet | Status | Notes |
| --- | --- | --- |
| v0.9.45 stabilization | SHIPPED | baseline release path |
| v0.9.46 offseason calendar | SHIPPED | |
| v0.9.47 transfer portal | SHIPPED | |
| v0.9.48 schedules/rivalries | SHIPPED | |
| v0.9.49 saves/storage | SHIPPED | multi-slot + autosave + chunked archives |
| v0.9.50 modules/RNG | SHIPPED | all gameplay domains routed through `gameplayRandom()` |
| v0.9.51-55 goals/recruiting/development | SHIPPED | |
| v0.10 Game Engine 2 | SHIPPED | interactive, recorded, postseason, 3D replay |
| v0.11 program economy | SHIPPED | |
| v0.11.8 audit maintenance | SHIPPED | source reconciliation + publish guard |
| v0.12 premium client | SHIPPED | milestones A-J of docs/DYNASTY_LAB_PREMIUM_CLIENT_DESIGN_ROADMAP.md |
| v0.12 encyclopedia | NOT STARTED | packet: `09-v012-encyclopedia.md` |
| storage reduction | NOT STARTED | measured in docs/SAVE_SIZE_MEASUREMENT.md |

`SHIPPED` means the packet is in the released source and reachable from the
default branch. The "v0.12" label in the encyclopedia packet is historical; the
actual v0.12 series shipped the client and guidance work instead, so the packet
should be sliced under a new version number.

## Next action

Two bounded options, in the order they were reviewed on 2026-10-25:

1. **History search slice** (from `09-v012-encyclopedia.md`): global search for
   programs, players and coaches; coach index; conference and season pages;
   national timeline; Hall of Fame. Start with search over archives that already
   load lazily, keep stable IDs, and do not change save shape.
2. **Storage reduction**: roll `gameArchive` play-level detail up to box-score
   level after N seasons and roll up never-played retirees, then add a quota
   meter. Re-measure at 10 seasons before claiming a win. Read
   docs/SAVE_SIZE_MEASUREMENT.md and STORAGE.md first.

Do not tune prestige or simulation balance from a single season; the five-season
audit is stable.

## Update protocol

When work begins, change only that row to `IN PROGRESS` and record the branch.
When released, change it to `SHIPPED <version/commit>` and advance Next action.
If a different branch ships overlapping work, mark the packet `RECONCILE`
rather than starting it again.

## Resume prompt

> Read `docs/roadmap/STATUS.md` and only the packet named in Next action.
> Inspect the current default branch before coding. Create a bounded local
> branch, implement one named commit, run its targeted tests, and stop.
> Do not push, publish, deploy, merge, or edit unrelated packets without an
> explicit instruction.
