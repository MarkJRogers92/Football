# Dynasty Lab

A fictional college-football dynasty simulator: 120 D-I programs, hidden player
ability, role-based depth charts, recruiting with real geography, development
and camp, awards, records and a draft.

## Source layout

The deployable artifact is a single standalone HTML file, but it is **generated**
— do not hand-edit it.

| File | Role |
| --- | --- |
| `app.js` | The engine and UI layer. Source of truth. |
| `storage.js` | IndexedDB archive persistence; included in the standalone build. |
| `styles.css` | Stylesheet. Source of truth. |
| `body.html` | Page markup. Source of truth. |
| `index.html` | Generated standalone build. Rebuild with `npm run build`. |

```
npm run build          # regenerate index.html from the source files
npm test               # engine (52 checks) + persistence (10 scenarios)
npm run test:browser   # Chromium UI test, desktop + iPhone viewport (45 checks)
npm run test:browser-storage # real IndexedDB save/load/export/import UI
npm run audit          # 5-season distribution report
npm run longrun        # 12-season drift and save-growth report
```

`tools/harness.js` loads `app.js` in Node behind a small DOM shim so the engine
can be exercised and measured without a browser.

## Version

v0.8.1 — see `CHANGELOG.md`. Saves from v0.7 and v0.8 are migrated by
`normalizeUniverse()`.

## Continuation checkpoint

Read `CONTINUATION.md` before continuing in another chat. The active continuation
is based on v0.8.1 and keeps production unchanged. `STORAGE.md` documents the
browser save upgrade, compatibility, limitations and required validation.

## Publishing

The game is served by GitHub Pages from the `gh-pages` branch of
`MarkJRogers92/Property-Lookup`. Production and previews share one Pages site,
so there is a single host to reason about.

```
npm run publish                        # -> /            (production)
npm run publish:preview -- v094        # -> /preview/v094/
node tools/publish.js --list           # what is published right now
node tools/publish.js --remove v094    # delete a preview
```

| | URL |
| --- | --- |
| Production | https://markjrogers92.github.io/Property-Lookup/ |
| Previews | https://markjrogers92.github.io/Property-Lookup/preview/ |

`tools/publish.js` builds first, copies the result into a checkout of the Pages
branch (`../property-lookup`, or `PAGES_REPO`), regenerates the preview index
from whatever folders exist, then commits and pushes. Pages serves the new
build within about a minute.

Each preview runs from the same origin as production, so **they share browser
save storage**. Export a save before switching between builds if a dynasty
matters.
