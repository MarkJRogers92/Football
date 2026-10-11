// Resolves the Chromium binary for browser tests: CHROMIUM_PATH wins, then the first
// well-known install that exists, so the suite runs unchanged locally, in CI and in
// hosted sandboxes.
const fs = require('fs');

const CANDIDATES = [
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const found = CANDIDATES.find(candidate => {
    try { return fs.statSync(candidate).isFile(); } catch { return false; }
  });
  if (!found) throw new Error('No Chromium found. Set CHROMIUM_PATH to a Chrome or Chromium binary.');
  return found;
}

module.exports = { chromiumPath };
