# Dynasty Lab logo

Approved Dynasty Lab artwork, added November 13, 2026. Both PNGs retain the
original supplied pixels and transparency.

- `dynasty-lab-primary-v1.png`: 1774 × 887 wide lockup, used on the title screen,
  new-dynasty setup header and game navigation rail.
- `dynasty-lab-stacked-v1.png`: 1254 × 1254 alternate, used in About.

`dynasty-logo.css` fits the wide image's transparent vertical padding out of the
layout without stretching the artwork. The setup progress strip moves below
the logo and exit control on phones. Team/program marks and installed-app icons
are unchanged.

Keep artwork filenames versioned because the service worker caches them by URL.
After adding or changing assets, run `npm run build` and commit `index.html` and
`sw.js`. `npm run test:dynasty-logo-browser` checks desktop, 390px and 320px
layouts; `node tests/pwa-browser.js` checks both logos offline. Optional
`DYNASTY_LOGO_SCREENSHOTS=<directory>` saves the logo browser test's screenshots.
