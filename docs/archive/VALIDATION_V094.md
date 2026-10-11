# v0.9.4 Validation

Validated on `codex/v094-coaching-careers` before preview publication.

- `npm run build` — passed; standalone built as Dynasty Lab v0.9.4.
- Engine smoke — 52 passed, 0 failed, including eight-season stability.
- Node test groups — 26 passed, 0 failed, including four new persistent-coach tests.
- Browser UI — 69 passed, 0 failed across desktop and 390px viewport; coach profile opens, shows career history, fits viewport, and produced no console errors.
- Real-browser IndexedDB — 6 persistence scenarios passed, no console errors.
- Two-season audit — bounded rosters, zero pending transfers, recruiting classes 15–30 (mean 23.3), flips 4.9%.
- Pages preview deployment — successful from `gh-pages` commit `13851e7c1cb910b654be6f9ce55400a40ecb5a00`.

Preview: https://markjrogers92.github.io/Football/preview/v094-coaching-careers/

Actual iPhone Safari remains a separate real-device check.
