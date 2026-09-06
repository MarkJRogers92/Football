const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const root=path.join(__dirname,'..');
const reportPath=path.join(root,'docs','v0100-CALIBRATION.json');
const tracked=['game-engine-v2.js','game-engine-v2-adapter.js','tools/game-engine-v2-compare.js'];
function sourceHash(){const h=crypto.createHash('sha256');for(const file of tracked){h.update(file+'\0');h.update(fs.readFileSync(path.join(root,file)));h.update('\0')}return h.digest('hex')}

test('v0.10.0 calibration report is fresh and within frozen shadow guardrails',()=>{
 const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
 assert.equal(report.calibrationContract,1);
 assert.deepEqual(report.sourceFiles,tracked);
 assert.equal(report.sourceSha256,sourceHash(),'calibration report is stale for the current v2 sources');
 assert.ok(report.matchups>=100,`calibration sample too small: ${report.matchups}`);
 const limits={meanPoints:3,meanPlays:7,meanYards:55,meanTurnovers:.5,meanTouchdowns:.5,meanFgMade:.5,meanFgAtt:.6,meanPunts:1.2,homeWinRate:.08,meanHomeMargin:1.5};
 for(const [key,limit] of Object.entries(limits))assert.ok(Math.abs(report.delta?.[key]??Infinity)<=limit,`${key} delta ${report.delta?.[key]} exceeds ${limit}`);
 for(const [bucket,row] of Object.entries(report.strengthSensitivity||{})){
  if(!row.games)continue;
  assert.ok(Math.abs(row.v2HomeWinRate-row.oldHomeWinRate)<=.18,`${bucket} strength-sensitivity win-rate delta exceeds 0.18`);
 }
});
