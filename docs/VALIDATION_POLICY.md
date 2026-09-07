# Dynasty Lab Validation Policy

## Purpose

Keep development moving without running the longest engine/browser validation suite after every small commit.

## Default cadence

Every push still receives **fast validation**:

- install dependencies;
- rebuild the standalone artifact;
- confirm committed `index.html` is current;
- verify the releasable source tree;
- run version and smoke checks.

The **full validation suite** runs automatically every fourth first-parent commit on a branch. It also runs:

- on pull requests;
- on manual workflow dispatch;
- whenever the latest commit message contains `[full-ci]` or `[release-ci]`.

Full validation includes:

- the full Node engine/presentation test suite;
- browser UI and visual regression tests;
- IndexedDB/browser storage regression;
- simulation audit.

## Working rule for agents/chats

Do not wait for or force the full suite after every small, documentation-only or presentation-only commit.

Use fast validation between bounded implementation commits. Force or wait for full validation when:

1. roughly 3–4 meaningful commits have accumulated;
2. a milestone is considered complete;
3. simulation, save/storage, scheduling, recruiting logic, development logic or game-engine behavior changed materially;
4. a preview or production release is being prepared;
5. a fast check or targeted workflow indicates a suspicious regression.

Feature-specific targeted workflows/tests should still be used when they are cheap and directly relevant.

## Promotion rule

No preview/production promotion should rely only on fast validation. The candidate head must have a clean full validation run or an equivalent explicitly documented release-validation run.
