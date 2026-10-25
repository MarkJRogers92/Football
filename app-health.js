// v0.12.10 — environment honesty for the shell: what the saves actually cost on
// this device, and whether a newer desktop release exists. Read-only: it never
// touches save state, gameplay RNG or the archive.
(function(){
  'use strict';
  const fmt=n=>{if(!Number.isFinite(n)||n<=0)return '—';const mb=n/1048576;return mb>=1024?`${(mb/1024).toFixed(1)} GB`:`${mb>=10?mb.toFixed(0):mb.toFixed(1)} MB`};
  const shell=globalThis.DynastyDesktopShell;

  // ---- Save storage usage, shown in Options ----
  async function paintStorage(){
    const panel=document.querySelector('#titleOptionsPanel');
    if(!panel)return;
    let line=panel.querySelector('#storageUsage');
    if(!line){
      line=document.createElement('div');
      line.id='storageUsage';line.className='storage-usage';
      const anchor=panel.querySelector('#titleSaveOptions');
      if(anchor)anchor.insertAdjacentElement('beforebegin',line);else panel.append(line);
    }
    line.textContent='Checking save storage…';
    if(shell?.isDesktop){
      const usage=await shell.saveUsage?.().catch(()=>null);
      const bytes=usage?.bytes;
      if(Number.isFinite(bytes)){
        line.dataset.level=bytes>=2*1024*1024*1024?'warn':'ok';
        line.textContent=`Dynasty saves on this computer use ${fmt(bytes)}.`
          + (bytes>=2*1024*1024*1024?' Export a JSON backup — this install is getting large.':' Export a JSON backup before replacing the app.');
        return;
      }
      line.textContent='Save storage estimate is not available in this build.';
      return;
    }
    try{
      const est=await navigator.storage?.estimate?.();
      if(!est||!Number.isFinite(est.usage)){line.textContent='Save storage estimate is not available in this build.';return}
      const quota=est.quota?` of about ${fmt(est.quota)} available`:'';
      const pct=est.quota?Math.round(est.usage/est.quota*100):0;
      line.dataset.level=pct>=70?'warn':'ok';
      line.textContent=`Dynasty saves on this device use ${fmt(est.usage)}${quota}.`
        + (pct>=70?' Export a JSON backup now — this device is close to its storage limit.':' Export a JSON backup before switching builds.');
    }catch{line.textContent='Save storage estimate is not available in this build.'}
  }
  document.addEventListener('click',event=>{
    if(event.target.closest?.('#titleOptions'))setTimeout(paintStorage,60);
  });

  // ---- Desktop update notice (Electron shell only) ----
  if(!shell?.isDesktop)return;
  const parts=value=>String(value||'').replace(/^v/i,'').split('.').map(n=>parseInt(n,10)||0);
  const isNewer=(a,b)=>{for(let i=0;i<3;i++){if((a[i]||0)!==(b[i]||0))return (a[i]||0)>(b[i]||0)}return false};
  async function check(){
    let current='';
    try{current=typeof APP_VERSION==='string'?APP_VERSION:(document.querySelector('[data-title-version]')?.textContent||'')}catch{}
    if(!/^\d+\./.test(String(current).replace(/^v/i,'')))return;
    try{
      // The shell performs the request in the main process; a blocked update check
      // must never surface as a renderer console error.
      const data=await shell.latestRelease?.().catch(()=>null);
      const tag=data?.tag;
      if(!tag||!isNewer(parts(tag),parts(current)))return;
      const host=document.querySelector('#titleScreen');
      if(!host)return;
      let line=host.querySelector('#desktopUpdate');
      if(!line){
        line=document.createElement('p');line.id='desktopUpdate';line.className='desktop-update';
        const anchor=host.querySelector('[data-title-version]');
        (anchor?.parentElement||host).append(line);
      }
      line.replaceChildren();
      const button=document.createElement('button');
      button.type='button';button.className='desktop-update-link';
      button.textContent=`Dynasty Lab ${tag} is available — download`;
      button.addEventListener('click',()=>shell.openExternal(data.url||`https://github.com/MarkJRogers92/Football/releases/tag/${tag}`));
      line.append(button);
    }catch{}
  }
  setTimeout(check,1200);
})();
