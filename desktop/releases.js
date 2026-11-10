// Picks the newest published Dynasty Lab release from the GitHub releases list. Every desktop build so far has been
// a prerelease, and GitHub's /releases/latest endpoint ignores prereleases (it returns 404), so the update notice must
// read the list and choose the highest version itself. Drafts and malformed tags are skipped.
const TAG = /^v?(\d+)\.(\d+)\.(\d+)$/;

function versionParts(tag) {
  const m = TAG.exec(String(tag || '').trim());
  return m ? m.slice(1, 4).map(Number) : null;
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

function newestRelease(list) {
  let best = null;
  for (const release of Array.isArray(list) ? list : []) {
    if (!release || release.draft) continue;
    const parts = versionParts(release.tag_name);
    if (!parts) continue;
    if (!best || compareVersions(parts, best.parts) > 0) best = { parts, release };
  }
  if (!best) return null;
  return { tag: best.release.tag_name, url: best.release.html_url || null, prerelease: !!best.release.prerelease };
}

module.exports = { versionParts, compareVersions, newestRelease };
