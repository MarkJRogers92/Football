// v0.18 — what a player sees when the game breaks. Loaded before everything else so it also catches a failure while
// the game is starting. It never touches the dynasty: it records the error on this device, says so in plain words,
// and offers a reload from the last saved checkpoint. Nothing is sent anywhere.
(function(){
  'use strict';
  if(typeof window==='undefined'||window.DynastyCrashGuard)return;
  const KEY='dynastyLabErrorLog',LIMIT=20;
  // Noise that is not a fault in the game: browser layout chatter and errors from other origins (extensions).
  const IGNORED=[/ResizeObserver loop/i,/^Script error\.?$/i];
  let shown=false,panel=null;
  const version=()=>document.querySelector('[data-app-version]')?.textContent?.trim()||document.title.replace(/^Dynasty Lab\s*/,'')||'unknown';
  function read(){try{const rows=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(rows)?rows:[]}catch{return[]}}
  function write(rows){try{localStorage.setItem(KEY,JSON.stringify(rows.slice(-LIMIT)))}catch{}}
  function record(kind,message,stack,where){
    const text=String(message||'Unknown error').slice(0,500);
    if(IGNORED.some(rule=>rule.test(text)))return null;
    const entry={at:new Date().toISOString(),version:version(),kind,message:text,stack:String(stack||'').split('\n').slice(0,6).join('\n').slice(0,900),where:String(where||'').slice(0,200),
      screen:document.querySelector('.tab.active,[data-client-tab].active')?.textContent?.trim().slice(0,40)||'',status:document.querySelector('#weekLine')?.textContent?.trim().slice(0,60)||''};
    const rows=read();rows.push(entry);write(rows);return entry;
  }
  function report(entry){
    const rows=entry?[entry]:read().slice(-3);
    return['Dynasty Lab problem report',`Version: ${version()}`,`Browser: ${navigator.userAgent}`,`Window: ${innerWidth}x${innerHeight}`,'',
      ...rows.map(r=>[`When: ${r.at}`,`Where in the game: ${[r.screen,r.status].filter(Boolean).join(' · ')||'starting up'}`,`Error: ${r.message}`,r.where?`Source: ${r.where}`:'',r.stack?`Detail:\n${r.stack}`:'',''].filter(Boolean).join('\n'))].join('\n');
  }
  function button(label,primary){
    const b=document.createElement('button');b.type='button';b.textContent=label;
    b.style.cssText=`font:600 14px/1 system-ui,sans-serif;min-height:44px;padding:0 16px;border-radius:10px;cursor:pointer;border:1px solid ${primary?'#e9b949':'#3a4658'};background:${primary?'#e9b949':'#16202e'};color:${primary?'#16110a':'#eef3fc'}`;
    return b;
  }
  function show(entry){
    if(shown||!document.body)return;shown=true;
    panel=document.createElement('section');panel.id='crashGuard';panel.setAttribute('role','alertdialog');panel.setAttribute('aria-labelledby','crashGuardTitle');panel.setAttribute('aria-describedby','crashGuardText');
    panel.style.cssText='position:fixed;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483600;width:min(560px,calc(100vw - 24px));box-sizing:border-box;padding:18px;border-radius:14px;border:1px solid #e9b949;background:#0c131d;color:#eef3fc;box-shadow:0 18px 60px rgba(0,0,0,.6);font:400 15px/1.45 system-ui,sans-serif';
    const title=document.createElement('h2');title.id='crashGuardTitle';title.textContent='Something went wrong';title.style.cssText='margin:0 0 6px;font:700 18px/1.2 system-ui,sans-serif;color:#fff';
    const text=document.createElement('p');text.id='crashGuardText';text.style.cssText='margin:0 0 14px;color:#c6d0de';
    text.textContent='The game hit an error and this screen may not be reliable. Your last saved checkpoint is not affected. Reload to carry on from it.';
    const row=document.createElement('div');row.style.cssText='display:flex;flex-wrap:wrap;gap:8px';
    const reload=button('Reload from last checkpoint',true),copy=button('Copy details'),keep=button('Keep playing');
    const note=document.createElement('p');note.setAttribute('role','status');note.style.cssText='margin:10px 0 0;font-size:13px;color:#9ca8b8;min-height:1em';
    reload.onclick=()=>location.reload();
    keep.onclick=()=>{panel.remove();panel=null};
    copy.onclick=async()=>{
      const body=report(entry);
      try{await navigator.clipboard.writeText(body);note.textContent='Details copied. Paste them into your bug report.'}
      catch{
        const area=document.createElement('textarea');area.value=body;area.readOnly=true;area.setAttribute('aria-label','Problem details');
        area.style.cssText='width:100%;box-sizing:border-box;height:120px;margin-top:10px;background:#0a0f17;color:#c6d0de;border:1px solid #3a4658;border-radius:8px;font:12px/1.4 ui-monospace,monospace';
        if(!panel.querySelector('textarea'))panel.append(area);area.focus();area.select();note.textContent='Select and copy the details above.';
      }
    };
    row.append(reload,copy,keep);panel.append(title,text,row,note);document.body.append(panel);
    try{reload.focus({preventScroll:true})}catch{}
  }
  function handle(kind,message,stack,where){
    const entry=record(kind,message,stack,where);if(!entry)return;
    if(document.body)show(entry);else document.addEventListener('DOMContentLoaded',()=>show(entry),{once:true});
  }
  window.addEventListener('error',event=>{
    // Resource failures (an image that did not load) arrive here without an error object; they are not crashes.
    if(!event.error&&!event.message)return;
    handle('error',event.error?.message||event.message,event.error?.stack,event.filename?`${String(event.filename).split('/').pop()}:${event.lineno||0}`:'');
  });
  window.addEventListener('unhandledrejection',event=>{
    const reason=event.reason;handle('rejection',reason?.message||reason,reason?.stack,'');
  });
  window.DynastyCrashGuard={log:read,clear(){write([]);},report:()=>report(null),isShowing:()=>!!panel};
})();
