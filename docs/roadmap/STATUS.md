# Roadmap execution status

Last inspected source: `77877e9` (`v0.11.4`), published and live on `gh-pages`.
This file had drifted several releases behind actual `git log` — trust
`CHANGELOG.md` and `git log --oneline` over this table's history, only the
current row states are being asserted here.

| Packet | Status | Active branch | Blocking decision |
| --- | --- | --- | --- |
| v0.9.45 stabilization | MERGED | `claude/review-improvement-dwjemy` | None |
| v0.9.46 offseason calendar | SHIPPED | `claude/review-improvement-dwjemy` | None |
| v0.9.47 transfer portal | SHIPPED | `claude/review-improvement-dwjemy` | None |
| v0.9.48 schedules/rivalries | SHIPPED | `claude/review-improvement-dwjemy` | None |
| v0.9.49 saves/storage | SHIPPED `bdcf0d2` | `claude/review-improvement-dwjemy` | None |
| v0.9.50 modules/RNG | SHIPPED — RNG infra + all 4 gameplay domains routed through `gameplayRandom()` | `claude/review-improvement-dwjemy` | None |
| v0.9.51-55 season goals/recruiting/development | SHIPPED | `claude/review-improvement-dwjemy` | None |
| v0.10 Game Engine 2 | SHIPPED | `claude/review-improvement-dwjemy` | None |
| v0.11 program economy | SHIPPED `77877e9` (`v0.11.4`, current production) | `claude/review-improvement-dwjemy` | None |
| v0.12 encyclopedia | READY FOR SLICING | — | Not started |

`READY` means the packet can begin as one bounded release. `READY FOR SLICING`
means the major version has an implementation contract and pre-defined release
slices, but the whole major version must not be attempted in one branch.

## Next action

`docs/roadmap/09-v012-encyclopedia.md` is the only unstarted packet with a
written contract. Read it before beginning; no branch has touched it yet.

## Most recent check (v0.11.4)

Build, `tests/version.js`, and a static sweep (no merge-conflict markers, no
duplicate `function` declarations, no debug statements) passed on `77877e9`.
The full `npm test` suite was not run for this check — same open gap noted
below. Full suite + browser suite are still owed before the next release.

## Current validation checkpoint (historical, pre-v0.10 — kept for provenance only)

- `npm run verify:release`: PASS on clean commit `57ccef7`.
- Headless simulation smoke: 53 PASS, 0 FAIL.
- Node regression runner: 130 tests passed; eight storage-backed files initially
  could not load because the ignored local `fake-indexeddb` dependency was
  absent. After `npm install --no-package-lock`, those eight files ran 35 tests:
  35 PASS, 0 FAIL.
- Five-season simulation audit: PASS through 2031.
- Workflow YAML parse and shape check: PASS for `validate.yml` and `publish.yml`.
- New focused save-slot, autosave and persisted-compaction tests: PASS.
- Full Node runner: 53/53 smoke checks plus the emitted regression checks passed
  without a reported failure; the runner was stopped after it ceased producing
  output for several minutes.
- Browser UI/visual suites: **169/169 PASS** (113 browser + 35 visual + 21
  recruit-visual) on `a84de25` with Chromium available. This is the first browser
  run against v0.9.49.
- v0.9.49 slot controls driven in Chromium at 1280px and 390px: three slots listed
  in both the title panel and the header, rename works, two dynasties saved to
  separate slots reload without mixing archive chunks, zero horizontal overflow on
  `#titleLoadPanel`, `.topbar` and the document at both widths, no console errors.
- Full `npm test` Node runner: still NOT rerun this session. Largest open
  verification gap; see HANDOFF_TO_GPT.md.

Release metadata is prepared at v0.9.49.

## Update protocol

When work begins, change only that row to `IN PROGRESS` and record its branch.
When released, change it to `SHIPPED <version/commit>` and advance Next action.
If a different branch ships overlapping work, mark the packet `RECONCILE` rather
than starting it again.

## Resume prompt

> Pull the latest `MarkJRogers92/Football` source and read
> `docs/roadmap/README.md`, `docs/roadmap/STATUS.md`, and only the packet named in
> STATUS's Next action. Compare the recorded baseline with the current default
> branch. If overlapping work exists, stop and report it. Otherwise create a
> bounded local branch, implement only the next named commit, run its targeted
> tests, and stop for review. Do not push, publish, deploy, merge, or edit
> unrelated roadmap packets.
