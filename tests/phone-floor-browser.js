'use strict';

// v0.21: at phone width every control on every screen is a full-size touch target and no text is too small to read.
// Controls are 44px (the four top-bar icon buttons are 40px so the program, record and week still fit). Text is 12px;
// a handful of labels the stylesheet cannot single out sit at 11px, and nothing is smaller.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {testPageURL}=require('./helpers/browser-url');
const {startNewDynasty}=require('./helpers/start-new-dynasty');

const SCREENS=['dashboard','newsletter','program','roster','depth','development','staff','offseason','recruiting','gamelab','season','stats','history','records','legacy'];

function scan(){
 const shown=el=>{if(!el.offsetParent)return false;const r=el.getBoundingClientRect();if(r.width<=0||r.height<=0)return false;for(let n=el;n;n=n.parentElement)if(n.tagName==='DETAILS'&&!n.open&&!(el.tagName==='SUMMARY'&&el.parentElement===n))return false;return true};
 const name=el=>`${el.tagName.toLowerCase()}${el.id?'#'+el.id:''}${typeof el.className==='string'&&el.className?'.'+el.className.trim().split(/\s+/)[0]:''}`;
 const controls=[...document.querySelectorAll('button,a[href],select,summary,[role=button],[role=tab],input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range])')].filter(shown);
 const topbar=el=>!!el.closest('.topbar');
 const small=controls.filter(el=>{const r=el.getBoundingClientRect(),min=topbar(el)?39.5:43.5;return r.height<min||r.width<min}).map(el=>`${name(el)} ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`);
 const unnamed=controls.filter(el=>!((el.innerText||'').trim()||el.getAttribute('aria-label')||el.getAttribute('title')||el.getAttribute('aria-labelledby')||el.placeholder||(el.labels&&el.labels.length)||el.closest('label'))).map(name);
 const text=[...document.querySelectorAll('body *')].filter(el=>shown(el)&&[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>1)).map(el=>({el:name(el),size:parseFloat(getComputedStyle(el).fontSize)})).filter(x=>x.size>0);
 return{small,unnamed,under11:text.filter(x=>x.size<10.99).map(x=>`${x.el} ${x.size}`),under12:text.filter(x=>x.size<11.99).length,overflow:document.documentElement.scrollWidth>innerWidth+1};
}

(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(testPageURL());
  await startNewDynasty(page);
  let under12=0;
  for(const screen of SCREENS){
   await page.evaluate(id=>window.__DL_TEST__.goToTab(id),screen);await page.waitForTimeout(200);
   const result=await page.evaluate(scan);
   assert.deepEqual(result.small,[],`${screen}: controls under the touch-target floor`);
   assert.deepEqual(result.unnamed,[],`${screen}: controls with no name`);
   assert.deepEqual(result.under11,[],`${screen}: text under 11px`);
   assert.equal(result.overflow,false,`${screen}: the page scrolls sideways`);
   under12+=result.under12;
  }
  assert.ok(under12<=30,`text under 12px across all screens should stay a handful, saw ${under12}`);
  // The disclosure marker survives: a summary is still a list item, not a flex box.
  await page.evaluate(()=>window.__DL_TEST__.goToTab('dashboard'));
  assert.equal(await page.locator('summary').first().evaluate(el=>getComputedStyle(el).display),'list-item');
  assert.deepEqual(errors,[]);

  // Desktop is untouched by the phone floor.
  const wide=await browser.newPage({viewport:{width:1280,height:900}});
  await wide.goto(testPageURL());await startNewDynasty(wide);
  const tab=await wide.locator('.client-nav-item').first().boundingBox();
  assert.ok(tab.height<44,'desktop navigation keeps its compact rows');
  console.log(`Phone floor browser test passed (${SCREENS.length} screens, ${under12} labels at 11px)`);
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
