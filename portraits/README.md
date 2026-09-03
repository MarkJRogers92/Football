# Dynasty Portrait Studio — approved 2.5D prototype

A dependency-free Canvas 2D portrait renderer and interactive visual lab for Dynasty Lab.

## Try it

Open `lab.html` in a browser, or serve this directory with a static server. The UI includes a seed editor, 24 hair styles, seven facial-hair styles, ten skin palettes, eight hair colors, physical sliders, four career comparisons, 24/50/100-player galleries, and portrait/contact-sheet PNG export. All players and school palettes in the Lab are synthetic preview fixtures. Changes are local to the current session; reload resets the editor.

Run `node portraits/test.js` from the Football directory. Run `node portraits/build.js` to create a portable, single-file `portrait-studio.html`; optionally provide an output filename. Edit source files, not the generated HTML.

## Reuse the renderer

Load `renderer.js` before your UI. Browser API: `DynastyPortraits`; Node API: `require('./portraits/renderer')`.

```js
DynastyPortraits.renderPlayerPortrait(
  { portraitSeed: '84723911', portraitVersion: 1, height: 76,
    weight: 258, age: 20, jerseyNumber: 7 },
  { primary: '#174d46', secondary: '#ecb45b' },
  canvas,
  { size: 128, pixelRatio: 1 }
);
```

Height is inches; weight is pounds. Seed zero is valid. Identity is independent of school, age, physique, call order, cache, and gameplay RNG. Named hash/PRNG streams generate stable traits. `deriveIdentity`, `deriveAppearance`, and `drawingCommands` are pure. Serializable commands make golden tests independent of browser pixel antialiasing. Canvas drawing uses procedural block numerals instead of system fonts. Raster caching is an LRU with a 32 MiB pixel budget; gallery rendering yields between batches.

The test suite checks three golden command digests, order independence, RNG stream separation, input round trips, aging/transfer identity, effective cache keys, eviction, immutable inputs/no gameplay RNG, invalid data/zero seed, version rejection, a fixed 100-seed diversity sample, and all 240 hair/skin combinations.

## Scope and next integration work

This is a visual prototype. It does **not** yet change the Football simulation, live rosters, recruiting UI, save migrations, or archive records. Only the self-contained `portraits/` directory is added to the repository. No game files are changed. See `HANDOFF.md` in this directory for the approved direction and continuation steps.

The preview accepts a stable player ID as a read-only seed fallback. Production integration must persist `portraitSeed` and `portraitVersion` at creation/migration, transfer those values from recruit to signed player, preserve them in `archiveRecord`, and use archived physical/team context for historical views. Missing IDs currently use one placeholder identity; production migration must provide a stable distinct ID. No migration is implemented here.

Existing source inspection found roster height/weight and eligibility fields, but recruits did not contain height/weight. Recruiting-to-roster continuity needs an explicit physical profile and seed mapping; do not call the roster generator and lose recruit identity. School colors/jersey numbers need an adapter to actual game fields. Preview palettes are not verified school branding.

Age currently changes neck thickness and age-appropriate facial hair. Broader facial maturation and deterministic between-season haircut changes remain future refinement. The four career examples use a fixed 6′4″ physical-growth scenario for easy comparison, independent of the editor's height/weight sliders. Manual appearance overrides also apply to the career examples.

Version 1 is preproduction and still being visually tuned. Freeze its trait and drawing behavior before assigning persistent production identities. Later incompatible changes need a new version and retained old-version support. Unknown versions currently throw explicitly.

## Verification in this session

- 13 portrait tests passed in Node 24 after removing the rejected pixel variants. Original geometry golden tests pass unchanged.
- In-app Chromium rendered the editor and 100-player gallery. One partially warm 100-player run took 26 ms and used 7.5 MiB of cached pixels; this is an observation on this Mac, not a cold benchmark or cross-device guarantee.
- Visual review covered large portraits, career comparisons, roster thumbnails, and a gallery with identical jerseys. Hairstyle, uniform, weight and reset controls passed browser checks with no warnings/errors. A 390 px Chromium viewport had no horizontal overflow. Further art tuning and actual Safari/device checks remain.
- An earlier attempt to run the game's smoke suite used an inconsistent local reference snapshot: its harness referenced `rebuildIndexes`, absent from the retrieved `app.js`. This occurred without modifying game code; it is not a passing regression check. This was a snapshot mismatch, not an established repository bug. Run the full suite from a consistent checkout before eventual game integration.

## Approved visual direction

The user prefers the original geometric 2.5D portraits. Pixel hybrid and retro pixel experiments were rejected and removed from the renderer, editor, tests, and downloadable build. Keep the original as the working baseline. Additional style ideas are exploratory only and are not approved replacements.
