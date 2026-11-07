const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
test('a briefing-opened profile uses its canonical player identity rather than the previously clicked row',()=>{
 const requested=[],events={},dialog={open:true,dataset:{lwEntity:'player:new-player'}},api={snapshot:id=>{requested.push(id);return null}};
 const doc={querySelector:sel=>sel==='#playerDialog'?dialog:null,addEventListener:(name,fn)=>{events[name]=fn}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','player-identity.js'),'utf8'),{document:doc,window:{},DynastyLabPlayerIdentity:api,setTimeout:fn=>fn()});
 events.click({target:{closest:()=>({dataset:{player:'old-player'}})}});
 assert.deepEqual(requested,['new-player']);
});
