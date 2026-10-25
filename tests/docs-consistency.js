const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const {execFileSync}=require('child_process');

// v0.12.11: documentation drift cost two sessions in two months. VERSION.txt,
// CHANGELOG, README, agent context and the roadmap must name the same release,
// and the roadmap must point at a commit that is really behind HEAD.
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const version=read('VERSION.txt').trim().replace(/^v/,'');
const dotted=version.replace(/\./g,'\\.');

test('CHANGELOG documents the current version',()=>{
 assert.ok(read('CHANGELOG.md').includes(`## v${version}`),`CHANGELOG.md needs a "## v${version}" section`);
});

test('README states the current version',()=>{
 const found=read('README.md').match(/Current version: \*\*([0-9.]+)\*\*/);
 assert.ok(found,'README.md must state "Current version: **x.y.z**"');
 assert.equal(found[1],version,'README version must match VERSION.txt');
});

test('agent context names the shipped version',()=>{
 const notes=read('agent_docs/latest_session_work.md');
 assert.match(notes,new RegExp(dotted),'agent_docs/latest_session_work.md must name the current version');
});

test('roadmap status reconciles a real commit and the current version',()=>{
 const status=read('docs/roadmap/STATUS.md');
 const match=status.match(/Last reconciled: [^,]+, source `([0-9a-f]{7,40})` \(\`v?([0-9.]+)\`\)/);
 assert.ok(match,'STATUS.md must keep a "Last reconciled: <date>, source `<sha>` (`v<version>`)" line');
 const [,sha,stated]=match;
 assert.equal(stated,version,'STATUS.md version must match VERSION.txt');

 // Shallow CI checkouts cannot answer ancestry; the version check above still runs there.
 let shallow=true;
 try { shallow=execFileSync('git',['rev-parse','--is-shallow-repository'],{cwd:root,encoding:'utf8'}).trim()==='true'; } catch {}
 if(shallow)return;
 let known=true;
 try { execFileSync('git',['cat-file','-e',`${sha}^{commit}`],{cwd:root,stdio:'ignore'}); } catch { known=false; }
 assert.ok(known,`STATUS.md references unknown commit ${sha}`);
 execFileSync('git',['merge-base','--is-ancestor',sha,'HEAD'],{cwd:root,stdio:'ignore'});
});
