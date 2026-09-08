# Dynasty Lab Team Helmet Icons — Asset Handoff

Base: `claude/review-improvement-dwjemy` at `c54537d` (v0.11.5, current production).

## Why this is split into phases
This work spans two different environments and neither can do the other's half:

- **Phase 1 (render)** needs a running Blender instance with the Blender MCP
  plugin connected — that only exists in your **local** Claude Code session.
- **Phase 2 (integrate)** needs this **repo** (app.js, tests, `tools/build.js`,
  `tools/publish.js`) — no Blender required, any Claude Code session with
  repo access can do it, including a fresh one or GPT.

Run Phase 0 once (either environment, no Blender needed), then Phase 1
locally, then hand the two output files to whoever does Phase 2.

## Goal
Turn one 3D helmet model into 120 per-team recolored 2D helmet icons, packed
into an atlas PNG, and wire it into Dynasty Lab as `teamHelmetHTML()` —
mirroring the existing `teamLogoHTML()` / `assets/team-logos-atlas-32.png`
pattern exactly (see `app.js` around line 2753 for the precedent this
follows). No simulation logic changes in any phase.

## Phase 0 — Export the team color manifest (no Blender, run anywhere)
Team colors already exist in `app.js`'s `schoolColors(school)` /
`ensureSchoolColors(t)` and are exposed for reuse via
`tools/harness.js`'s `loadEngine()`. Run a small one-off Node script that:

1. `const {loadEngine} = require('./tools/harness.js'); const e = loadEngine({seed:1});`
2. `await e.loadSchools();`
3. For each of the 120 teams, call `e.ensureSchoolColors(team)` and record
   `{id: team.id, name: team.name, primary: team.primary, secondary: team.secondary}`.
4. Write the 120 entries to `team-colors.json` (array, sorted by numeric `id`
   1–120, no gaps, no duplicates).

Hand `team-colors.json` to whoever runs Phase 1. Do not hand-derive colors
in Blender — they must come from this exact source so they match the colors
already shown elsewhere in the app (jersey previews, `--team-primary` /
`--team-secondary` CSS custom properties, etc).

## Phase 1 — Render the atlas (local session, Blender MCP connected)
Inputs: the helmet `.blend`/model file (yours, already built) and
`team-colors.json` from Phase 0.

1. Load the model. Identify which material slot(s) map to the shell
   (`primary`) and which map to facemask/trim (`secondary`); leave
   chrome/screws/neutral materials untouched.
2. For each of the 120 teams in `team-colors.json`, apply `primary` to the
   shell material and `secondary` to the trim material, then render one
   icon: fixed camera angle (pick one — e.g. 3/4 front-left — and use the
   *same* angle for all 120), transparent background, square canvas.
3. Pack the 120 renders into one atlas PNG using the **same layout rule**
   as the logo atlas: row-major, 12 columns × 10 rows, numeric team id 1
   at row 0/col 0, id 120 at row 9/col 11, one fixed cell size (pick a
   size that reads well at small UI scale — 64px cells is a reasonable
   default; do not use 32px, a helmet needs more resolution than a flat
   crest to read).
4. Save as `assets/team-helmets-atlas-64.png` (adjust the number in the
   filename to whatever cell size you actually used, matching the existing
   `team-logos-atlas-32.png` naming convention).
5. Also save a small `team-helmets-manifest.json` recording: atlas filename,
   cell size, columns, rows, camera/render settings used (for regenerating
   later at higher res), and confirmation that all 120 ids were rendered
   with no duplicates or gaps.

Hand `assets/team-helmets-atlas-64.png` + `team-helmets-manifest.json` to
whoever runs Phase 2.

## Phase 2 — Wire it into Dynasty Lab (repo session, no Blender needed)
1. Drop the atlas PNG under `assets/` (already auto-copied to every publish
   target by `tools/publish.js`'s recursive `assets/` copy — no build step
   changes needed).
2. Add a `teamHelmetHTML(teamId, size=24, extraClass='')` helper right next
   to `teamLogoHTML` in `app.js`, same structure:
   - numeric `teamId` only, never school-name strings;
   - same invalid-id fallback pattern (`team-logo--fallback` equivalent);
   - same `background-position`/`background-size` math, using the atlas's
     actual cell size and column/row count from the Phase 1 manifest.
3. Pick **one** surface to introduce it on first (team profile header is
   the natural choice, matching where `teamLogoHTML(u.id,48)` already
   renders in `render()`) rather than touching every surface `teamLogoHTML`
   appears on in one pass.
4. Do not remove or replace any existing `teamLogoHTML` usage — this adds a
   second, optional asset, it does not migrate the crest system.

## Hard rules (same as v1 team branding)
1. Numeric `teamId` is the only key. Never match by school-name string.
2. Do not rename, substitute, regenerate, or remap any team.
3. Preserve the existing 120-team universe exactly.
4. Do not alter simulation/gameplay logic in any phase.
5. Graceful fallback for missing/broken atlas load, same as `teamLogoHTML`.
6. Keep Phase 2 bounded and committed separately from unrelated changes.

## Validation required (Phase 2, before commit)
- All 120 numeric ids resolve to the correct row/col; no duplicates, no gaps.
- Invalid id (0, 121, non-numeric) falls back cleanly, no broken image.
- Existing full Node test suite (`npm test`) still passes unchanged.
- Inspect the chosen surface in a real browser at desktop and mobile width;
  confirm no layout shift or overflow versus the existing crest.

Leave a continuation note (commit message or a short doc update) listing:
which surface(s) got `teamHelmetHTML`, what was validated, and what was
intentionally left for a later pass.
