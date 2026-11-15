const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness.js');

function memoryStorage(){const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}}
function legacyModule(){delete require.cache[require.resolve('../legacy.js')];return require('../legacy.js')}
const store=(o={})=>({version:1,titleFactsVersion:2,achievements:{},records:{},hallOfFame:[],challenges:{},memory:{},...o});

test('combining two Legacy stores keeps the best of each and loses nothing',()=>{
 const L=legacyModule();
 const here=store({achievements:{first_win:{year:2031,program:'A'},ten_wins:{year:2033,program:'A'}},records:{wins:{value:11,program:'A'},seasons:{value:7,program:'A'}},
  hallOfFame:[{playerId:'p1',name:'One',program:'A',honors:['2031 Heisman']}],challenges:{rebuild:{status:'failed'},perfect:{status:'complete'}},memory:{k1:{lowConfidence:false}}});
 const there=store({achievements:{first_win:{year:2028,program:'B'},bowl_win:{year:2029,program:'B'}},records:{wins:{value:12,program:'B'},seasons:{value:3,program:'B'}},
  hallOfFame:[{playerId:'p1',name:'One',program:'A',honors:['2032 first-round pick (#4)']},{playerId:'p2',name:'Two',program:'B',honors:['2029 Heisman']}],challenges:{rebuild:{status:'active'},perfect:{status:'failed'}},memory:{k1:{lowConfidence:true},k2:{}}});
 const c=L.combine(here,there);
 assert.deepEqual(Object.keys(c.achievements).sort(),['bowl_win','first_win','ten_wins']);
 assert.equal(c.achievements.first_win.year,2028,'the earlier unlock');
 assert.equal(c.records.wins.value,12);assert.equal(c.records.seasons.value,7,'the better value of each record');
 assert.equal(c.hallOfFame.length,2);assert.deepEqual(c.hallOfFame.find(h=>h.playerId==='p1').honors,['2031 Heisman','2032 first-round pick (#4)']);
 assert.equal(c.challenges.rebuild.status,'active');assert.equal(c.challenges.perfect.status,'complete','the furthest a challenge got');
 assert.equal(c.memory.k1.lowConfidence,true);assert.ok(c.memory.k2);
 assert.deepEqual(L.combine(here,null),L.combine(here,store()),'a missing backup changes nothing');
 assert.equal(L.combine(here,{version:99,achievements:{x:{year:1}}}).achievements.x,undefined,'an unknown format is ignored');
});

test('a v1 store\'s unverified title evidence is set aside before combining',()=>{
 const L=legacyModule();
 const old={version:1,achievements:{national_champ:{year:2030}},records:{titles:{value:2}},hallOfFame:[],challenges:{},memory:{}};
 const c=L.combine(store(),old);
 assert.equal(c.achievements.national_champ,undefined);assert.equal(c.records.titles,undefined);
 assert.equal(c.unverifiedTitles.achievements.national_champ.year,2030);
});

test('a save export carries this device\'s Legacy, and importing merges it back without erasing anything',async()=>{
 global.localStorage=memoryStorage();
 const L=legacyModule();globalThis.DynastyLegacy=L;
 try{
  localStorage.setItem(L.KEY,JSON.stringify(store({achievements:{first_win:{year:2027,program:'Chicago Metropolitan'}},records:{wins:{value:9}}})));
  const e=loadEngine({seed:9191});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
  let exported;global.URL.createObjectURL=blob=>{exported=JSON.parse(blob.parts.join(''));return 'blob:test'};
  await e.exportSave();
  assert.equal(exported.legacy.achievements.first_win.year,2027,'the backup holds Legacy');
  // On another device with its own Legacy, the import adds the backup's and keeps the device's.
  localStorage.setItem(L.KEY,JSON.stringify(store({achievements:{bowl_win:{year:2030,program:'X'}},records:{wins:{value:12}}})));
  const fresh=legacyModule();globalThis.DynastyLegacy=fresh;
  global.FileReader=class{readAsText(file){this.result=file;queueMicrotask(()=>this.onload())}};
  await e.importSave(JSON.stringify(exported));
  assert.match(e.$el('#saveStatus').textContent,/Imported save file successfully\. Legacy merged: 1 achievement added\./);
  const now=JSON.parse(localStorage.getItem(L.KEY));
  assert.deepEqual(Object.keys(now.achievements).sort(),['bowl_win','first_win']);
  assert.equal(now.records.wins.value,12);
  // An older backup without Legacy imports exactly as before.
  delete exported.legacy;await e.importSave(JSON.stringify(exported));
  assert.equal(e.$el('#saveStatus').textContent,'Imported save file successfully.');
  // Unsafe markup in a backup's Legacy is dropped; the save still imports.
  exported.legacy=store({achievements:{ten_wins:{year:2031,program:'<img src=x onerror=alert(1)>'}}});
  await e.importSave(JSON.stringify(exported));
  assert.equal(e.$el('#saveStatus').textContent,'Imported save file successfully.');
  assert.equal(JSON.parse(localStorage.getItem(L.KEY)).achievements.ten_wins,undefined);
 }finally{delete globalThis.DynastyLegacy;delete global.localStorage}
});
