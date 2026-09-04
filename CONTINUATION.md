# Dynasty Lab — v0.9.17 checkpoint

Repository: https://github.com/MarkJRogers92/Football
Current source branch: `claude/commercial-polish-pass` (merged into the main
working branch `claude/review-improvement-dwjemy`)
Production branch: `gh-pages`
Production: v0.9.17 at https://markjrogers92.github.io/Football/

## Current release

v0.9.17 is a presentation-only commercial polish pass on top of v0.9.13 (the
weekly plan). No simulation, storage, schema or save-format changes.

- Dashboard: one program masthead, a command center split into the weekly
  plan checklist and "the wire" (urgency-ordered hub tiles), Top 15 with team
  marks and the controlled row highlighted.
- A shared design system (`polish.css`, loaded last in the build): tokens,
  card/button/chip variants, table density, portrait frames, grouped tabs,
  a compact 390px header.
- Player/recruit profiles reorganized into sections; recruiting board gets
  chips, gold stars, weighted columns; Game Center gets a real scoreboard.
- Fixed during review: the Signing Class card's "of 30 slots" was a leftover
  flat constant from before v0.9.11 made scholarship capacity dynamic per
  program. It now reads the real number, and the component's memoized
  re-render (which was silently dropping the fix on its first pass) now keys
  on capacity so it can't go stale like that again.

## Validation checkpoint

- 53/53 engine smoke checks;
- 76/76 Node tests across all suites;
- 133 desktop + iPhone-layout browser checks (99 + 13 + 21 across the three
  Chromium suites);
- direct Playwright screenshots at 1280px and 390px of Dashboard, Staff,
  Recruiting and Game Center, reviewed for real rendering rather than trusting
  the polish pass's own audit doc.

## Not addressed in this release

Hub tile order still follows CSS `order` per type rather than the engine's
`importance` values (see "Next roadmap sequence" below — this is recommended
milestone A). Roster/Season/Stats/Development tabs received only the shared
design system, no screen-specific hierarchy work. The 390px header is still
three rows (title, program picker, five save buttons). Staff cards have no
coach portraits. These are cosmetic gaps, not simulation gaps.

## Diverged branches not yet reconciled

Three GPT/codex feature branches exist in preview, based on the same v0.9.13
checkpoint as this polish pass but NOT including it, and not yet merged into
the working branch:

- `codex/v0914-coachs-desk` (v0.9.14)
- `codex/v0915-player-agency` (v0.9.15)
- `codex/v0916-scouting-intelligence` (v0.9.16)

None of these are in production. Before starting new work, check whether they
still exist and are worth pulling forward — they will need rebasing onto
v0.9.17 (this polish pass touches body.html/app.js markup broadly, so expect
conflicts) or reconciling feature-by-feature. Read each branch's own log/docs
before assuming its state.

## Storage guardrail

Read `STORAGE.md` before altering saves. v0.9.17 touches no save-affecting
code at all — presentation only. IndexedDB remains schema 3.

## Next roadmap sequence

### A) Hub priority + story surface (recommended)
`buildWeeklyHub` takes `items.slice(0, 9)` in insertion order despite every
event already carrying an `importance` value. Sort by it. Then add record-chase
alerts and a player career chronology from data already stored
(`seasonHistory`/`transferHistory`/`promises`/`awards`) — the unbuilt "story
surface" slice from `ROADMAP_V09.md`.

### B) Live-league save size
The game archive is solved (v0.9.12). Remaining growth (~4 MB/season) is
`universe.events` and per-player `seasonHistory` across 120 teams. Measure
before touching anything.

### C) 14-tab coherence
The weekly plan (v0.9.13) and this polish pass covered the worst of it. What
remains is the tab surface itself — grouping, or a first-run path.

## Resume prompt

Continue Dynasty Lab from `MarkJRogers92/Football`. Read `CONTINUATION.md`,
`STORAGE.md`, `CHANGELOG.md` and `WORKLOG.md`. v0.9.17 (commercial polish) is
production. Before new work, check whether `codex/v0914-16` still exist and
decide whether to pull them forward — see "Diverged branches" above. Work in
a new bounded branch, validate fully (`npm test` + `npm run test:browser`),
update CHANGELOG/WORKLOG/STORAGE/CONTINUATION, publish a preview first, then
promote only after review.
