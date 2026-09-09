# Dynasty Lab v0.12.0 — Desktop Alpha Packaging Handoff

## Continuation state

- Source branch: `codex/v0120-desktop-alpha-packaging`
- Milestone B baseline: `23704779907df576b7e6f6d259f3d52f37c71e80`
- Packaging implementation checkpoint: `9679873`
- Scouting-label display correction: `d51143a`
- Source/package version remains `0.11.9` during Desktop Alpha development.
- Production remains `v0.11.9` at `20d99a44d00cd19f5bbcb45c5566002690811b61` on `gh-pages`.
- No preview, production deployment, or public GitHub Release was created.

## Alpha artifact

On an Apple Silicon Mac, install dependencies once and make the Alpha:

```bash
npm ci
npm run desktop:make
```

The exact output is:

```text
out/make/zip/darwin/arm64/Dynasty-Lab-Desktop-Alpha-macOS-arm64.zip
```

The ZIP contains `Dynasty Lab.app`. Extract it, move the application to
`/Applications` if desired, and open it. The application is self-contained and
does not need this repository, Node.js, npm, or developer tooling after it has
been extracted.

The Forge maker keeps the established application identity (`Dynasty Lab`,
bundle ID `com.electron.dynasty-lab`) while naming only the downloadable ZIP as
an Alpha. That identity stability keeps the normal macOS save location at:

```text
~/Library/Application Support/Dynasty Lab/Saves
```

Replacing `Dynasty Lab.app` does not replace that external `userData` directory.

## GitHub Actions download

The `desktop-macos` job in **Validate Dynasty Lab** runs only for this Alpha
branch, its pull requests, or a manual workflow dispatch. It uses an Apple
Silicon `macos-15` runner to build the arm64 ZIP, launch-test the extracted app,
exercise native save/restore across an application replacement, and upload:

```text
dynasty-lab-desktop-alpha-macos-arm64-<commit-sha>
```

That Actions artifact contains the exact
`Dynasty-Lab-Desktop-Alpha-macOS-arm64.zip` file and is retained for 14 days.
Download it from the successful workflow run's **Artifacts** section. This is a
workflow artifact, not a public GitHub Release.

## Packaging and security

- Electron Forge uses `@electron-forge/maker-zip` for the macOS artifact.
- Shared source still builds the same root `index.html`; there is no second frontend.
- Application resources are packaged in ASAR.
- The macOS bundle receives a local ad-hoc signature so its modified Electron
  resources load correctly. It is **not** signed with an Apple Developer ID and
  is **not** notarized.
- The renderer still has context isolation and sandboxing enabled, Node
  integration disabled, denied navigation/windows/permissions, and only the
  existing named storage bridge.
- Browser builds still use IndexedDB; native files remain a desktop-only target.

## Unsigned Alpha and Gatekeeper

Because this Alpha is not Developer ID signed or notarized, macOS may say Apple
cannot verify the developer or may block the first double-click. Use Finder's
**Open** command from the app's context menu and confirm **Open**. If macOS still
blocks it, go to **System Settings → Privacy & Security** and use **Open Anyway**
for Dynasty Lab. Do not disable Gatekeeper system-wide.

Developer ID signing and notarization require Mark's Apple Developer credentials
and should be added as a later release step without changing the game code or
desktop storage identity.

## Save and recovery behavior

Native saves remain under Electron `userData/Saves`, outside the `.app`. The
packaged smoke uses a disposable profile to start Chicago Metropolitan, save,
fully close, replace the extracted app with a fresh copy, reopen, and Continue.
It also verifies that the made ZIP is structurally valid and its ad-hoc signature
is intact.

Milestone C also closes one recovery edge case: a slot whose `slot.json` says it
was occupied can no longer be reported as empty if `dynasty.json` and all backups
are missing. It stays protected and displays the existing recovery error instead
of becoming a replacement target.

No new recovery IPC or filesystem access was added. Automatic backup recovery,
the existing `Recovery needed` state, and complete JSON import remain the safe
first-Alpha recovery path.

## Branding decision

The approved app-level mark is the CSS-rendered `DL` title crest. The repository
does not contain an approved standalone app-icon raster or `.icns`; the existing
atlases are school logos and must not be repurposed as product branding. The
Alpha therefore keeps Electron's default icon rather than inventing a new mark.
A future icon task can rasterize the approved crest through an explicitly
reviewed asset pipeline.

## Focused validation

The milestone acceptance commands are:

```bash
npm run build
npm run test:desktop-storage
npm run test:desktop-smoke
npm run desktop:package
npm run desktop:make
node tests/desktop-smoke.js --packaged
node --test tests/storage.js
git diff --check
```

The packaged smoke covers the title screen, new-dynasty startup, native save
creation, clean close, fresh application extraction/replacement, Continue/load,
renderer Node isolation, the narrow preload surface, and fatal renderer/console
errors. It never uses or changes the player's real Dynasty Lab saves.

Acceptance result on 2026-09-08: every command above passed on Apple Silicon.
Desktop storage passed 14/14 tests, browser storage passed 10/10 tests, and the
existing game smoke passed 53/53 checks. A subsequent focused display check
confirmed that roster cards and player dossiers render plain staff-readable
scouting labels instead of escaped HTML. The executable is arm64, its ad-hoc
signature verifies, and its ASAR contains
the game entry and desktop shell while excluding tests, docs, tools, `.pages`,
GitHub metadata, and development `node_modules`.

## Deferred and next task

Still deferred: Developer ID signing, notarization, Windows packaging, Steam,
Steam Cloud, achievements, auto-update, controllers, and all gameplay changes.

The next bounded desktop task is Windows packaging and Windows-native install/
save-survival testing. Apple Developer signing/notarization can proceed separately
when credentials are available; neither should alter the shared game code.
