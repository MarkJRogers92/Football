// The app core is app.js plus ordered parts under app/ (tools/app-source.js). Guard the split itself.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs'),path=require('path'),vm=require('vm');
const {readAppSource,appPartFiles,MARKER}=require('../tools/app-source');
const root=path.join(__dirname,'..');

test('every part in the manifest exists, and every file under app/ is listed exactly once',()=>{
 const parts=appPartFiles();
 assert.ok(parts.length>1,'app.js is split');
 assert.equal(new Set(parts).size,parts.length,'no part is listed twice');
 for(const file of parts)assert.ok(fs.existsSync(path.join(root,file)),`${file} exists`);
 const onDisk=fs.readdirSync(path.join(root,'app')).filter(f=>f.endsWith('.js')).map(f=>`app/${f}`).sort();
 assert.deepEqual(onDisk,parts.slice().sort(),'no orphaned or missing part files');
});
test('app.js keeps the version, one marker and the bootstrap',()=>{
 const head=fs.readFileSync(path.join(root,'app.js'),'utf8');
 assert.match(head,/APP_VERSION='[^']+'/);
 assert.equal(head.split('\n').filter(l=>MARKER.test(l+'\n')).length,1,'exactly one @app-parts marker');
 assert.ok(head.includes('loadSchools().then('),'the bootstrap stays in app.js');
});
test('each part is whole top-level code, so no function is cut between files',()=>{
 for(const file of appPartFiles()){
  const text=fs.readFileSync(path.join(root,file),'utf8');
  assert.ok(text.endsWith('\n'),`${file} ends with a newline`);
  assert.doesNotThrow(()=>new vm.Script(`(()=>{'use strict';\n${text}\n})();`,{filename:file}),`${file} parses on its own`);
 }
});
test('the assembled core parses and contains every part in order',()=>{
 const src=readAppSource();
 assert.doesNotThrow(()=>new vm.Script(src,{filename:'app.js (assembled)'}));
 let at=-1;
 for(const file of appPartFiles()){const header=fs.readFileSync(path.join(root,file),'utf8').split('\n')[0];const next=src.indexOf(header);assert.ok(next>at,`${file} follows the part before it`);at=next}
});
