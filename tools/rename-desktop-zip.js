const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const version = require(path.join(root, 'package.json')).version;
const outputDir = path.join(root, 'out', 'make', 'zip', 'darwin', 'arm64');
const source = path.join(outputDir, `Dynasty Lab-darwin-arm64-${version}.zip`);
const target = path.join(outputDir, 'Dynasty-Lab-Desktop-Alpha-macOS-arm64.zip');

if (!fs.existsSync(source)) {
  throw new Error(`Forge did not produce the expected arm64 macOS ZIP: ${source}`);
}
if (fs.existsSync(target)) fs.rmSync(target);
fs.renameSync(source, target);
console.log(`Desktop artifact: ${path.relative(root, target)}`);
