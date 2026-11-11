# v0.12.1 Take the Job + Windows Alpha handoff

Branch: `codex/v0121-take-the-job`

## Player experience

New Dynasty now opens a seven-screen, one-time setup: Take the Job, coach identity, the 120-program job board, real offensive/defensive/development choices, Dynasty or Commissioner control, a generated inherited-program briefing, and contract review. Accepting creates exactly one save and opens the Command Center at the 2027 preseason checkpoint. Active drafts survive refreshes; completed and legacy saves continue to bypass setup.

## Desktop artifacts

The same source builds both unsigned Alpha ZIPs:

- macOS Apple silicon: `npm run desktop:make`
- Windows x64: `npm run desktop:make:windows`

The output files are:

- `out/make/zip/darwin/arm64/Dynasty-Lab-Desktop-Alpha-macOS-arm64.zip`
- `out/make/zip/win32/x64/Dynasty-Lab-Desktop-Alpha-Windows-x64.zip`

GitHub Actions builds each artifact on its native operating system, launches the packaged application, creates a disposable native save, replaces the extracted app, and confirms the save still restores. Artifacts are retained for 14 days.

These are unsigned Alpha builds. Windows may show a SmartScreen warning; macOS may require an explicit first launch from Finder. The validated source was released as v0.12.1 after preview approval; production publishing remains isolated on `gh-pages`.
