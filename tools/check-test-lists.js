// Fail the build if a test is forgotten, or full/fast/slow unit coverage drifts.
const fs=require('node:fs'),path=require('node:path');
const files=s=>new Set(String(s||'').match(/tests\/[\w-]+\.js/g)||[]);
function checkTestLists(scripts,names){
 const full=files(scripts.test),fast=files(scripts['test:fast']),slow=files(scripts['test:slow']);
 const all=files(Object.entries(scripts).filter(([key])=>key==='test'||key.startsWith('test:')).map(([,value])=>value).join(' ')),errors=[];
 for(const name of names){const file='tests/'+name;if(!all.has(file))errors.push(`${file} is not assigned to a test command`)}
 // Version/smoke are orchestration checks, not node:test files.
 for(const file of full){if(/tests\/(version|smoke)\.js$/.test(file))continue;if(!fast.has(file)&&!slow.has(file))errors.push(`${file} has no fast/slow tier`)}
 for(const file of new Set([...fast,...slow])){
  if(fast.has(file)&&slow.has(file)&&!file.endsWith('/version.js'))errors.push(`${file} is in both tiers`);
  if(!full.has(file))errors.push(`${file} is absent from the full unit suite`);
 }
 return errors;
}
function verify(root=path.join(__dirname,'..')){
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 const errors=checkTestLists(pkg.scripts,fs.readdirSync(path.join(root,'tests')).filter(n=>n.endsWith('.js')));
 if(errors.length)throw new Error(errors.join('\n'));
}
module.exports={checkTestLists,verify};
if(require.main===module){verify();console.log('Test lists cover every test and agree across tiers.');}
