// Errors-only lint over the built page and the Node scripts (tools/lint.js). It found two features that could
// never run because they read block-scoped names from another file; keep it clean.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {lintBrowser,lintNode}=require('../tools/lint');
const {loadEngine}=require('../tools/harness');
const show=ps=>ps.map(p=>`${p.file}:${p.line}:${p.column} ${p.rule} ${p.message}`).join('\n');

test('the built game has no lint errors',()=>{const ps=lintBrowser();assert.equal(ps.length,0,show(ps))});
test('tools, tests and the desktop shell have no lint errors',()=>{const ps=lintNode();assert.equal(ps.length,0,show(ps))});

test('the featured development plans reminder can appear again',async()=>{
 const e=loadEngine({seed:7301,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const plans=globalThis.DynastyLabDevelopmentPlans;
 assert.equal(typeof plans?.countFor,'function');assert.ok(plans.limit>0);
 e.universe.phase='complete';e.universe.developmentState=null;
 const items=e.guidanceModel(e.T('Chicago Metropolitan')).items||e.guidanceModel(e.T('Chicago Metropolitan'));
 const list=Array.isArray(items)?items:Object.values(items).flat();
 assert.ok(list.some(x=>/Choose featured development plans \(\d+\/\d+\)/.test(x?.title||'')),'the offseason reminder is offered');
});
test('the development visualization receives the tendency clue',async()=>{
 loadEngine({seed:7302,fullRuntime:true});
 assert.equal(typeof globalThis.DynastyLabDevelopmentTendencies?.clue,'function');
});
