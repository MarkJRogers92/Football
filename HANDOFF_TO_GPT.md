# Handoff — Dynasty Lab

## State

- Repository: `MarkJRogers92/Football`
- Branch: `claude/review-improvement-dwjemy`
- Pushed HEAD: see `git log -1` on that branch; this handoff was committed on top of `a84de25`.
- Version: **v0.9.49, published**. Production `gh-pages` = `bdcf0d2`.
- Immediate rollback production commit: `23e8aeb` (v0.9.49 pre-slot build).
- Working tree: clean at time of writing.

Checkpoints in the previous instruction were confirmed exactly: source `a84de25`,
production `bdcf0d2`, rollback `23e8aeb`. No newer or overlapping work existed on
any other branch.

## Phase 1 review of v0.9.49 — result

**No definite defect found.** The save/storage work is sound and, for the first
time, has been verified in a real browser.

### What was inspected

Code read directly: the full `storage.js` diff (slot ids, `listSlots`, `rename`,
`summaryFromSnapshot`, meta writes inside the save transaction), the full `app.js`
diff (per-slot `browserArchives` map, `setActiveSaveSlot`, `writeBrowserSave`
checkpoint types, `gamesDirty` rewrite path, occupied-slot confirm, title-screen
slot wiring), `body.html` slot controls, and the `polish.css` mobile rules.

Driven in Chromium at 1280px and 390px (the check GPT could not run):

- Three slots listed in both the title Load panel and the in-app header: **yes, 3 each.**
- Rename: **works**, list re-renders as `My Program · Empty`, status confirms.
- Two dynasties saved to different slots, then the first reloaded: returned
  **Week 0**, not the other slot's Week 1 — **archive chunks are not mixed.**
- Overflow: `#titleLoadPanel` 0px, `.topbar` 0px, document 0px at **both** widths.
- Console errors: **none** at either width.

Verified by inspection rather than execution: legacy `main` migration (covered by
an existing passing test), cross-tab revision scoping (`expectedRevision` is read
from `saves.get(slot)`, so it is per-slot by construction), and the compaction
rewrite path (`offseasonPreseason` sets `gamesDirty`, which makes
`writeBrowserSave` pass `gameRef:null` for one full rewrite — without this the
browser DB would keep pre-compaction rows while memory looked smaller).

### Tests actually run, with exact results

- `npm run test:browser`: **169/169 pass** (113 browser + 35 visual + 21 recruit-visual), 0 failures.
- `node tools/build.js`: **PASS**, 669 KB standalone.
- Custom Chromium slot-control driver (not committed): **pass**, output above.
- `node --test tests/saveslots.js`: started; see the commit message for its result
  if it completed before this handoff was written.

### Not run, and why

- Full `npm test` Node suite: not rerun. It takes ~17 minutes and the prior agent
  reported it emitting many passes then going quiet. Targeted suites were used
  instead. **This is the largest open verification gap.**
- Multi-season persisted-compaction rerun: previously passed; not repeated to
  conserve credits.

## Prioritized suggestions

**Must fix** — nothing. No defect was found.

**High-value next**
1. Find out why the full Node runner goes quiet. Run
   `npm test 2>&1 | tee /tmp/full.log` and inspect the tail. It may be a slow
   suite rather than a hang, but an unexplained silent runner undermines every
   future release decision.
2. Begin v0.9.50 RNG (below). It is the packet that most reduces future risk.

**Later ideas**
3. Slot delete/duplicate — three slots exist with no way to clear one.
4. Autosave failure surfacing on the title screen, not just the status line.
5. Compaction horizon as an option rather than a constant.

## Next precise task

Start `docs/roadmap/06-v0950-modularization-rng.md`, suggested commit 1 only:
**add the RNG implementation and characterization tests without switching any
callers.** Do not route gameplay randomness yet.

Begin with: `git checkout -b claude/v0950-modularization-rng a84de25` (or current
branch head), then create `tests/rng.js`.

Constraints from the packet that matter: keep the standalone `index.html` build,
do not change random-number consumption while extracting, keep non-game IDs on
Web Crypto, and keep recap text on its existing isolated hash stream.

## Traps that do not announce themselves

All of these cost real time and none of them throw.

**A headless season rollover stops for three separate reasons, silently.**
`runOffseason()` advances a *single phase* of the v0.9.46 calendar. The camps must
run *when the calendar reaches them* — calling `runSpringCamp()` early leaves the
phase flag unset and it blocks on `spring` forever. A pending job offer halts
everything until `acceptPost()` answers it (deliberate, from v0.9.28). A fixed
call order just stops advancing after ~six seasons. Copy `rollSeason` from
`tests/scheduling.js`, including its throw-if-the-year-did-not-advance guard.

**Measure before implementing a storage or size change.** The v0.9.49 packet asked
to compact drive/play detail; zero routine games carry any, so it would have been
a no-op. An earlier packet claimed 4 MB/season when the real figure was 11.4.

**`storageOperation` returns silently when the store is busy.** Autosave made this
reachable and the Load button silently did nothing. Background writers must yield
to user actions — see `yieldToUserAction()`.

**A cursor-based delete removes rows written later in the same IndexedDB
transaction.** `clear()` is atomic; a cursor is not. Delete known keys instead.

**`app.js` is wrapped in an IIFE.** Nothing is on `window`; browser tests must
drive real UI, not `page.evaluate` into engine functions.

**Presentation is layered and later files win.** `sports-presentation.js` rewrites
DOM `app.js` rendered — it once clipped real team logos to 1px. Presence in the
DOM is not visibility; assert computed style or screenshot.

**Narrow-width rules in `sports-presentation.css` are fragile.** Two live bugs came
from there: an unconditional rule after a media query defeating it at equal
specificity, and an entry animation starting cards outside a clipping container.

## How to work here

- `node tools/build.js` refuses to build if `VERSION.txt`, `APP_VERSION` in
  `app.js` and `package.json` disagree. Bump all three together.
- `npm test` is Node; `npm run test:browser` needs Chromium and is **not
  optional** — it has caught two bugs that reached production because a previous
  agent could not run it.
- `node tools/publish.js` publishes production and refuses to reuse a version
  number already shipped from different source.
- Do not reuse `0.9.49` for different production content. Do not merge
  `claude/v0950-*` into the source branch or touch `gh-pages` without explicit
  authorization.
