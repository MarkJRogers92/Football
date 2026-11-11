'use strict';

// v0.22: the web build installs and plays offline, and its security policy blocks nothing the game needs.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {startNewDynasty}=require('./helpers/start-new-dynasty');

const root=path.join(__dirname,'..');
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
function serve(){
 const server=http.createServer((req,res)=>{
  const url=decodeURIComponent(new URL(req.url,'http://x').pathname),rel=url==='/'?'index.html':url.slice(1),file=path.join(root,rel);
  if(!file.startsWith(root)||!/^(index\.html|sw\.js|manifest\.webmanifest|assets\/)/.test(rel)||!fs.existsSync(file)){res.writeHead(404);res.end();return}
  res.writeHead(200,{'Content-Type':TYPES[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
 });
 return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server)));
}

(async()=>{
 const version=fs.readFileSync(path.join(root,'VERSION.txt'),'utf8').trim();
 assert.ok(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes(`const VERSION='${version}'`),'sw.js is generated for the current version (run npm run build)');
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
 for(const icon of manifest.icons)assert.ok(fs.existsSync(path.join(root,icon.src)),`manifest icon ${icon.src} exists`);
 const server=await serve(),base=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage(),problems=[];
  page.on('pageerror',error=>problems.push(String(error)));
  page.on('console',message=>{if(message.type()==='error'||/Content Security Policy/i.test(message.text()))problems.push(message.text())});
  page.on('requestfailed',request=>problems.push(`failed ${request.url()}`));
  await page.goto(base);
  assert.equal(await page.locator('link[rel=manifest]').getAttribute('href'),'manifest.webmanifest');
  assert.match(await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content'),/default-src 'self'/);
  await page.waitForFunction(async()=>!!(await navigator.serviceWorker.getRegistration())?.active,null,{timeout:30000});
  await page.waitForFunction(async v=>(await caches.keys()).includes(`dynasty-lab-${v}`),version,{timeout:30000});
  // Play: a new dynasty, every piece of art, a week. Nothing may be blocked.
  await startNewDynasty(page);
  await page.evaluate(()=>window.__DL_TEST__.goToTab('gamelab'));await page.waitForTimeout(500);
  await page.evaluate(()=>window.__DL_TEST__.goToTab('dashboard'));
  assert.equal(await page.evaluate(()=>document.fonts.check('800 20px "Barlow Condensed"')),true,'the display font loaded under the policy');
  assert.deepEqual(problems,[],'nothing was blocked or failed online');

  // Offline: a cold reload still starts the game and finds the saved dynasty.
  await page.waitForFunction(()=>window.DynastySessionStatus?.read().state==='saved',null,{timeout:60000});
  await context.setOffline(true);problems.length=0;
  await page.reload();await page.waitForSelector('#titleContinue:not([disabled])',{timeout:30000});
  assert.match(await page.locator('#titleContinueMeta').innerText(),/2027/,'the saved dynasty is offered offline');
  await page.click('#titleContinue');await page.locator('#app').waitFor({state:'visible'});
  const helmet=await page.evaluate(()=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(true);img.onerror=()=>resolve(false);img.src='assets/team-helmets-meshy-atlas-128.webp'}));
  assert.equal(helmet,true,'art is served from the cache offline');
  assert.deepEqual(problems.filter(p=>!/favicon/.test(p)),[],'nothing failed offline');
  console.log(`PWA browser test passed (v${version}: installs, policy clean, plays offline)`);
 }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);process.exit(1)});
