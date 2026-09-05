# Dynasty Lab Team Branding v1 — Claude Implementation Handoff

This branch is based on `claude/review-improvement-dwjemy` at commit `f87056f6f1ae819902f4ddfa64adfc2fec9e723f`, the reconciled v0.9.40 source. That base reported 148/148 Node and 144/144 browser checks.

## Goal
Integrate the locked Dynasty Lab team branding into the current game without changing simulation logic.

## What is staged on this branch
The GitHub connector used to stage this work cannot directly write binary PNG repository files through its normal contents endpoint. To avoid blocking implementation, the 120 official 32px logos are packed into one compact transparent PNG atlas and stored as four base64 text parts.

Run:

```bash
python3 team-branding-v1/unpack_assets.py
```

This reconstructs:

```text
team-branding-v1/team-logos-atlas-32.png
```

Atlas specification:
- 384 × 320 PNG
- 12 columns × 10 rows
- 32 × 32 pixels per team
- row-major by canonical numeric `teamId`
- ID 1 = row 0 / column 0
- ID 120 = row 9 / column 11

Also staged:
- `team-branding-v1/team-logo-map.compact.json` — authoritative ID/name/conference mapping for all 120 schools
- `team-branding-v1/team-logo-sprite.js` — framework-free reference helper for atlas coordinates / CSS background positioning
- `team-branding-v1/atlas-parts/part-00.b64` through `part-03.b64` — reconstructable atlas payload

The full production asset pack exists separately with transparent 512/256/128/64/32 PNGs for every team (600 files total). For this implementation pass, **use the staged 32px atlas to wire the game now, but keep the logo abstraction size-aware so 64/128/256 assets can replace the staging atlas later without rewriting UI surfaces.**

## Hard rules
1. Use numeric `teamId` as the canonical logo key. Never map by school-name strings.
2. Do not rename, substitute, regenerate, or remap a team.
3. Preserve the existing 120-team / 10-conference universe exactly.
4. Do not alter simulation/gameplay logic in this branding pass.
5. Add a graceful fallback for an invalid ID or missing atlas.
6. Keep branding work separately committed from unrelated gameplay/polish work.

## Suggested implementation
Use a central helper rather than embedding atlas math throughout the UI. `team-logo-sprite.js` documents the coordinate calculation:

```text
index = teamId - 1
col = index % 12
row = floor(index / 12)
```

For rendered size `S`:

```text
width / height: S
background-size: (12*S)px (10*S)px
background-position: -(col*S)px -(row*S)px
```

If the existing app architecture makes another helper shape cleaner, adapt it; the numeric-ID mapping and atlas ordering are the invariant.

## Recommended integration order
1. Central team-logo helper / component.
2. Team/school header and team profile.
3. Standings and rankings.
4. Schedule/results and Game Center matchup headers.
5. Conference pages.
6. Recruiting school-interest / commitment surfaces.
7. Postseason and history surfaces where space permits.

## Display guidance
- 24–32px: standings, rankings, schedule rows, compact recruiting surfaces.
- 40–64px: matchup headers and standard cards can temporarily scale the staging atlas, but preserve the ability to swap in the higher-resolution pack later.
- Do not crop the marks into circles by default.
- Keep logos visually centered with consistent reserved space so rows do not jump when a mark has a different silhouette.

## Validation required
- all IDs 1–120 resolve to a logo cell;
- no duplicate or off-by-one mapping;
- invalid-ID fallback works;
- existing full Node/browser test suites pass;
- inspect team page, standings, rankings, schedule, Game Center, recruiting and conference views at desktop and mobile widths;
- spot-check IDs 1, 12, 13, 24, 45, 48, 49, 73, 85, 97, 109 and 120 to catch row-boundary / conference-boundary errors.

## Deliverable / handoff
Commit the integration in a bounded change and leave a continuation note listing:
- files changed;
- surfaces wired;
- tests run and results;
- any intentionally deferred surfaces;
- exact location of the central logo helper;
- whether higher-resolution per-team PNGs are needed for a second pass.
