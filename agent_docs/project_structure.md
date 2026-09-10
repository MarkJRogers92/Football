# Project Structure

## Directory Layout

- Root source files form the browser game: `app.js`, `body.html`, CSS files, and supporting JavaScript modules.
- `index.html` is the generated standalone artifact; `tools/build.js` assembles it from source.
- `desktop/` contains the Electron main process, preload bridge, and native save implementation.
- `tests/` contains Node and Chromium/browser checks; `tools/` contains build, publish, audit, long-run, and packaging helpers.
- `docs/` contains roadmap entries and milestone/release handoffs. `assets/` and `portraits/` hold visual assets and the deterministic portrait renderer.
- `agent_docs/` is the durable workflow documentation surface.

## Modules and Responsibilities

- `app.js` owns the main universe state, simulation orchestration, gameplay UI, new-dynasty flow, and save/import/export coordination.
- Game Engine 2 behavior is split across `game-engine-v2*.js`; `rng.js` provides deterministic gameplay randomness. Weekly coaching, player stories, recruiting, scouting, development, career, and presentation features are separate root modules.
- Branding, sports/game-day, client-shell, and other presentation modules enhance rendered UI; the build injects extension modules into the app closure where shared state is required.
- `storage.js` provides the browser/desktop-neutral `DynastyStorage` contract. Browser saves use IndexedDB; `desktop/storage.js` provides native file-backed storage through the preload bridge.

## Main Interfaces and Integration Boundaries

- `tools/build.js` reads the source files, injects ordered engine extensions before the `app.js` bootstrap, and writes one HTML file. Edit source files and rebuild; do not hand-edit `index.html`.
- The storage contract exposes load, save, archive/game-history reads, slot listing, and slot renaming. Portable JSON export/import remains the cross-target bridge.
- The Electron renderer receives only named storage operations from `desktop/preload.js`; Node integration is disabled.

## Tests and Supporting Assets

- `npm test` runs version, smoke, Node unit/integration, game-engine, persistence, and release-guard coverage. Browser UI/storage checks use the scripts named `test:browser` and `test:browser-storage`.
- `assets/` includes team helmet/logo atlases and other artwork; `portraits/renderer-v1.js` is the frozen deterministic portrait renderer.
