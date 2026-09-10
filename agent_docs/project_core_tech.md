# Project Core Technologies

## Languages and Runtimes

- Browser code is plain HTML, CSS, and JavaScript with no frontend framework.
- Node.js scripts drive builds, tests, audits, long-run simulation, and publishing. The GitHub Actions workflows currently use Node 24.
- Electron provides the desktop shell; the package manifest declares Electron `^44.3.0` and Electron Forge `^7.11.2`.

## Frameworks and Libraries

- Electron Forge packages macOS arm64 and Windows x64 ZIP artifacts through `@electron-forge/maker-zip`.
- Playwright Core drives Chromium browser checks; `fake-indexeddb` supports Node-side browser-storage tests; `extract-zip` supports desktop packaging tests.
- Simulation and UI code use project-local modules rather than a server framework or external runtime service.

## Build, Test, and Development Tools

- `npm run build` generates the standalone `index.html` and checks version consistency across `VERSION.txt`, `app.js`, and `package.json`.
- `npm test` runs the broad Node suite. `npm run test:browser`, `npm run test:browser-storage`, `npm run audit`, `npm run longrun`, and `npm run verify:release` provide focused validation.
- Desktop development and packaging use `npm run desktop:dev`, `npm run desktop:make`, and `npm run desktop:make:windows`.

## External Services and Infrastructure

- GitHub Actions runs validation and the manually authorized publish workflow.
- GitHub Pages serves the `gh-pages` branch. The project README documents production and preview URLs, but this installation does not infer the publication state of the current `0.12.2` source.

## Important Technical Constraints

- `index.html` is generated and must not be hand-edited. The source branch is canonical; `gh-pages` is deployment output only.
- Browser persistence uses IndexedDB database `DynastyLabDB` with three fixed slots and separate save, player-archive, game-archive, and metadata stores. Portable JSON keeps complete save/history data inlined.
- Desktop persistence uses the named preload storage bridge with context isolation, renderer sandboxing, and Node integration disabled. Native saves use atomic files and recoverable backups.
- Hidden player truth must not be exposed by UI or staff-facing reports; presentation reads observed/scouted values and stored receipts.
