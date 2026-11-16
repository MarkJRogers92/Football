// Call Sheet slice: sound, particles, tweens and screen shake. No dependencies.
(function(root){
'use strict';
const reduce=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const FX={reduce,speed:1,skipping:false};

// ---------------------------------------------------------------- timing
FX.wait=ms=>new Promise(r=>setTimeout(r,FX.skipping?0:ms*FX.speed));
FX.tween=(ms,fn,ease=t=>t)=>new Promise(res=>{
  const dur=FX.skipping?0:ms*FX.speed;if(dur<=0){fn(1);res();return}
  const t0=performance.now();const step=now=>{const t=Math.min(1,(now-t0)/dur);fn(ease(t));if(t<1&&!FX.skipping)requestAnimationFrame(step);else{fn(1);res()}};requestAnimationFrame(step);
});
FX.ease={out:t=>1-Math.pow(1-t,3),in:t=>t*t*t,inOut:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,back:t=>{const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)}};
FX.anim=(el,frames,opts)=>{
  if(!el)return Promise.resolve();
  const dur=FX.skipping?1:(typeof opts==='number'?opts:opts.duration)*FX.speed;
  const a=el.animate(frames,{fill:'forwards',easing:'cubic-bezier(.2,.8,.2,1)',...(typeof opts==='object'?opts:{}),duration:Math.max(1,dur)});
  return a.finished.catch(()=>{});
};
FX.shake=(el,power=1)=>{
  if(reduce||FX.skipping||!el)return;
  const p=8*power,frames=[];for(let i=0;i<8;i++)frames.push({transform:`translate(${(Math.random()*2-1)*p*(1-i/8)}px,${(Math.random()*2-1)*p*(1-i/8)}px)`});frames.push({transform:'none'});
  el.animate(frames,{duration:380+power*80});
};

// ---------------------------------------------------------------- sound (synthesized)
const S={ctx:null,on:true,master:null};
S.init=()=>{if(S.ctx)return;try{const C=root.AudioContext||root.webkitAudioContext;if(!C)return;S.ctx=new C();S.master=S.ctx.createGain();S.master.gain.value=.55;S.master.connect(S.ctx.destination)}catch(e){S.ctx=null}};
const live=()=>S.on&&S.ctx&&!FX.skipping;
S.tone=(freq,dur=.12,type='sine',gain=.25,slide=0,delay=0)=>{
  if(!live())return;const c=S.ctx,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*slide),t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.008);g.gain.exponentialRampToValueAtTime(.0008,t+dur);
  o.connect(g);g.connect(S.master);o.start(t);o.stop(t+dur+.05);
};
let noiseBuf=null;
S.noise=(dur=.3,freq=1200,gain=.3,q=1,sweep=1,type='bandpass',delay=0)=>{
  if(!live())return;const c=S.ctx;
  if(!noiseBuf){noiseBuf=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  const t=c.currentTime+delay,src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  src.buffer=noiseBuf;f.type=type;f.Q.value=q;f.frequency.setValueAtTime(freq,t);f.frequency.exponentialRampToValueAtTime(Math.max(40,freq*sweep),t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+Math.min(.05,dur/4));g.gain.exponentialRampToValueAtTime(.0008,t+dur);
  src.connect(f);f.connect(g);g.connect(S.master);src.start(t,Math.random());src.stop(t+dur+.05);
};
S.thump=(p=1)=>{S.tone(90,.25,'sine',.6*p,.4);S.noise(.12,500,.3*p,.7,.5,'lowpass')};
S.clash=()=>{S.thump(1.2);S.noise(.18,3000,.25,1.2,.4);S.tone(220,.08,'square',.08,.5)};
S.whoosh=()=>S.noise(.35,600,.22,1.4,6);
S.tick=i=>S.tone(500+i*38,.05,'square',.06);
S.chime=()=>{[784,988,1319].forEach((f,i)=>S.tone(f,.35,'triangle',.18,1,i*.07))};
S.fanfare=()=>{[523,659,784,1047].forEach((f,i)=>S.tone(f,.4,'sawtooth',.09,1,i*.09));S.crowd(1.6,.5)};
S.crowd=(dur=1.4,gain=.35)=>{S.noise(dur,900,gain,.5,.7,'bandpass');S.noise(dur*.9,2400,gain*.35,.6,.8,'bandpass',.05)};
S.groan=()=>{S.noise(.9,400,.25,.6,.6,'lowpass');S.tone(180,.6,'sawtooth',.05,.6)};
S.whistle=()=>{S.tone(2600,.25,'sine',.12,1.02);S.tone(2650,.25,'sine',.08,1.02,.02)};
S.rip=()=>{S.noise(.45,2500,.4,2,.3,'highpass');S.noise(.2,800,.3,1,2)};
S.burn=()=>S.noise(.7,1800,.18,.8,.3,'bandpass');
S.rattle=i=>S.noise(.09,1500+i*400,.15+i*.05,3,1.2,'bandpass');
S.error=()=>S.tone(160,.15,'square',.08,.8);
S.fire=()=>{S.noise(.8,700,.3,.6,2.2,'bandpass');S.tone(330,.5,'sawtooth',.06,2)};
FX.sfx=S;

// ---------------------------------------------------------------- particles
const P={canvas:null,ctx:null,parts:[],running:false};
P.mount=canvas=>{P.canvas=canvas;P.ctx=canvas.getContext('2d');const fit=()=>{canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio};fit();addEventListener('resize',fit)};
P.burst=(x,y,o={})=>{
  if(reduce||FX.skipping||!P.ctx)return;const n=o.n??40,colors=o.colors||['#f2d34c','#fff6d5','#e08a3c'];
  for(let i=0;i<n;i++){
    const a=(o.angle??-Math.PI/2)+(Math.random()-.5)*(o.spread??Math.PI*2),sp=(o.speed??7)*(.4+Math.random());
    P.parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,g:o.gravity??.18,life:o.life??60+Math.random()*40,age:0,size:(o.size??4)*(.6+Math.random()*.8),
      color:colors[i%colors.length],shape:o.shape||'spark',rot:Math.random()*6,vr:(Math.random()-.5)*.4,drag:o.drag??.985});
  }
  if(!P.running){P.running=true;requestAnimationFrame(P.loop)}
};
P.confetti=(n=160)=>{for(let i=0;i<5;i++)P.burst(innerWidth*(.1+.2*i),innerHeight*.15,{n:n/5,shape:'rect',gravity:.12,speed:9,spread:Math.PI*1.2,angle:Math.PI/2,size:7,life:170,colors:['#f2d34c','#e05a4f','#4fa3c7','#7fc46a','#fff6d5','#b07ad6'],drag:.99})};
P.embers=(x,y,w=120)=>P.burst(x,y,{n:40,shape:'ember',gravity:-.05,speed:2.2,spread:Math.PI,angle:-Math.PI/2,size:3,life:90,colors:['#ff9a3c','#ffd36b','#ff5a2a']});
P.loop=()=>{
  const c=P.ctx,dpr=devicePixelRatio;c.clearRect(0,0,P.canvas.width,P.canvas.height);
  P.parts=P.parts.filter(p=>p.age<p.life);
  for(const p of P.parts){
    p.age++;p.vx*=p.drag;p.vy=p.vy*p.drag+p.g;p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;
    const a=1-p.age/p.life;c.globalAlpha=Math.max(0,a);c.fillStyle=p.color;
    if(p.shape==='rect'){c.save();c.translate(p.x*dpr,p.y*dpr);c.rotate(p.rot);c.fillRect(-p.size*dpr/2,-p.size*dpr/4,p.size*dpr,p.size*dpr/2);c.restore()}
    else{c.beginPath();c.arc(p.x*dpr,p.y*dpr,p.size*dpr*(p.shape==='ember'?a:1),0,Math.PI*2);c.fill()}
  }
  c.globalAlpha=1;
  if(P.parts.length)requestAnimationFrame(P.loop);else P.running=false;
};
FX.particles=P;

root.SliceFX=FX;
})(typeof window==='object'?window:globalThis);
