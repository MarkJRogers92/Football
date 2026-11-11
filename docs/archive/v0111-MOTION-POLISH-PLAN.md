# v0.11.1 Motion / Final Interaction Polish Plan

Base: `codex/v0110-world-history-integrated`

Scope is presentation-only. The deferred Blender/premium-asset milestone remains untouched.

## Goals

- Add restrained entry/reveal motion to major presentation surfaces.
- Make recruit dossier changes, development-result changes, game-result changes, and history/panel transitions feel intentional.
- Improve hover/focus feedback without turning the interface into a glowing dashboard.
- Respect `prefers-reduced-motion` completely.
- Avoid changing simulation state, save shape, timing-sensitive gameplay logic, or hidden-information rules.

## Acceptance

- Existing primary presentation routes still function at desktop and iPhone widths.
- Motion classes are applied only to visible presentation surfaces.
- Reduced-motion mode disables animations/transforms.
- No page-level overflow and no console errors.
- Standalone build remains reproducible.
