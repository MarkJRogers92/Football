const test=require('node:test'),assert=require('node:assert/strict');
const {items,wireItems}=require('../dynasty-world-news');
test('world news is current, personal, deduplicated, bounded and read-only',()=>{
 const team={id:1},event=(id,type,extra={})=>({id,type,season:2035,week:12,schoolIds:[1],importance:60,summary:'Actual event',...extra});
 const u={year:2035,week:12,phase:'complete',events:[event('p','PRO_MILESTONE'),event('p','PRO_MILESTONE'),event('l','LOCKER_ROOM_MEETING'),event('r','LOCKER_ROOM_RESOLVED'),event('old','PRO_MILESTONE',{season:2034}),event('other','PRO_MILESTONE',{schoolIds:[2]}),event('future','PRO_MILESTONE',{week:13})]};
 const before=JSON.stringify(u),news=items(u,team);
 assert.equal(news.length,2);assert.equal(new Set(news.map(x=>x.id)).size,2);
 assert.ok(news.every(x=>!['old','other','future'].includes(x.id)));
 assert.equal(JSON.stringify(u),before);
 u.week=1;assert.equal(items(u,team).length,0);
});
test('Wire stories escape names, link to the right existing page and do not invent a task',()=>{
 const u={year:2035,week:2,phase:'regular',events:[{id:'x',type:'LOCKER_ROOM_RESOLVED',season:2035,week:2,schoolIds:[1],summary:'Captains helped <Alex>',importance:56}]};
 const rows=wireItems(u,{id:1});
 assert.equal(rows[0].tab,'roster');assert.match(rows[0].main,/&lt;Alex&gt;/);
 assert.equal(rows[0].required,undefined);assert.equal(rows[0].worldEventId,'x');
});

test('a resolution replaces its incident in the short news selection',()=>{
 const base={season:2035,week:2,schoolIds:[1],playerIds:['a'],summary:'A locker-room event'};
 const u={year:2035,week:2,events:[{...base,id:'incident',type:'LOCKER_ROOM_FLASHPOINT'},{...base,id:'resolved',type:'LOCKER_ROOM_RESOLVED'}]};
 assert.deepEqual(items(u,{id:1}).map(e=>e.id),['resolved']);
});
