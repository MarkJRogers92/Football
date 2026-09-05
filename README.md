# Dynasty Lab

A fictional college-football dynasty simulator: 120 D-I programs, hidden player
ability, role-based depth charts, recruiting with real geography, development
and camp, permanent game history, persistent transfers/promises, procedural
player portraits, persistent coaching careers and portable coach relationships.

## Source layout

The deployable artifact is a single standalone HTML file, but it is **generated**
— do not hand-edit it.

| File | Role |
| --- | --- |
| `app.js` | The engine and UI layer. Source of truth. |
| `storage.js` | IndexedDB archive persistence; included in the standalone build. |
| `styles.css` | Stylesheet. Source of truth. |
| `body.html` | Page markup. Source of truth. |
| `portraits/renderer-v1.js` | Frozen deterministic Portrait V1 renderer. |
| `index.html` | Generated standalone build. Rebuild with `npm run build`. |

```bash
npm run build
npm test
npm run test:browser
npm run test:browser-storage
npm run audit
npm run longrun
npm run verify:release
```

`tools/harness.js` loads the engine in Node behind a small DOM shim so the
simulation can be exercised and measured without a browser.

## Version

The live release is **v0.9.44**. `VERSION.txt` is the single release-version
source and the build/test pipeline checks it against the application/package
version so mismatched labels fail before publishing.

The v0.9 line now includes durable promises/transfers/game archives, coaching
careers and hiring, player agency and scouting, scholarships, scheme changes,
rivalries, administration/NIL stakes, bowls, academics, program history,
gameplans, Watch Mode, team branding, program colors and conference/game-day
presentation. See `CHANGELOG.md` for the version-by-version record.

See `CHANGELOG.md` and `CONTINUATION.md` for the current checkpoint and next
bounded milestone.

## Continuation checkpoint

Read `CONTINUATION.md` and `STORAGE.md` before changing game/save behavior.
The canonical development source is this repository; `gh-pages` is deployment
output only. Do not resume from the old Property-Lookup deployment or treat the
historical `codex/v081-save-continuation` branch as the current release head.

The post-v0.9.44 implementation order and bounded work packets live in
`docs/roadmap/README.md` and `docs/roadmap/STATUS.md`.

## Publishing

The game is served by GitHub Pages from this repository's `gh-pages` branch.
Production and previews share one Pages site. The preferred release path is the
manual **Publish Dynasty Lab** GitHub Actions workflow: choose `preview` and a
preview name, or choose `production` and enter `PUBLISH` as confirmation. It
runs the complete validation suite before publishing and never edits the source
branch.

The local commands remain available for maintainers:

```bash
npm run publish                        # -> /            (production)
npm run publish:preview -- v094       # -> /preview/v094/
node tools/publish.js --list           # what is published right now
node tools/publish.js --remove v094    # delete a preview
```

| | URL |
| --- | --- |
| Production | https://markjrogers92.github.io/Football/ |
| Previews | https://markjrogers92.github.io/Football/preview/ |

`tools/publish.js` builds first, then copies the generated result into a
`gh-pages` worktree at `.pages/` (override with `PAGES_WORKTREE`), regenerates
the preview index from the folders that actually exist, commits and pushes. It
refuses a dirty source tree, a stale generated build, or a conflicting repeat
of an already-published production version.

`gh-pages` holds only what the site serves. The source lives on the development
branch; the site branch is not a source mirror and should not be hand-edited as
the canonical game.

Each preview runs on the same origin as production, so **previews and production
share browser save storage**. Export a JSON backup before switching builds when
a dynasty matters.
