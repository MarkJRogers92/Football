# Roadmap execution status

Last reconciled: 2026-10-25, source `857768c` (`v0.12.15`) on
`claude/review-improvement-dwjemy`. History carries the coach index, the champion
timeline and the Hall of Fame; conference pages and the playerArchive rollup are
the named packets. Publish for 0.12.15: run 40256810129. The previous revision of
this file described v0.11.7 and is obsolete.

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
| v0.12 encyclopedia | SHIPPED | Playbook search (v0.12.10), coach index and champion timeline (v0.12.13), Hall of Fame (v0.12.14), conference standings (v0.12.15) |
| storage reduction | MEASURED, NOT STARTED | compaction shipped in v0.9.49; `playerArchive` (+4.1 MB/season) is now the first target |

`SHIPPED` means the packet is in the released source and reachable from the
default branch. The "v0.12" label in the encyclopedia packet is historical; the
actual v0.12 series shipped the client and guidance work instead, so the packet
should be sliced under a new version number.

## Next action

One bounded packet at a time, in this order:

1. **History surfaces** (`09-v012-encyclopedia.md` remainder): coach index,
   conference and season pages, national timeline, Hall of Fame. Search already
   ships; extend the same read-only pattern, keep stable IDs and change no save
   shape.
2. **playerArchive rollup**: retired players who never recorded a meaningful snap
   keep a full `seasonHistory`. Collapse those to career totals while keeping
   awards, draft result, last team and exit reason, then re-measure at ten
   seasons. Read docs/SAVE_SIZE_MEASUREMENT.md and STORAGE.md first.

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
