const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const root=path.resolve(__dirname,'..');
const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));fs.readFile(f,(e,b)=>{if(e){s.writeHead(404);return s.end()}s.writeHead(200,{'Content-Type':f.endsWith('.js')?'text/javascript':f.endsWith('.html')?'text/html':'application/octet-stream'});s.end(b)})}).listen(8765);
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:512,height:512}});
p.on('console',m=>console.log('console',m.text()));p.on('pageerror',e=>console.log('err',e.message));
for(const job of JSON.parse(process.argv[2])){const [name,params]=job;await p.goto(`http://localhost:8765/render/index.html?${params&&params.startsWith('proc')?params:`glb=/glb/${name}.glb&${params||''}`}`);await p.waitForFunction('window.DONE',null,{timeout:120000});
fs.mkdirSync(path.join(root,'png'),{recursive:true});await p.locator('canvas').screenshot({path:path.join(root,'png',name+'.png'),omitBackground:true});console.log('shot',name)}
await b.close();srv.close()})();
