# Dynasty Lab Team Branding v1 — Claude Implementation Handoff

This branch is based on `claude/review-improvement-dwjemy` at commit `f87056f6f1ae819902f4ddfa64adfc2fec9e723f`, the reconciled v0.9.40 source (148/148 Node and 144/144 browser checks at that base).

## Goal
Integrate the locked Dynasty Lab team branding into the current game without changing simulation logic.

## Asset payload
The repository connector used to stage this branch cannot write binary PNG files directly through the normal contents endpoint, so the compact implementation payload is stored as base64 archive parts under `team-branding-v1/archive-parts/`.

Run:

```bash
python3 team-branding-v1/unpack_assets.py
```

That reconstructs and extracts the compact branding pack into `team-branding-v1/extracted/`.

The staged compact pack contains:
- all 120 canonical team logos as transparent 32×32 PNGs;
- numeric `teamId` manifest in JSON and CSV;
- the `team-logos.js` lookup helper;
- the `team-logos.css` helper;
- validation metadata;
- README / implementation notes.

The full production pack also exists outside this branch with 512/256/128/64/32 variants. **For this implementation pass, wire the asset system by numeric team ID using the staged 32px files. Keep the lookup/path layer size-aware so higher-resolution files can be dropped in later without rewriting the UI integration.**

## Hard rules
1. Use numeric `teamId` as the canonical logo key. Never match logos by school-name strings.
2. Do not rename, substitute, regenerate, or remap any team.
3. Preserve the existing 120-team / 10-conference universe exactly.
4. Do not alter simulation/gameplay logic in this branding pass.
5. Add a graceful fallback for missing/broken logo assets.
6. Keep the work bounded and separately committed from unrelated polish.

## Recommended integration order
1. Central logo-path/helper layer.
2. Team/school header and team profile.
3. Standings and rankings.
4. Schedule/results and Game Center matchup headers.
5. Conference pages.
6. Recruiting school-interest / commitment surfaces.
7. Postseason and history surfaces where space permits.

## Display guidance
- 24–32px: standings, rankings, schedule rows, compact recruiting surfaces.
- 40–64px: standard cards and matchup headers. The staged 32px assets may be temporarily scaled while integration is validated, but structure the helper so 64/128 assets can replace them without code changes.
- Use `object-fit: contain`; do not crop marks into circles by default.

## Validation required
- all 120 numeric IDs resolve;
- no duplicate ID mapping;
- broken-image fallback works;
- existing full Node/browser test suites pass;
- inspect team page, standings, rankings, schedule, Game Center, recruiting and conference views at desktop and mobile widths.

Leave a continuation note listing files changed, tests run, any intentionally deferred surfaces, and exactly where the logo helper is consumed.