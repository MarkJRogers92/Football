# Handoff — Dynasty Lab, v0.9.49

Written for the next agent picking this up. Branch `claude/review-improvement-dwjemy`,
which is where all of this lives and where production is published from.

## Where things stand

Shipped and live this session: **v0.9.47** (interactive transfer portal),
**v0.9.48** (schedule rotation and protected rivalries). **v0.9.49** (three named
save slots, autosave, automatic game compaction) is complete; publish status is in
`docs/roadmap/STATUS.md`.

Roadmap packets live in `docs/roadmap/`. STATUS.md names the next one and is the
file to trust over any prose elsewhere, including this one.

## Read these before touching anything

- `docs/roadmap/STATUS.md` — what is done, what is next.
- `CHANGELOG.md` — the top three entries carry the design reasoning, not just a
  feature list. The v0.9.48 entry in particular records traps that will cost you
  an hour each if you rediscover them.
- `docs/SAVE_GROWTH_V0949.md` — the storage measurement and the target it set.

## Traps that do not announce themselves

These all cost real time this session. None of them throw.

**A headless season rollover stops for three separate reasons, silently.**
`runOffseason()` advances a *single phase* of the v0.9.46 calendar, not a whole
offseason. The camps must run *when the calendar reaches them* — calling
`runSpringCamp()` early leaves the phase flag unset and the calendar blocks on
`spring` forever. And a pending job offer halts everything until `acceptPost()`
answers it (that block is deliberate, from v0.9.28). A fixed call order just
stops advancing after about six seasons. `rollSeason` in `tests/scheduling.js` is
the correct phase-driven pattern; copy it rather than writing your own, and keep
its throw-if-the-year-did-not-advance guard. A multi-season test without that
guard will quietly measure half of what it claims.

**Measure before implementing a storage or size change.** The v0.9.49 packet
asked for compaction of drive/play detail. Zero routine games carry any: only the
Game Lab's detailed engine produces drives, so a dashboard-simmed game has an
empty `drives` array. Implementing it literally would have been a no-op that
looked like progress. The same thing happened to an earlier roadmap item that
claimed 4 MB/season when the real figure was 11.4.

**`storageOperation` returns silently when the store is busy.** That was harmless
while only the user could trigger a save. Autosave made it reachable and the Load
button started doing nothing at all, with no message. Anything new that writes in
the background must yield to user actions — see `yieldToUserAction()`.

**A cursor-based delete removes rows written later in the same IndexedDB
transaction.** The cursor is still walking while your puts queue behind it.
`clear()` is atomic and does not have this problem. If you need to delete a
subset, issue deletes for known keys.

**`app.js` is wrapped in an IIFE.** Nothing is on `window`. Browser tests must
drive the real UI; you cannot call engine functions from `page.evaluate`.

**Presentation is layered and later files win.** `sports-presentation.js` rewrites
DOM that `app.js` rendered — it clipped the real team logos to 1px and replaced
them with its own initials badge, so the logo was in the DOM but never visible.
Presence in the DOM is not the same as visible on screen; assert on computed
style or a screenshot when it matters.

**Narrow-width rules in `sports-presentation.css` are fragile.** Two separate live
bugs came from there: an unconditional rule placed after a media query silently
defeated it at equal specificity, and an entry animation started cards outside a
container that clips. Check the cascade *and* the animations together.

## How to work here

- Build is `node tools/build.js`; it concatenates sources into `index.html` and
  refuses to build if `VERSION.txt`, `APP_VERSION` in `app.js` and
  `package.json` disagree. Bump all three together.
- `npm test` is the Node suite, `npm run test:browser` needs Chromium. Both must
  pass before publishing. The browser suite is not optional — it has caught two
  bugs that shipped to production because a previous agent could not run it.
- `node tools/publish.js` publishes production; `--preview NAME` publishes a
  preview. It refuses to republish a version number that already shipped from
  different source, which exists because two agents once overwrote each other.
- Write tests that assert *why* something matters, not just that it runs. When a
  test's assumption is invalidated by real work, update it to check the new
  invariant rather than loosening it.

## Suggested next work

`docs/roadmap/STATUS.md` names the next packet. v0.9.49 commit 2 and automatic
season-boundary compaction are finished. The compaction path deliberately loads
deferred games before rollover and marks their append-only chunks for one atomic
rewrite; removing that dirty-rewrite path would make memory look compacted while
IndexedDB silently retained the larger rows.

If you disagree with a roadmap packet after measuring, say so and bring the
numbers rather than implementing something you know will not work. That happened
twice this session and both times the measurement was right and the packet was
wrong.
