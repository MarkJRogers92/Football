1. Confirm the release branch is green and `git status` is clean.
2. Confirm `VERSION.txt`, `app.js`, `package.json` and the built page all report v0.9.53.
3. Confirm the temporary `sync-v0953-build.yml` workflow is absent from the release tree.
4. Merge `codex/v0953-recruiting-development-polish` into the approved source baseline.
5. Publish a versioned preview with `node tools/publish.js --preview v0953`.
6. Verify title-screen version, New Dynasty startup, Recruiting, Recruit Compare, Development Results and one save/load cycle in the preview.
7. Obtain explicit approval before running the production publish command.
8. After approval only, publish to `gh-pages` and verify production still reports v0.9.53 after a hard refresh.
