# Roadmap execution status

Last inspected source: `dc3c76c` (`0.9.44`)

| Packet | Status | Active branch | Blocking decision |
| --- | --- | --- | --- |
| v0.9.45 stabilization | IN PROGRESS · commits 1-3 complete | `codex/v0945-stabilization` | Browser binary unavailable locally |
| v0.9.46 offseason calendar | VALIDATED · commits 1-5 complete, browser suites now pass | `claude/review-improvement-dwjemy` (merged) | None — ready to release |
| v0.9.47 transfer portal | IMPLEMENTED · commits 1-5 complete, validated | `claude/review-improvement-dwjemy` | None — unpublished with v0.9.46 |
| v0.9.48 schedules/rivalries | READY | — | None after v0.9.45 |
| v0.9.49 saves/storage | READY | — | Set storage target after measurement |
| v0.9.50 modules/RNG | READY | — | Preserve standalone build |
| v0.10 Game Engine 2 | READY FOR SLICING | — | Begin only after v0.9.50 |
| v0.11 program economy | READY FOR SLICING | — | Creation-budget tuning |
| v0.12 encyclopedia | READY FOR SLICING | — | Begin after archive contracts stabilize |

`READY` means the packet can begin as one bounded release. `READY FOR SLICING`
means the major version has an implementation contract and pre-defined release
slices, but the whole major version must not be attempted in one branch.

## Next action

Browser validation is no longer pending — it ran on a Chromium-equipped
environment and is recorded in `V0946_VALIDATION.md`, including one real
mobile-layout bug it caught (live since v0.9.44) and the fix for it.
`codex/v0946-offseason-calendar` is merged into
`claude/review-improvement-dwjemy` and the full Node + browser suites pass on
that head.

v0.9.47 (interactive transfer portal) is now implemented across all five of
its packet commits and validated: 196/196 Node, 169/169 browser, plus a
Chromium walkthrough of the Portal subview at 1280px and 390px. See the
v0.9.47 section of `CHANGELOG.md` for the design decisions worth knowing
before extending it.

Next: `04-v0948-scheduling-rivalries.md`.

**Blocked on the owner, not on code:** neither v0.9.46 nor v0.9.47 has been
published. `node tools/publish.js` is refused by this environment's permission
classifier, so a human has to run it (or allow it in settings). Everything is
committed and pushed; VERSION.txt reads 0.9.46, so bump it before publishing
if v0.9.47 is meant to ship under its own number.

## Current validation checkpoint

- `npm run verify:release`: PASS on clean commit `49089ac`.
- Headless simulation smoke: 53 PASS, 0 FAIL.
- Node regression runner: 130 tests passed; eight storage-backed files initially
  could not load because the ignored local `fake-indexeddb` dependency was
  absent. After `npm install --no-package-lock`, those eight files ran 35 tests:
  35 PASS, 0 FAIL.
- Five-season simulation audit: PASS through 2031.
- Workflow YAML parse and shape check: PASS for `validate.yml` and `publish.yml`.
- Browser UI, visual, and IndexedDB suites: NOT RUN; no Chromium executable is
  available in this environment.

Release metadata remains intentionally unprepared until the browser suites pass.

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
