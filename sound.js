// Dynasty Lab sound: every cue is synthesized with Web Audio (no audio files, works offline).
// Cues follow real moments: week finals, live Game Day decisions and scores, signing day, ceremonies.
// Preferences live in localStorage (per device); automated browsers stay silent unless a test enables sound.
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{root.DynastySound=api;api.mount?.()}
})(typeof window!=='undefined'?window:this,function(){
'use strict';
const KEY='dynastyLabSound';
const automated=typeof navigator!=='undefined'&&!!navigator.webdriver;
let prefs={enabled:true,volume:.6};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&typeof saved==='object')prefs={enabled:saved.enabled!==false,volume:Math.min(1,Math.max(0,Number(saved.volume??.6)))}}catch(e){}
let ctx=null,master=null,noiseBuf=null,forced=null,crowdBed=null;
const log=[];
function active(){return(forced??(!automated))&&prefs.enabled&&prefs.volume>0}
function audio(){
 if(ctx)return ctx;const AC=typeof window!=='undefined'&&(window.AudioContext||window.webkitAudioContext);if(!AC)return null;
 ctx=new AC();master=ctx.createGain();master.gain.value=prefs.volume;master.connect(ctx.destination);
 const len=ctx.sampleRate*2;noiseBuf=ctx.createBuffer(1,len,ctx.sampleRate);const d=noiseBuf.getChannelData(0);
 // Brown-ish noise from a fixed linear-congruential sequence: no Math.random, same sound every time.
 let s=12345,last=0;for(let i=0;i<len;i++){s=(s*1103515245+12345)&0x7fffffff;const white=s/0x3fffffff-1;last=(last+.04*white)/1.04;d[i]=last*3.2+white*.18}
 return ctx;
}
function env(g,t,a,peak,hold,release){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),t+a);g.gain.setValueAtTime(Math.max(.0002,peak),t+a+hold);g.gain.exponentialRampToValueAtTime(.0001,t+a+hold+release)}
function noise(t,{dur=.3,type='bandpass',freq=1000,q=1,peak=.4,attack=.005,release=.2,dest=master}={}){
 const src=ctx.createBufferSource();src.buffer=noiseBuf;src.loop=true;const f=ctx.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;const g=ctx.createGain();env(g,t,attack,peak,Math.max(0,dur-attack-release),release);src.connect(f).connect(g).connect(dest);src.start(t,(t*7.3)%1.5);src.stop(t+dur+.05);return g;
}
function tone(t,{freq=440,dur=.3,type='sine',peak=.3,attack=.01,release=.15,detune=0,cutoff=0,dest=master}={}){
 const o=ctx.createOscillator();o.type=type;o.frequency.value=freq;o.detune.value=detune;const g=ctx.createGain();env(g,t,attack,peak,Math.max(0,dur-attack-release),release);
 if(cutoff){const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=cutoff;o.connect(f).connect(g)}else o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.05);return o;
}
const snare=(t,p=.35)=>{noise(t,{dur:.14,type:'highpass',freq:1800,peak:p,release:.12});tone(t,{freq:190,dur:.08,type:'triangle',peak:p*.5,release:.07})};
const kick=(t,p=.6)=>{const o=tone(t,{freq:110,dur:.28,peak:p,release:.24});o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(42,t+.25)};
// Brass-like chord: detuned saws through a lowpass that opens with the swell.
function horn(t,freqs,{dur=.5,peak=.12}={}){for(const f of freqs)for(const dt of[-7,7])tone(t,{freq:f,dur,type:'sawtooth',peak,attack:.03,release:Math.min(.3,dur*.5),detune:dt,cutoff:2200})}
const N={C4:261.6,D4:293.7,E4:329.6,F4:349.2,G4:392,A4:440,Bb4:466.2,C5:523.3,E5:659.3,G3:196,C3:130.8,Eb4:311.1,Ab3:207.7};
const CUES={
 whistle(t){const o=tone(t,{freq:2950,dur:.42,peak:.16,attack:.01,release:.08});const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=32;lg.gain.value=90;lfo.connect(lg).connect(o.frequency);lfo.start(t);lfo.stop(t+.45);noise(t,{dur:.42,type:'bandpass',freq:3000,q:4,peak:.05})},
 crowd(t,{dur=2.6,peak=.4}={}){noise(t,{dur,type:'bandpass',freq:700,q:.6,peak,attack:dur*.35,release:dur*.5});noise(t+.1,{dur:dur*.9,type:'bandpass',freq:2100,q:.9,peak:peak*.45,attack:dur*.3,release:dur*.5})},
 groan(t){noise(t,{dur:1.4,type:'lowpass',freq:500,peak:.18,attack:.15,release:1})},
 // A short fight-song sting: pickup, then a rising major line with drums under it.
 winSting(t){const b=.15;[[N.G4,0],[N.C5,1],[N.E5,2],[N.G4,3],[N.C5,4]].forEach(([f,i])=>horn(t+i*b,[f,f/2],{dur:i===4?.9:.18,peak:i===4?.1:.08}));horn(t+5*b,[N.C4,N.E4,N.G4,N.C5],{dur:1.1,peak:.07});[0,2,4].forEach(i=>snare(t+i*b,.25));kick(t+5*b,.55);snare(t+5*b,.35);CUES.crowd(t+.5,{dur:3,peak:.26})},
 lossTone(t){horn(t,[N.C4,N.Eb4,N.G3],{dur:1,peak:.06});CUES.groan(t+.1)},
 // Signing day drumline: two bars of cadence, then a roll and a hit.
 drumline(t){const b=.125,pat='x.x.xx.x x.xxx.x.';[...pat.replace(/ /g,'')].forEach((c,i)=>{if(c==='x')snare(t+i*b,.22+(i%4===0?.1:0))});[0,4,8,12].forEach(i=>kick(t+i*b,.45));for(let i=0;i<10;i++)snare(t+16*b+i*.045,.12+i*.015);kick(t+16*b+.5,.7);noise(t+16*b+.5,{dur:1.6,type:'highpass',freq:5000,peak:.12,release:1.4})},
 drumHit(t){kick(t,.5);snare(t,.25)},
 cymbal(t){noise(t,{dur:2.2,type:'highpass',freq:6000,peak:.16,attack:.6,release:1.4})},
 fanfare(t){CUES.cymbal(t);const b=.2;[[N.C4,N.E4,N.G4],[N.D4,N.F4,N.A4],[N.E4,N.G4,N.C5],[N.C4,N.E4,N.G4,N.C5]].forEach((ch,i)=>horn(t+.4+i*b*(i===3?1:1),ch,{dur:i===3?1.6:.22,peak:.07}));kick(t+.4+3*b,.6);CUES.crowd(t+.6,{dur:3.4,peak:.28})},
 click(t){tone(t,{freq:1400,dur:.04,type:'square',peak:.03,release:.03})}
};
function play(name,opts){
 if(!CUES[name])return false;log.push(name);if(log.length>200)log.shift();
 if(!active())return false;const c=audio();if(!c)return false;if(c.state==='suspended')c.resume?.();
 try{CUES[name](c.currentTime+.02,opts);return true}catch(e){return false}
}
// A low crowd bed under a live Game Day, faded in and out.
function bed(on){
 if(!active()||!audio()){if(!on&&crowdBed){crowdBed=null}return}
 if(on&&!crowdBed){const g=ctx.createGain();g.gain.value=.0001;g.connect(master);const src=ctx.createBufferSource();src.buffer=noiseBuf;src.loop=true;const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=650;f.Q.value=.5;src.connect(f).connect(g);src.start();g.gain.exponentialRampToValueAtTime(.05,ctx.currentTime+2);crowdBed={src,g};log.push('bed:on')}
 else if(!on&&crowdBed){const {src,g}=crowdBed;crowdBed=null;g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+1.2);src.stop(ctx.currentTime+1.3);log.push('bed:off')}
}
// Renders one cue to a 16-bit WAV (for previews and review), using an offline context; live audio is untouched.
async function renderWav(name,seconds=4){
 const OAC=typeof window!=='undefined'&&(window.OfflineAudioContext||window.webkitOfflineAudioContext);if(!OAC||!CUES[name])return null;
 const saved={ctx,master,noiseBuf};const off=new OAC(1,44100*seconds,44100);
 ctx=off;master=off.createGain();master.gain.value=.9;master.connect(off.destination);
 const len=off.sampleRate*2;noiseBuf=off.createBuffer(1,len,off.sampleRate);const d=noiseBuf.getChannelData(0);let s=12345,last=0;for(let i=0;i<len;i++){s=(s*1103515245+12345)&0x7fffffff;const white=s/0x3fffffff-1;last=(last+.04*white)/1.04;d[i]=last*3.2+white*.18}
 try{CUES[name](.05)}finally{({ctx,master,noiseBuf}=saved)}
 const buf=await off.startRendering(),pcm=buf.getChannelData(0),out=new DataView(new ArrayBuffer(44+pcm.length*2));
 const w=(o,str)=>{for(let i=0;i<str.length;i++)out.setUint8(o+i,str.charCodeAt(i))};
 w(0,'RIFF');out.setUint32(4,36+pcm.length*2,true);w(8,'WAVE');w(12,'fmt ');out.setUint32(16,16,true);out.setUint16(20,1,true);out.setUint16(22,1,true);out.setUint32(24,44100,true);out.setUint32(28,88200,true);out.setUint16(32,2,true);out.setUint16(34,16,true);w(36,'data');out.setUint32(40,pcm.length*2,true);
 for(let i=0;i<pcm.length;i++)out.setInt16(44+i*2,Math.max(-1,Math.min(1,pcm[i]))*32767,true);
 return out.buffer;
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch(e){}}
function setEnabled(v){prefs.enabled=!!v;save();if(!v)bed(false);sync()}
function setVolume(v){prefs.volume=Math.min(1,Math.max(0,Number(v)||0));if(master)master.gain.value=prefs.volume;save();sync()}
function sync(){
 const btn=typeof document!=='undefined'&&document.querySelector('#soundToggle');
 if(btn){btn.setAttribute('aria-pressed',String(prefs.enabled));btn.title=prefs.enabled?'Sound on':'Sound off';btn.classList.toggle('is-muted',!prefs.enabled)}
 const en=typeof document!=='undefined'&&document.querySelector('#titleSound');if(en)en.checked=prefs.enabled;
 const vol=typeof document!=='undefined'&&document.querySelector('#titleVolume');if(vol)vol.value=String(Math.round(prefs.volume*100));
}
// ---------- Triggers from real moments ----------
function mount(){
 if(typeof document==='undefined')return;
 const start=()=>{
  // Top-bar toggle next to the existing utility buttons.
  const place=()=>{const b=document.querySelector('#soundToggle'),pb=document.querySelector('.topbar .hud-playbook-trigger');if(b&&pb&&b.nextElementSibling!==pb)pb.before(b)};
  const top=document.querySelector('.topbar');if(top)new MutationObserver(place).observe(top,{childList:true,subtree:true});
  const actions=document.querySelector('.topbar .client-status')||document.querySelector('.topbar');
  if(actions&&!document.querySelector('#soundToggle')){const b=document.createElement('button');b.type='button';b.id='soundToggle';b.className='sound-toggle';b.setAttribute('aria-label','Sound');b.innerHTML='<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 6h3l4-3v10L5 10H2z"/><path class="sw" d="M11 5.5c1 .8 1 4.2 0 5M12.8 4c1.9 1.6 1.9 6.4 0 8"/><path class="sx" d="M11 6l4 4M15 6l-4 4"/></svg>';b.addEventListener('click',()=>{setEnabled(!prefs.enabled);if(prefs.enabled)play('click')});actions.append(b);place()}
  document.querySelector('#titleSound')?.addEventListener('change',e=>setEnabled(e.target.checked));
  document.querySelector('#titleVolume')?.addEventListener('input',e=>setVolume(Number(e.target.value)/100));
  document.querySelector('#titleVolume')?.addEventListener('change',()=>play('whistle'));
  sync();
  // Week finals (the same status line the result splash reads).
  const status=document.querySelector('#saveStatus');let last=status?.textContent||'';
  if(status)new MutationObserver(()=>{const v=status.textContent.trim();if(v===last)return;last=v;const m=v.match(/^(?:Week \d+|[A-Z][^:]{2,60}?) final: ([WL]) /);if(m)play(m[1]==='W'?'winSting':'lossTone');else if(/^Game Day recorded/.test(v))bed(false)}).observe(status,{childList:true,subtree:true,characterData:true});
  // Live Game Day: whistle on each head-coach decision, crowd on your scores, groan on theirs.
  let gd={decision:null,score:null,live:false};
  const watchGameDay=()=>{const host=document.querySelector('#v2InteractiveGameDay');if(!host)return;
   const live=!!host.querySelector('.v2-gameday-scoreboard')&&!/FINAL/.test(host.querySelector('.v2-gameday-head .eyebrow')?.textContent||'');
   if(live!==gd.live){gd.live=live;bed(live)}
   const dec=host.querySelector('.v2-gameday-decision h3')?.textContent||null;if(dec&&dec!==gd.decision)play('whistle');gd.decision=dec;
   const nums=[...host.querySelectorAll('.v2-gameday-scoreboard b')].map(b=>Number(b.textContent)||0);
   if(nums.length===2){const key=nums.join('-');if(gd.score&&key!==gd.score){const prev=gd.score.split('-').map(Number),side=document.querySelector('#v2InteractiveGameDay .v2-gameday-team.home span')?.textContent===document.querySelector('#teamName')?.textContent?1:0;play(nums[side]>prev[side]?'crowd':'groan')}gd.score=key}else gd.score=null};
  const attachGD=()=>{const h=document.querySelector('#v2InteractiveGameDay');if(h&&!h.dataset.soundWatch){h.dataset.soundWatch='1';new MutationObserver(watchGameDay).observe(h,{childList:true,subtree:true,characterData:true})}};
  new MutationObserver(attachGD).observe(document.querySelector('main')||document.body,{childList:true,subtree:true});attachGD();
  // Signing day reveals and ceremonies.
  const sd=document.querySelector('#signingDay');let sdText=sd?.textContent||'';
  if(sd)new MutationObserver(()=>{const v=sd.textContent;if(v!==sdText&&/reveal|signed|flip/i.test(v))play('drumHit');sdText=v}).observe(sd,{childList:true,subtree:true});
  new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes){if(n.nodeType!==1||!n.classList?.contains('ceremony'))continue;
   if(n.classList.contains('is-signing'))play('drumline');else if(n.classList.contains('is-draft'))play('winSting');else play('fanfare')}}).observe(document.body,{childList:true});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
return{play,bed,renderWav,setEnabled,setVolume,mount,cues:Object.keys(CUES),log,get enabled(){return prefs.enabled},get volume(){return prefs.volume},enableForTests(v=true){forced=v}};
});
