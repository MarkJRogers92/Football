# Dynasty Lab v0.10.2 — Detailed Game Engine 2 Cutover Status

## Scope

Development-only checkpoint. Production is untouched.

Branch: `codex/v0102-v2-detailed-cutover`

Tested standalone build checkpoint before this note: `48ee2ee5d3b7403935f4170e12f19c3a4b45b777`

## User-facing routing

- **Game Lab → Sim Instantly:** Game Engine 2 transactional recorded-game path.
- **Game Lab → Watch My Next Game:** Game Engine 2, because Watch invokes the same Detailed Game handler and then opens the permanent archive.
- **Dashboard/Season → Sim Week:** legacy `gameSim` path remains unchanged.
- **Dashboard → Sim Regular Season:** legacy simulation remains unchanged.
- The temporary **Record with V2 (Dev)** control is removed after cutover.

## Safety contract

Every permanent v2 Detailed Game first passes the existing dry-run transaction gate. If the permanent commit throws, the rollback snapshot restores the pre-game state, including:

- scheduled game state and archive linkage;
- team W/L, PF/PA and related result state;
- player accumulated statistics;
- player health, wear and injury state;
- rivalry result/event state;
- archive counters and event counters, including the separate event id counter;
- ranking/relevant deterministic state and gameplay RNG.

The rollback regression deliberately injects failure after archive creation and requires exact restoration.

## Validation completed before freeze

Workflow run `34067439377` — **V0.10.2 Cutover Checkpoint** — completed successfully.

Passed gates:

1. Cutover module parse.
2. Game Engine 2 targeted suite.
3. Frozen calibration gate.
4. Standalone build.
5. Permanent recorded-game transaction/rollback browser regression.
6. Six-week permanent v2 recorded-game soak.
7. Normal **Sim Instantly** browser cutover regression.
8. Legacy **Sim Regular Season** isolation regression — twelve user games processed with zero v2 archives.
9. Exact tested standalone `index.html` sync.

The earlier normal validator on the source-only commit failed only because `index.html` was intentionally stale before the helper synchronized the tested build. No game-logic gate failed in that validator.

## Next gate

Run a separate full regular-season soak from this frozen checkpoint. The soak must use the normal Detailed Game handler for all twelve user games, retain unique permanent v2 archives and real-player statistics/play-by-play, reach the conference-championship gate, and verify that drive counts are not fixed across the season.

Do not publish production from this checkpoint.
