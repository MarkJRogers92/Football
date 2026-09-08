# Dynasty Lab v0.12.0 Desktop Foundation handoff

## Current state

- Branch: `codex/v0120-desktop-foundation`
- Source baseline: `3f5704ca974d0f8b05f836bf334da5b64885ebf6` (`codex/v0119-options-about`)
- Validated integration checkpoint: `e7e309d`
- Current head: the branch tip containing this handoff (`git rev-parse HEAD`)
- Version remains `0.11.9`; production remains `20d99a4` on `gh-pages`
- Production and previews were not published or modified

## What Milestone A adds

Dynasty Lab remains one HTML/CSS/JavaScript game with two build targets. The
existing `npm run build` still produces the root `index.html` web artifact.
Electron Forge now provides an unpackaged desktop shell and a package command
that consume that same built file.

The desktop main process lives in `desktop/main.js`. It creates a resizable
1440x900 window, loads the local built game, and keeps desktop-only code out of
the renderer and gameplay systems. No preload bridge or IPC API exists in this
milestone.

## Commands

```bash
npm install
npm run desktop:dev
```

`desktop:dev` rebuilds `index.html` and launches the unpackaged Electron app.
Electron Forge accepts `rs` in that terminal to restart the main process after
another build.

Additional focused commands:

```bash
npm run build
npm run test:desktop-smoke
npm run desktop:package
```

`desktop:package` writes platform-specific unpackaged output under ignored
`out/`. It does not build an installer or publish anything.

## Verified behavior

- The web build remains byte-reproducible from the v0.11.9 source.
- `npm run desktop:dev` launches the game in a native Electron window.
- The title screen initializes from the local built file.
- A new Chicago Metropolitan dynasty starts and the roster navigation opens.
- The renderer has no global `require` function.
- A browser save survives an Electron restart and Continue restores it.
- The app closes cleanly.
- Electron Forge packages a macOS arm64 application successfully.

Validation commands completed:

- `npm run test:desktop-smoke` — pass
- `npm run desktop:package` — pass
- `node tests/version.js` — pass
- `node --test tests/storage.js tests/persistence.js tests/saveslots.js` — 30/30 pass
- `npm audit --omit=dev` — zero runtime vulnerabilities
- clean rebuild comparison for `index.html` — pass

The automated smoke test uses a disposable Electron profile, so it never reads
or writes the developer's real Dynasty Lab saves.

The full gameplay, long-run simulation, and broad browser suites were not rerun
because Milestone A does not change shared renderer or simulation code. The
focused Electron, build, version, and persistence paths were validated instead.

## Security decisions

- `contextIsolation: true`
- `nodeIntegration: false`
- renderer sandbox enabled
- no preload script, IPC bridge, or exposed Node API
- unexpected navigation, new renderer windows, and permission requests denied
- only the local built `index.html` is loaded

## Storage boundary

`storage.js` is unchanged. Milestone A continues to use Chromium IndexedDB and
localStorage in Electron's persistent application profile. The application
identity `Dynasty Lab` should remain stable so those profile-backed saves do not
appear to move.

Desktop saves are separate from the GitHub Pages browser origin. Portable JSON
export/import remains the supported bridge for now. Development and packaged
file locations may also produce different origin-scoped storage, so packaged
save migration must be decided before desktop distribution.

## Not implemented yet

- native filesystem saves or a storage abstraction
- installers, signing, notarization, or release makers
- a custom application protocol in place of `file://`
- automatic reload, updater, Steam, cloud saves, achievements, or controllers
- production or preview publication

`npm install` currently reports advisories in Electron Forge's development-only
dependency tree. `npm audit --omit=dev` reports zero runtime vulnerabilities.
Do not use a forced audit rewrite without reviewing Forge compatibility.

## Next recommended task

Milestone B — Development Workflow + Desktop Storage Abstraction.

First define the `DynastyStorage` interface and stable desktop identity/origin
policy. Then add native, atomic filesystem saves with validation and recovery
without changing the browser IndexedDB implementation or portable JSON format.
