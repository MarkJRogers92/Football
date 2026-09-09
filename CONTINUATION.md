# Dynasty Lab v0.12.0 desktop continuation

Repository: `MarkJRogers92/Football`

Current source branch: `codex/v0120-desktop-alpha-packaging`

Milestone B baseline: `23704779907df576b7e6f6d259f3d52f37c71e80`

Milestone C packaging implementation: `9679873`

Production remains `v0.11.9` at
`20d99a44d00cd19f5bbcb45c5566002690811b61` on `gh-pages`. Desktop work has not
been published to the website and no public GitHub Release has been created.

Milestone C produces the unsigned Apple Silicon Alpha:

```text
out/make/zip/darwin/arm64/Dynasty-Lab-Desktop-Alpha-macOS-arm64.zip
```

Build it with `npm ci && npm run desktop:make`. The scoped macOS job in the
`Validate Dynasty Lab` workflow also creates a downloadable Actions artifact and
launch-tests save survival across application replacement.

Read the full current handoff before continuing:

- `docs/v0120-DESKTOP-ALPHA-PACKAGING-HANDOFF.md`
- `docs/v0120-DESKTOP-STORAGE-HANDOFF.md`
- `docs/v0120-DESKTOP-HANDOFF.md`

The next bounded desktop task is Windows packaging and Windows-native
install/save-survival testing. Developer ID signing and notarization remain a
separate credential-dependent release step. Do not expand into Steam,
auto-update, or gameplay work from this checkpoint.
