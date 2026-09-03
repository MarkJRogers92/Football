# Dynasty Lab

A fictional college-football dynasty simulator: 120 D-I programs, hidden player
ability, role-based depth charts, recruiting with real geography, development
and camp, awards, records and a draft.

## Source layout

The deployable artifact is a single standalone HTML file, but it is **generated**
— do not hand-edit it.

| File | Role |
| --- | --- |
| `app.js` | The whole engine and UI layer. Source of truth. |
| `styles.css` | Stylesheet. Source of truth. |
| `body.html` | Page markup. Source of truth. |
| `index.html` | Generated standalone build. Rebuild with `npm run build`. |

```
npm run build          # regenerate index.html from the three source files
npm test               # headless engine smoke tests (46 checks)
npm run test:browser   # Chromium UI test, desktop + iPhone viewport (43 checks)
npm run audit          # 5-season distribution report
npm run longrun        # 12-season drift and save-growth report
```

`tools/harness.js` loads `app.js` in Node behind a small DOM shim so the engine
can be exercised and measured without a browser.

## Version

v0.8.1 — see `CHANGELOG.md`. Saves from v0.7 and v0.8 are migrated by
`normalizeUniverse()`.
