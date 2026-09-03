# WORKLOG

Running log for the v0.8.1 follow-up work list. One entry per item: plan,
decisions a successor would otherwise re-derive, outcome, test result.
`npm test` is the gate; `npm run build` regenerates `index.html` before every
commit (index.html is generated — never hand-edit it).

## Item 1 — mobile cards for recruiting and development tables

Plan: add `stacked-table` to the `#recruiting` and `#development` sections in
body.html and `data-label` to every `<td>` in `renderRecruiting` and the
`trainingBody` rows in `renderDevelopment`. CSS in styles.css already handles
the rest below 700px.

Decisions:
- The Stats tab has no `<table>` — leaders are `.leader-row`/`.lineitem` divs
  that already stack. REVIEW.md §3.1 lists "stats" among the tables needing
  the treatment; that is wrong, nothing to do there.
- The first column of both tables is labelled `Player` in `data-label` (the
  recruiting header says "Recruit") so the existing
  `td[data-label="Player"]` full-width rule applies to the name cell.
- `.stacked-table td:empty::before` hides the label on the empty action cell;
  the recruiting Visit/Promise/Target controls are given labels so they read as
  fields on the card.

Outcome: done. `npm test` 46/46, `npm run test:browser` 43/43 (desktop + iPhone).

## Item 2 — Weekly Command Center items link to their tab

Plan: hub items built in `buildWeeklyHub`/`buildPreseasonHub` carry a `tab`
(and optionally `player`/`recruit` id). `renderWeeklyHub` renders those as
clickable cards (`.hub-link`, keyboard-operable) that call `goToTab(tab)`
and open the player/recruit profile dialog when an id is attached.

Decisions:
- `goToTab(id)` is a new helper that does what the nav button click handler
  does (toggle nav + section `.active`, `setActiveTab`) so hub links behave
  exactly like clicking the tab. Use it for any future deep link.
- Mapping: FINAL/RANKINGS → season; MEDICAL/LOCKER ROOM → roster + player
  dialog; COMMITMENT/TOP TARGET → recruiting + recruit dialog; NEXT UP →
  gamelab; preseason ROSTER → depth, RECRUITING → recruiting, REDSHIRTS →
  roster.
- Hub items persisted in older saves have no `tab` and simply render
  non-clickable; nothing to migrate.
- Browser test gains a check that clicking a hub link activates its tab.

Outcome: done. `npm test` 46/46, `npm run test:browser` 45/45 (two new checks).
