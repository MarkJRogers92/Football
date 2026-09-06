# Dynasty Lab v0.9.53 Preview Status

Updated: September 6, 2026

## Release candidate

- Release-candidate branch: `codex/v0953-recruiting-development-polish`
- Current documentation head: `e9aca06546d678537a38a072a6ede7027510cf65`
- Fully validated release source parent: `4bac39e24ef5891190fc9b1e6f775615397a6c74`
- Final release-candidate validator: GitHub Actions run `34034532106` — green through engine/presentation tests, browser/visual tests, IndexedDB persistence and simulation audit.
- Production remains v0.9.52. No production publish has been authorized or performed by this workstream.

## Versioned preview

- Preview URL: `https://markjrogers92.github.io/Football/preview/v0953/`
- Preview publisher run: `34039799301` — success.
- Preview `index.html` blob SHA: `b9877d37c3761c42ff2c5395223d0c76b87c9297`.
- Release-candidate `index.html` blob SHA: `b9877d37c3761c42ff2c5395223d0c76b87c9297`.
- Therefore the published preview is byte-identical to the validated release-candidate standalone artifact.
- The `gh-pages` production root still reports `Dynasty Lab v0.9.52`; the preview reports `Dynasty Lab v0.9.53`.

## Live served-page smoke

A preview-only branch (`codex/v0953-preview-publish`) was used so the green release-candidate source tree stayed untouched.

The served GitHub Pages preview was exercised in Chrome against the public URL. The final smoke run `34039978126` passed:

- title-screen version is v0.9.53;
- async school loading completes and New Dynasty starts;
- all 120 programs populate;
- Recruiting opens with Evaluation Hours and Roster Outlook / Staff Shortlist;
- Recruit Compare opens from the published preview;
- Development renders successfully;
- browser save/load leaves the dynasty playable;
- no page exceptions or console application errors;
- no failed HTTP responses on the settled preview.

An earlier smoke run completed the same functional checks but observed one transient 404 immediately after Pages publication; the instrumented rerun after propagation was fully green.

## Release gate

v0.9.53 is now previewed and technically verified. The remaining release gate is user review/approval. Do not publish the production root until explicit approval is given.

If further engineering continues before production approval, keep it on a separate post-v0.9.53 branch so the frozen release candidate and preview remain identical.
