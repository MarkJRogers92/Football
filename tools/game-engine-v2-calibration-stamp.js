const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const root=path.join(__dirname,'..');
const reportPath=process.argv[2]?path.resolve(process.argv[2]):path.join(root,'docs','v0100-CALIBRATION.json');
const tracked=['game-engine-v2.js','game-engine-v2-adapter.js','tools/game-engine-v2-compare.js'];
const hash=crypto.createHash('sha256');
for(const file of tracked){hash.update(file+'\0');hash.update(fs.readFileSync(path.join(root,file)));hash.update('\0')}
const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
report.calibrationContract=1;
report.sourceSha256=hash.digest('hex');
report.sourceFiles=tracked;
fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(`Stamped ${path.relative(root,reportPath)} with v2 calibration source fingerprint.`);
