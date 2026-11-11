# Dynasty Lab v0.9.54 — Recruiting Intelligence

v0.9.54 finishes the scouting/recruiting/development polish pass with faster staff recommendations and a clearer long-term feedback loop.

## Highlights

- Staff Shortlist now uses exact branch-and-bound pruning. It preserves the same top-eight recommendations while reducing Staff Verdict work by an average of 85.7% across five generated 2,800-recruit universes.
- Recruiting Class History groups scouting receipts by signing class and grades later observed outcomes as Diamonds, Hits, Busts, Misses, As Scouted, or provisional watch states.
- Recruit Evaluation Trail shows what each Quick Film or Full Evaluation actually changed: report confidence, range width and staff verdict movement.
- Recruiting Board filters make the full recruit pool manageable by position, evaluation stage, Staff Verdict and targeted-only status before the normal 220-row display cap.
- Historical and board presentation remains anti-cheat: hidden true rating, hidden upside, hidden development curve/volatility and hidden traits are never used to produce player-facing scouting grades or filters.
- Recruiting/history extensions remain read-only until the user takes an actual scouting action; browsing does not create detailed scouting state or inflate saves.

## Validation targets

Release-candidate validation must include:

- exact shortlist equivalence and real-pool performance measurement;
- focused scouting/action/trail/history/filter regressions;
- a real multi-season recruiting-history lifecycle check through enrollment and player archive;
- full engine/presentation suite;
- Chromium UI/visual suite, including Evaluation Trail and Recruiting Board filters;
- IndexedDB regression;
- simulation audit;
- committed-build freshness and release-tree verification.

Production publication is not implied by this release note. Publish a versioned preview first and keep production on v0.9.52 until separately authorized.
