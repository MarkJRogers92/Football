# Dynasty Lab

A fictional college-football dynasty simulator: 120 D-I programs, hidden player
ability, role-based depth charts, recruiting with real geography, scouting and
development, coaching careers, weekly game-day play and permanent program
history. It ships as a standalone web build and as an Electron desktop alpha.

Current version: **0.12.5** (see `VERSION.txt`). `CHANGELOG.md` has the
version-by-version record.

## Source layout

`index.html` is **generated** by `npm run build` -- never hand-edit it.

| Path | Role |
| --- | --- |
| `app.js` | Engine and UI core. Source of truth. |
| `*.js` / `*.css` feature modules | Feature extensions (recruiting, scouting, game-engine-v2, weekly coaching, presentation, guidance, etc.). `tools/build.js` injects them into `app.js` (engine extensions) or appends them after it (presentation modules) in a fixed, dependency-ordered list. A new module must be added to that list. |
| `schools-data.js` | The 120 fictional programs every new universe starts from (`DynastySchools`). |
| `storage.js` | Browser IndexedDB archive persistence (`DynastyStorage`). |
| `body.html`, `styles.css` | Page markup and base stylesheet. |
| `portraits/` | Frozen deterministic Portrait V1 renderer. |
| `assets/`, `team-colors.json` | Logos, helmets and program colors. |
| `desktop/` | Electron shell (`main.js`, `preload.js`, `storage.js`); packaged with Electron Forge (`forge.config.js`). |
| `tests/` | Node unit tests, browser (Playwright) tests, desktop tests. |
| `tools/` | Build, publish, audit, long-run and release-guard scripts; `harness.js` runs the engine in Node behind a DOM shim. |

## Build and test

```bash
npm ci
npm run build                 # generate index.html
npm test                      # version check, smoke, and Node unit suites
npm run test:browser          # Chromium UI/visual suites
npm run test:browser-storage  # browser save/load and storage
npm run audit                 # engine balance/consistency audit
npm run longrun               # multi-season (12) stability run
npm run verify:release        # release-source and build-currentness checks
npm run validate:full         # build + verify + all of the above
```

Browser tests locate Chromium through `tests/helpers/chromium-path.js`; set
`CHROMIUM_PATH` to point at a specific binary.

Desktop alpha:

```bash
npm run desktop:dev           # build and launch in Electron
npm run desktop:make          # macOS arm64 zip
npm run desktop:make:windows  # Windows x64 zip
```

Other targeted suites are listed in `package.json` (`test:guidance`,
`test:game-engine-v2`, `test:development`, `test:desktop-storage`, ...).

## Version policy

`VERSION.txt` is the single release-version source. `APP_VERSION` in `app.js`
and `version` in `package.json` must match it; `tools/build.js` and
`tests/version.js` fail on a mismatch. Bump all three together.

## CI

`.github/workflows/validate.yml` runs on pull requests and pushes (except
`gh-pages`) using `npm ci`: build, release verification and the unit suite on
every push; browser and audit jobs follow the validation cadence (full on
pull requests, manual runs, `[full-ci]`/`[release-ci]` commits and periodically).
Desktop packaging jobs (macOS, Windows) run only when desktop-related files
change, a commit contains `[release-ci]` or `[desktop-ci]`, or on manual dispatch.

## Publishing

The manual **Publish Dynasty Lab** workflow (`.github/workflows/publish.yml`)
validates and then publishes the build to the `gh-pages` branch: choose `preview`
plus a name, or `production` and confirm with `PUBLISH`. Local equivalents:

```bash
npm run publish                     # production (/)
npm run publish:preview -- <name>   # /preview/<name>/
node tools/publish.js --list        # what is published
node tools/publish.js --remove <name>
```

This README does not state which version is currently live; check the publish
workflow runs and git history. The source branch is canonical; `gh-pages` is
deployment output only. Previews and production share one origin and therefore
share browser save storage -- export a JSON backup before switching builds.

## Docs

- `CHANGELOG.md` -- release history.
- `STORAGE.md` -- save format and persistence contract; read before changing save behavior.
- `VISUAL_IDENTITY.md` -- visual identity rules.
- `IDEAS.md` -- idea backlog.
- `docs/` -- milestone checkpoints, validation policy, release notes, `docs/roadmap/`.
- `docs/archive/` -- historical root-level handoffs, worklog and roadmaps (may be out of date).
- `agent_docs/` -- working context for coding agents.
