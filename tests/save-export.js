const {test}=require('node:test');
const assert=require('node:assert/strict');
const zlib=require('zlib');
const {loadEngine}=require('../tools/harness');

// v0.18: the portable save is written in pieces and gzipped. The pieces must be exactly the JSON the game always
// exported, and a compressed backup must come back as the same dynasty.
async function world(){const e=loadEngine({seed:1801});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();e.simSeason();return e}

test('the pieces are the same JSON a single stringify would produce',async()=>{
 const e=await world(),payload={version:e.APP_VERSION,userTeam:'Chicago Metropolitan',universe:e.packUniverse(e.universe)};
 const parts=e.saveJsonParts(payload),text=parts.join('');
 assert.ok(parts.length>50,'a real dynasty is written in many pieces, not one string');
 assert.ok(Math.max(...parts.map(p=>p.length))<text.length/4,'no single piece holds most of the save');
 assert.deepEqual(JSON.parse(text),JSON.parse(JSON.stringify(payload)));
});

test('odd values are written the way JSON writes them',async()=>{
 const e=await world(),many=Array.from({length:450},(_,i)=>i%7===0?undefined:{i});
 const payload={version:'x',skip:undefined,universe:{many,none:null,empty:[],nested:{many:[1,2,3]},fn(){},text:'a "quoted"   line'}};
 assert.deepEqual(JSON.parse(e.saveJsonParts(payload).join('')),JSON.parse(JSON.stringify(payload)));
});

test('a compressed backup is about a ninth of the size and reads back whole',async()=>{
 const e=await world(),payload={version:e.APP_VERSION,userTeam:'Chicago Metropolitan',universe:e.packUniverse(e.universe)};
 const text=e.saveJsonParts(payload).join(''),zipped=zlib.gzipSync(text);
 assert.ok(zipped.length<text.length/5,`gzip saved too little: ${text.length} to ${zipped.length}`);
 // The reader recognises gzip by its first two bytes and falls back to plain text otherwise.
 const file=bytes=>({slice:(a,b)=>({arrayBuffer:async()=>bytes.subarray(a,b).buffer.slice(bytes.byteOffset+a,bytes.byteOffset+b)}),stream:()=>new (require('node:buffer').Blob)([bytes]).stream()});
 const back=await e.saveFileText(file(zipped));
 assert.equal(back.length,text.length);assert.deepEqual(JSON.parse(back).universe.year,payload.universe.year);
 await assert.rejects(e.saveFileText(file(zipped.subarray(0,zipped.length>>1))),/damaged or incomplete/,'a truncated backup is refused, not half-loaded');
});
