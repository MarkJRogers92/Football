# Dynasty Lab v0.12.0 — Desktop Storage Handoff

## Continuation state

- Branch: `codex/v0120-desktop-storage`
- Latest tested code commit: `4105155` (`fix: isolate corrupt desktop save slots`)
- Production remains `v0.11.9` on `gh-pages`; this branch has not been published.
- `VERSION.txt` and `package.json` remain `0.11.9` during Desktop Alpha development.

## What was implemented

Dynasty Lab still has one game codebase and two storage targets behind the existing
`DynastyStorage.create({slot})` contract:

- the web build continues to use IndexedDB;
- the Electron build uses native files under Electron's application data directory;
- complete JSON export/import remains the portable path between web and desktop;
- a save created by the Milestone A Electron shell in IndexedDB is migrated once to
  native storage when its matching native slot is empty. The IndexedDB source is kept.

The Electron renderer receives only these named preload operations:

- `load`
- `readArchive`
- `readGames`
- `save`
- `listSlots`
- `rename`

Node integration remains disabled, context isolation and renderer sandboxing remain
enabled, IPC requests are restricted to the main game frame, and the renderer receives
no filesystem path or generic IPC capability.

## Native save layout

The storage root is `path.join(app.getPath('userData'), 'Saves')`. Each fixed slot uses
a player-readable directory:

```text
Saves/
  Dynasty 1/
    dynasty.json
    slot.json
    history/<archive-id>/00000000.json
    games/<game-id>/00000000.json
    backups/backup-*.json
  Dynasty 2/
  Dynasty 3/
```

`dynasty.json` is the atomic commit point. Core state and metadata are committed there
after new immutable history/game chunks are durable. Writes use a temporary file,
file sync, and rename. Saves are serialized per slot, stale revisions are rejected,
and five prior committed wrappers are retained. A damaged or missing current wrapper
recovers from the newest valid backup; missing history chunks fail closed with a clear
backup message. An interrupted append can safely retry over its uncommitted chunks.
Legacy migration failures are isolated to the affected slot, retried on the next
operation, and cannot silently mark that slot as replaceable.
Likewise, a native slot whose current file and backups are all damaged is marked for
recovery without preventing healthy slots from loading or appearing in the picker.

## Commands

```bash
npm install
npm run desktop:dev
npm run test:desktop-storage
npm run test:desktop-smoke
npm run desktop:package
```

Ordinary game changes still use the existing fast loop: edit shared source, run
`npm run build`, then reload or relaunch `npm run desktop:dev`. Installer creation is
not required for development.

## Validation completed

- `npm run build`
- `npm run test:desktop-storage` — 13 focused backend/adapter tests passed, including interrupted-append retry, isolated migration failure, and corrupt-slot isolation
- `node --test tests/persistence.js tests/reviewed-fixes.js` — 8 persistence and portable import/export tests passed
- `node --test tests/storage.js` — 9 browser IndexedDB tests passed
- `CHROMIUM_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node tests/title-menus-browser.js` — desktop and iPhone title menus passed in the web target
- `npm run test:desktop-smoke` — local game loaded, preload surface verified, new dynasty started, native file committed, app restarted, dynasty restored, and app closed cleanly
- `npm run desktop:package` — unpacked macOS arm64 application packaged successfully
- JavaScript syntax checks and `git diff --check`

## Deliberately deferred

- installer makers, signing, notarization, and distribution;
- Steam, achievements, cloud saves, and auto-update;
- an Open Save Folder action or raw filesystem access in the renderer;
- a user-facing backup picker or recovery screen;
- moving small renderer preferences out of localStorage.

## Recommended next task

Milestone C should harden the packaged Desktop Alpha: launch-test the packaged app,
define Windows/macOS artifacts and signing expectations, and add a small recovery UI
only if testing shows automatic backup recovery needs player control. Keep gameplay,
web builds, and native storage behind their current shared contracts.
