# v0.12 — Encyclopedia and Living Universe

## Goal

Expose the history already produced by the simulation through indexed,
searchable pages without increasing simulation complexity.

## Surfaces

- Program pages: all-time record, titles, bowl history, records, coaches,
  recruiting classes, draft results and rivalry series.
- Player index: active/archived search, position/year/team filters, season and
  career leaders, awards, draft and transfer chronology.
- Coach index: jobs, records, titles, protégés, tree and relationship history.
- Conference pages: champions, standings by season and interconference results.
- National timeline: champions, award winners, major games, record changes and
  notable upsets.
- Hall of Fame: deterministic qualification from awards, production, records and
  championships, with no user-facing hidden score.

## Data strategy

Prefer derived views over duplicated prose. Add compact indexes only where a
measured query is slow. Archived IDs remain canonical; name snapshots are display
history. Hydrate only the section required by the opened page.

## Search and navigation

Use one global search box for teams, players and coaches. Every result links to
the existing profile/dialog or new program/conference page. Preserve browser back
behavior if routing is introduced; do not require a framework.

## Suggested delivery slices

1. v0.12.0: global search and program encyclopedia.
2. v0.12.1: player/coach indexes and leaderboards.
3. v0.12.2: conference pages and national timeline.
4. v0.12.3: Hall of Fame, lazy indexes and mobile polish.

## Acceptance tests

- Every stored player, coach, program and game remains reachable by stable ID.
- Deferred archives load once and do not duplicate rows.
- Record holders link even after transfers, retirement or program rename.
- Filters return the same results before and after export/import.
- Ten-plus-season histories remain usable on a narrow mobile viewport.

## Exit criteria

A long dynasty can answer who played, coached, won, transferred, set records and
changed programs without scanning raw logs, and the new views do not materially
increase save size.

## Non-goals

No external database, online leaderboard, real player data or social sharing.

