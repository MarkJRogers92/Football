const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const version = require(path.join(root, 'package.json')).version;
const platform = process.argv[2] || 'darwin';
const arch = process.argv[3] || 'arm64';
const artifactNames = {
  'darwin-arm64': 'Dynasty-Lab-Desktop-Alpha-macOS-arm64.zip',
  'win32-x64': 'Dynasty-Lab-Desktop-Alpha-Windows-x64.zip',
};
const artifactName = artifactNames[`${platform}-${arch}`];

if (!artifactName) {
  throw new Error(`Unsupported desktop artifact target: ${platform}-${arch}`);
}

const outputDir = path.join(root, 'out', 'make', 'zip', platform, arch);
const source = path.join(outputDir, `Dynasty Lab-${platform}-${arch}-${version}.zip`);
const target = path.join(outputDir, artifactName);

if (!fs.existsSync(source)) {
  throw new Error(`Forge did not produce the expected ${platform}-${arch} ZIP: ${source}`);
}
if (fs.existsSync(target)) fs.rmSync(target);
fs.renameSync(source, target);
console.log(`Desktop artifact: ${path.relative(root, target)}`);
