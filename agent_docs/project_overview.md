# Project Overview

## Purpose

Dynasty Lab is a fictional college-football dynasty simulator with 120 Division-I programs. It models coaching a program over multiple seasons while keeping player ability partly hidden and presenting role-based, staff-readable information.

## Scope

The game covers new-dynasty setup, weekly preparation and decisions, recruiting and geography, scouting, player development and camp, depth charts, staff careers and hiring, transfers and promises, academics, game planning, regular/postseason games, permanent history, program records, branding, and adaptive Command Center guidance. It supports browser play and an Electron desktop Alpha.

## Architecture

The deployable web product is one generated HTML file containing markup, CSS, and JavaScript. `app.js` is the main state/UI source; `tools/build.js` injects ordered domain and presentation modules and validates the version before writing `index.html`. Game Engine 2 and deterministic RNG are implemented in separate modules. Browser and desktop saves share a narrow storage contract while using different persistence backends.

## Main Workflows

- A new dynasty moves through the one-time Take the Job setup, coach/program choices, control mode, inherited-program briefing, and contract review before opening the 2027 preseason.
- Weekly play uses the Command Center, recruiting/staff/player decisions, game planning, Game Lab, and season/postseason advancement. Offseason phases cover review, departures, signing, portal, spring development, fall camp, and preseason reset.
- Saves can use three slots, permanent player/game history, and portable JSON export/import. Browser saves use IndexedDB; desktop saves use native files under Electron application data.
- Maintainers build and validate locally with npm scripts; GitHub Actions provides validation and an explicit GitHub Pages publish workflow.

## Major Decisions

- Source files, not `index.html` or `gh-pages`, are canonical; generated output must remain current through `npm run build`.
- Guidance derives from authoritative gameplay state and advancement rules rather than creating a parallel task system. Persistent preferences are normalized as backward-compatible save state.
- Version authority is `VERSION.txt`, checked against `app.js` and `package.json`; the current source version is `0.12.2`.
- Publication is separate from source work. This documentation installation records no new deployment or release.
