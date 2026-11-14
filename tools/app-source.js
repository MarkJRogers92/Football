// app.js is split into ordered parts under app/ (listed in app/manifest.json). They are not modules: the build and the
// Node harness splice them back into app.js, at its marker line, so every part shares the one app closure exactly as
// before. Always read the core through readAppSource(), never app.js alone.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const MARKER = /^\/\*@app-parts ([^*\n]+)\*\/\n/m;
// `read` is looked up at call time so a test that wraps fs.readFileSync still sees every part.
function assembleAppSource(head, read = file => fs.readFileSync(path.join(ROOT, file), 'utf8')) {
  const match = head.match(MARKER);
  if (!match) return head;
  const manifest = JSON.parse(read(match[1].trim()));
  if (!Array.isArray(manifest.parts) || !manifest.parts.length) throw new Error('app/manifest.json lists no parts');
  const parts = manifest.parts.map(file => {
    const text = read(file);
    if (!text.endsWith('\n')) throw new Error(`${file} must end with a newline`);
    return text;
  });
  return head.slice(0, match.index) + parts.join('') + head.slice(match.index + match[0].length);
}
function readAppSource() {
  return assembleAppSource(fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8'));
}
function appPartFiles() {
  const head = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8'), match = head.match(MARKER);
  return match ? JSON.parse(fs.readFileSync(path.join(ROOT, match[1].trim()), 'utf8')).parts : [];
}
module.exports = { assembleAppSource, readAppSource, appPartFiles, MARKER };
