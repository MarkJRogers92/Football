// Game Cast field: an angled, broadcast-style 3D replay of a saved play log (v0.12.6).
// Plain canvas 2D under a perspective camera on the near sideline; no libraries. The data is the
// compact rows that v2PlayLogProjection() writes to universe.playLogs (keys documented there).
// The replay only reads those rows: it never changes a game, a score or a stat.
(function(){
'use strict';
const FIELD_W=160/3,MID_Y=FIELD_W/2,HASH_Y=[20,FIELD_W-20];
const ORD=['','1st','2nd','3rd','4th'];
const clampN=(n,a,b)=>Math.max(a,Math.min(b,n));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const easeOut=t=>1-Math.pow(1-t,3);
const seg=(t,a,b)=>clampN((t-a)/(b-a),0,1);
const esc=s=>typeof gameEscape==='function'?gameEscape(s):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sideKey=sd=>sd==='h'?'home':sd==='a'?'away':null;
const other=s=>s==='home'?'away':'home';
// Field x runs 0..100 from the away goal line (left) to the home goal line (right), as in Game Cast;
// world x adds the 10-yard end zones. Away drives left to right, home right to left, all game.
const fieldX=(side,p)=>side==='away'?p:100-p;
const worldX=(side,p)=>10+fieldX(side,p);
const dirOf=side=>side==='away'?1:-1;
const SNAP_KINDS=new Set(['run','pass','inc','sack','int','fumble','punt','fg']);
function hash(v){let h=2166136261;for(const ch of String(v??''))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0}
function clockText(c){c=Math.max(0,Math.round(Number(c)||0));return `${Math.floor(c/60)}:${String(c%60).padStart(2,'0')}`}
function periodText(q){return q>4?`OT${q>5?q-4:''}`:`Q${q||1}`}
function spotText(p){p=Math.round(p);return p===50?'Midfield':p<50?`Own ${p}`:`Opp ${100-p}`}
function yardsText(y){return y>0?`for ${y} yard${y===1?'':'s'}`:y<0?`for a loss of ${-y}`:'for no gain'}
function quarterName(q){return q>4?'overtime':`${ORD[q]||q+'th'} quarter`}
// Seconds since kickoff, matching the win-probability chart's clock.
function elapsedOf(q,c){q=q||1;c=Number(c)||0;return q<=4?(q-1)*900+(900-c):3600+(q-5)*300+(300-Math.min(c,300))}

// ---- Timeline: one step per row, with the game state before and after it ----
function timeline(rows,meta={}){
 const nm=id=>(id!=null&&meta.names?.[id])||null,team=s=>meta[s]?.name||(s==='home'?'Home':'Away');
 const steps=[],drives=[];let score={home:0,away:0},q=1,c=900,poss=null,spot=25,drive=null,lastSnap=null;
 const openDrive=(side,start,si)=>{drive={index:drives.length,side,start:si,end:si,plays:0,yards:0,result:'',points:0,startSpot:start,snaps:[]};drives.push(drive)};
 for(const [ri,r] of (rows||[]).entries()){
  const side=sideKey(r.sd),pre={score:{...score},q,c,poss,spot};
  const s={i:steps.length,row:ri,t:r.t,side,pre,kind:'mark',big:false,key:false,text:'',banner:null,seq:r.s};
  const a=r.a||{};
  if(['scrimmage','interception','fumble','punt','field_goal'].includes(r.t)&&side&&(!drive||drive.side!==side))openDrive(side,r.p??spot,s.i);
  switch(r.t){
   case 'kickoff':
    poss=side;spot=r.p??25;openDrive(side,spot,s.i);s.kind='cut';s.label='Touchback';s.text=`Kickoff through the end zone. ${team(side)} start at their own ${spot}.`;break;
   case 'possession_change':
    {const ended=drive;poss=side;spot=r.p??spot;if(side&&(!drive||drive.side!==side))openDrive(side,spot,s.i);s.kind='cut';
    if(r.r==='turnover_on_downs'){s.text=`Turnover on downs. ${team(side)} take over at the ${spotText(spot).toLowerCase()}.`;s.key=true;s.banner={text:'TURNOVER ON DOWNS',side};if(ended&&ended!==drive)ended.result='DOWNS'}
    else s.text=`${team(side)} ball at the ${spotText(spot).toLowerCase()}.`;
    break}
   case 'overtime_possession':
    poss=side;spot=r.p??75;openDrive(side,spot,s.i);s.kind='cut';s.text=`Overtime possession: ${team(side)} from the ${spotText(spot).toLowerCase()}.`;break;
   case 'overtime_start':s.kind='card';s.card='Overtime';s.text='Overtime.';s.key=true;if(Number.isFinite(r.p))spot=r.p;break;
   case 'scrimmage':case 'interception':case 'fumble':{
    const p=r.p??spot,y=Number(r.y)||0,end=clampN(p+y,0,100);poss=side;
    s.kind=r.t==='interception'?'int':r.t==='fumble'?'fumble':r.sk?'sack':r.k==='p'?(r.cp?'pass':'inc'):'run';
    Object.assign(s,{los:p,y,end,down:r.dn||1,toGo:r.ds||10,actors:a,k:r.k||null,sk:!!r.sk});
    const qb=nm(a.qb)||'The quarterback',tg=nm(a.tg),ca=nm(a.ca),tk=nm(a.tk);
    if(s.kind==='run')s.text=`${ca||team(side)} ${a.ca&&a.ca===a.qb?'keeps':'runs'} ${yardsText(y)}${tk?`; tackle by ${tk}`:''}.`;
    else if(s.kind==='pass')s.text=`${qb} to ${tg||'a receiver'} ${yardsText(y)}${tk?`; tackle by ${tk}`:''}.`;
    else if(s.kind==='inc')s.text=`${qb} incomplete${tg?` for ${tg}`:''}${a.dr?' (dropped)':a.pb?`; broken up by ${nm(a.pb)||'the defense'}`:''}.`;
    else if(s.kind==='sack')s.text=`${nm(a.sb)||team(other(side))} sacks ${qb} ${yardsText(y)}.`;
    else if(s.kind==='int')s.text=`INTERCEPTED. ${nm(a.ib)||team(other(side))} picks off ${qb}${tg?` targeting ${tg}`:''}.`;
    else s.text=`FUMBLE. ${ca||qb} loses it; ${nm(a.ff)||team(other(side))} forces it and ${team(other(side))} recover.`;
    if(drive){drive.plays++;drive.yards+=s.kind==='int'?0:y;drive.snaps.push(s.i)}
    const turnover=s.kind==='int'||s.kind==='fumble';
    if(turnover){s.big=true;s.banner={text:s.kind==='int'?'INTERCEPTION':'FUMBLE',side:other(side)};if(drive)drive.result=s.kind==='int'?'INT':'FUMBLE'}
    else if(y>=20&&end<100){s.big=true;s.banner={text:`BIG PLAY · ${y} YARDS`,side}}
    else if(s.kind==='sack'&&s.down>=3){s.big=true;s.banner={text:'SACK',side:other(side)}}
    else if(s.down>=3&&s.toGo>=7&&y>=s.toGo&&end<100){s.big=true;s.banner={text:`${ORD[s.down].toUpperCase()}-DOWN CONVERSION`,side}}
    spot=end;lastSnap=s.i;break}
   case 'punt':{
    const p=r.p??spot,n=Number(r.n)||40;Object.assign(s,{kind:'punt',los:p,net:n,tb:!!r.tb,down:r.dn||4,toGo:r.ds||10,actors:a});
    s.text=`${nm(a.pt)||team(side)} punts ${n} yards${r.tb?' into the end zone for a touchback':''}.`;if(drive){drive.result='PUNT';drive.snaps.push(s.i)}lastSnap=s.i;break}
   case 'field_goal':{
    const p=r.p??spot;Object.assign(s,{kind:'fg',los:p,dist:Number(r.fd)||0,made:!!r.m,down:r.dn||4,toGo:r.ds||10,actors:a});
    s.text=`${nm(a.kk)||team(side)} ${s.dist}-yard field goal is ${s.made?'GOOD':'NO GOOD'}.`;
    s.banner={text:s.made?'FIELD GOAL':'NO GOOD',side:s.made?side:other(side)};if(!s.made)s.big=true;
    if(drive){drive.result=s.made?'FG':'MISS';if(s.made)drive.points+=3;drive.snaps.push(s.i)}lastSnap=s.i;break}
   case 'touchdown':s.kind='score';s.from=lastSnap;s.big=true;s.banner={text:'TOUCHDOWN',side};s.text=`Touchdown, ${team(side)}.`;if(drive){drive.result='TD';drive.points+=6}spot=100;break;
   case 'extra_point':s.kind='after';s.from=lastSnap;s.text=`Extra point ${r.m?'good':'no good'}.`;if(drive&&r.m)drive.points+=1;break;
   case 'two_point':s.kind='after';s.from=lastSnap;s.text=`Two-point try ${r.m?'good':'fails'}.`;if(drive&&r.m)drive.points+=2;break;
   case 'safety':s.kind='score';s.from=lastSnap;s.big=true;s.banner={text:'SAFETY',side};s.text=`Safety. Two points for ${team(side)}.`;if(drive){drive.result='SAFETY'}break;
   case 'halftime':s.kind='card';s.card='Halftime';s.text='Halftime.';break;
   case 'period_end':if(r.q===1||r.q===3){s.kind='card';s.card=`End of ${quarterName(r.q)}`;s.text=`End of the ${quarterName(r.q)}.`}break;
   case 'game_end':s.kind='card';s.card='Final';s.key=true;s.text='Final.';break;
  }
  if(r.sc)score={home:r.sc[0],away:r.sc[1]};
  if(Number.isFinite(r.q))q=r.q;if(Number.isFinite(r.c))c=r.c;
  s.post={score:{...score},q,c,poss,spot};s.drive=drive?drive.index:-1;if(drive)drive.end=s.i;
  // A score late in the 4th quarter or in overtime that ties the game or takes the lead.
  if(side&&(s.kind==='score'||s.kind==='after'||(s.kind==='fg'&&s.made))&&((pre.q===4&&pre.c<=240)||pre.q>4)){
   const before=pre.score[side]-pre.score[other(side)],after=score[side]-score[other(side)];
   if(before<=0&&after>=0&&after!==before){s.big=true;s.clutch=after===0?'TIE':'LEAD';if(s.kind!=='score')s.banner={text:after===0?'TYING SCORE':'GO-AHEAD SCORE',side}}
  }
  s.key=s.key||s.big||s.kind==='score'||(s.kind==='fg');
  s.elapsed=elapsedOf(pre.q,pre.c);
  steps.push(s);
 }
 return {steps,drives,final:score};
}
function isKey(s){return s.key}

// ---- Timing (ms at 1x): pre-snap, the play, the result ----
function durations(s){
 if(SNAP_KINDS.has(s.kind))return{pre:600,play:s.kind==='punt'?1700:s.kind==='fg'?1500:1200,post:s.big||s.banner?1500:500};
 if(s.kind==='cut')return{pre:0,play:0,post:s.banner?1500:800};
 if(s.kind==='score')return{pre:0,play:0,post:1500};
 if(s.kind==='after')return{pre:0,play:0,post:s.banner?1500:650};
 if(s.kind==='card')return{pre:0,play:0,post:1400};
 return{pre:0,play:0,post:0};
}
// Key-plays mode runs each key play faster, scaled so a whole game stays under 25 seconds.
function keyRate(tl){
 if(tl.keyRate)return tl.keyRate;
 const ms=tl.steps.filter(isKey).reduce((n,s)=>{const d=durations(s);return n+d.pre*.5+d.play+d.post},0);
 return tl.keyRate=Math.max(2.2,ms/25000);
}

// ---- Camera: elevated on the near sideline, looking across the field ----
function camera(W,H,x){
 const cy=-30,cz=34,ty=30,fl=Math.hypot(ty-cy,cz),f1=(ty-cy)/fl,f2=-cz/fl,u1=-f2,u2=f1;
 const off=(y,z)=>{const dy=y-cy,dz=z-cz;return(dy*u1+dz*u2)/(dy*f1+dz*f2)};
 // Fit the field's depth, but never show much more than ~58 yards across (46 on a phone): on wide screens the
 // camera moves in and keeps the middle of the field framed.
 const near=-off(-3,0),far=off(FIELD_W+4,0),fit=H*.9/(near+far),F=Math.max(fit,W*fl/(W<520?46:58)),horizon=F>fit*1.01?H*.56+off(MID_Y-3,0)*F:H*.07+far*F;
 const cam={W,H,F,x,cy,cz,f1,f2,u1,u2,horizon};
 cam.span=W/F*fl;return cam;
}
function project(cam,x,y,z=0){
 const dx=x-cam.x,dy=y-cam.cy,dz=z-cam.cz,Z=Math.max(.5,dy*cam.f1+dz*cam.f2),Y=dy*cam.u1+dz*cam.u2,s=cam.F/Z;
 return{x:cam.W/2+dx*s,y:cam.horizon-Y*s,s};
}
function clampCam(cam,x){const half=cam.span/2;return cam.span>=150?60:clampN(x,half-15,135-half)}

// ---- Formations and the play script ----
const OFFENSE=[['C',-.7,0],['LG',-.8,-1.3],['RG',-.8,1.3],['LT',-.9,-2.6],['RT',-.9,2.6],['TE',-1,3.9],['QB',-5,0],['RB',-6.5,-1.6],['X',-1,-15],['Z',-1,14],['SL',-1.6,-8.5]];
const DEFENSE=[['DE1',1.1,-3.4],['DT1',1,-1.1],['DT2',1,1.1],['DE2',1.1,3.4],['LB1',4.8,-4.5],['MLB',4.8,0],['LB2',4.8,4.5],['CB1',6.5,-15],['CB2',6.5,14],['S1',12.5,-7],['S2',12.5,7]];
const LINE=new Set(['C','LG','RG','LT','RT']),DLINE=new Set(['DE1','DT1','DT2','DE2']);
const ROUTES={X:14,Z:11,SL:8,TE:6,RB:3};
function ballLane(s){return MID_Y+[-3.4,0,3.4][(Number(s.seq)||0)%3]}
function formation(side,los,by,kind){
 const d=dirOf(side),L=worldX(side,los),fy=v=>clampN(by+v,1.4,FIELD_W-1.4),out=[];
 for(const [role,dx,dy] of OFFENSE){let x=dx,y=dy;if(kind==='punt'&&role==='QB')x=-13;if(kind==='punt'&&role==='RB')x=-5;if(kind==='fg'&&role==='QB'){x=-7;y=.6}if(kind==='fg'&&role==='RB'){x=-9.5;y=-1.6}if((kind==='punt'||kind==='fg')&&(role==='X'||role==='Z'))y=role==='X'?-6:6;out.push({team:side,role,x:L+d*x,y:fy(y)})}
 for(const [role,dx,dy] of DEFENSE){let x=dx,y=dy;if(kind==='punt'&&role==='S1'){x=40;y=0}if(kind==='fg'&&!DLINE.has(role)&&role!=='CB1'&&role!=='CB2'){x=Math.min(x,3)}out.push({team:other(side),role,x:L+d*x,y:fy(y)})}
 return{L,d,by,figs:out};
}
// Everything on the field at play progress t (0 pre-snap .. 1 whistle) for one snap step.
function scene(s,t){
 const side=s.side,base=formation(side,s.los,ballLane(s),s.kind),{L,d,by}=base,figs=base.figs.map(f=>({...f,x0:f.x,y0:f.y}));
 const get=r=>figs.find(f=>f.role===r&&f.team===side),getD=r=>{const f=figs.find(x=>x.role===r&&x.team!==side);if(f)f.fixed=true;return f};
 const h=hash(s.seq),qb=get('QB'),rb=get('RB'),ball={x:L,y:by,z:.15},trail=[];let carrier=null,flash=0,catchBy=null,label=null;
 const goalX=d>0?110:10,endX=s.end>=100?goalX+d*3:worldX(side,s.end);
 const receivers=['X','Z','SL','TE'],pickRecv=()=>{if(s.y<=3&&s.kind!=='inc'&&s.kind!=='int')return rb;const air=Math.abs(s.y);return get(air>18?receivers[h%2]:receivers[h%4])};
 const dropX=qb.x0-d*2.5,dropT=seg(t,0,.3);
 const defenders=figs.filter(f=>f.team!==side);
 let target=null,catchT=.62,catchPt=null,groundAt=null;
 const runLike=s.kind==='run'||(s.kind==='fumble'&&s.k!=='p');
 if(runLike){
  const keeper=s.actors?.ca&&s.actors.ca===s.actors.qb,runner=keeper?qb:rb,mx=L-d*4.2,my=by-.6*(keeper?0:1);
  const u=easeOut(seg(t,.2,s.kind==='fumble'?.7:1)),amp=((h&1)?1:-1)*Math.min(4,Math.abs(s.y)*.25+1),fumX=s.kind==='fumble'?worldX(side,s.end):endX;
  if(t<.2){const k=seg(t,.08,.2);runner.x=lerp(runner.x0,mx,keeper?0:k);runner.y=lerp(runner.y0,my,keeper?0:k);ball.x=lerp(qb.x0,runner.x,k);ball.y=lerp(qb.y0,runner.y,k);ball.z=1.1}
  else{runner.x=lerp(mx,fumX,u);runner.y=my+Math.sin(u*Math.PI)*amp;ball.x=runner.x;ball.y=runner.y;ball.z=1.05}
  carrier=runner;if(!keeper){qb.x=qb.x0-d*1.5*seg(t,.15,.5)}
  if(s.kind==='fumble'&&t>.72){const k=seg(t,.72,.92);ball.x=runner.x+d*1.3*k;ball.y=runner.y+.8*k;ball.z=.4+Math.sin(k*Math.PI)*1.3;carrier=null;groundAt={x:ball.x,y:ball.y}}
 }else if(['pass','inc','int','sack'].includes(s.kind)||s.kind==='fumble'){
  qb.x=lerp(qb.x0,dropX,ease(dropT));ball.x=qb.x;ball.y=qb.y;ball.z=1.4;carrier=qb;
  if(s.kind==='sack'||s.kind==='fumble'){
   const sacker=getD(['DE1','DE2','DT1'][h%3]),hitT=.55,stopX=worldX(side,s.end);
   sacker.x=lerp(sacker.x0,qb.x,ease(seg(t,.05,hitT)));sacker.y=lerp(sacker.y0,qb.y,ease(seg(t,.05,hitT)));
   if(t>hitT){const k=ease(seg(t,hitT,.8));qb.x=lerp(dropX,stopX,k);sacker.x=qb.x-d*.7;sacker.y=qb.y+.3;ball.x=qb.x;ball.z=lerp(1.4,.6,k)}
   if(t>hitT&&t<.8)flash=1-seg(t,hitT,.8);
   if(s.kind==='fumble'&&t>.78){const k=seg(t,.78,.95);ball.x=lerp(qb.x,qb.x+d*1.4,k);ball.y=qb.y+.9*k;ball.z=Math.sin(k*Math.PI)*1.4;carrier=null;groundAt={x:ball.x,y:ball.y}}
   target=null;
  }else{
   target=pickRecv();const air=s.kind==='int'?Math.max(4,s.y):s.kind==='inc'?8+h%16:s.y<=3?s.y-3:Math.round(s.y*(.55+(h%30)/100));
   const cx=s.kind==='int'?worldX(side,clampN(s.end,1,99)):L+d*air,cyy=clampN(target.y0+(target.y0<by?3:-3)*((h>>3)%2),2,FIELD_W-2);catchPt={x:cx,y:cyy};
   const rt=ease(seg(t,0,catchT));target.x=lerp(target.x0,cx,rt);target.y=lerp(target.y0,cyy,rt);
   for(const r of receivers.concat('RB')){const f=get(r);if(f&&f!==target){const k=ease(seg(t,0,.8));f.x=f.x0+d*(ROUTES[r]||6)*k*(r==='RB'?.4:1);f.y=f.y0+((h>>(r.length))%2?2.5:-2.5)*seg(t,.4,.8)}}
   const throwT=.32,th=Math.max(2,Math.abs(cx-dropX)*.18+1.5);
   if(t>=throwT){
    const k=seg(t,throwT,catchT),apex=th;ball.x=lerp(dropX,cx,k);ball.y=lerp(qb.y0,cyy,k);ball.z=lerp(1.8,1.3,k)+4*apex*k*(1-k)*.6;carrier=null;
    for(let i=0;i<=12;i++){const kk=Math.min(k,i/12);trail.push({x:lerp(dropX,cx,kk),y:lerp(qb.y0,cyy,kk),z:lerp(1.8,1.3,kk)+4*apex*kk*(1-kk)*.6})}
    if(t>=catchT){
     if(s.kind==='pass'){const k2=easeOut(seg(t,catchT,1));target.x=lerp(cx,endX,k2);target.y=cyy+Math.sin(k2*Math.PI)*((h&2)?1.5:-1.5);ball.x=target.x;ball.y=target.y;ball.z=1.05;carrier=target}
     else if(s.kind==='inc'){const k2=seg(t,catchT,.78);ball.x=cx+d*1.6*k2;ball.y=cyy;ball.z=Math.max(0,1.3*(1-k2));groundAt={x:ball.x,y:ball.y}}
     else{const thief=getD(['CB1','CB2','S1','S2'][h%4]);thief.x=cx;thief.y=cyy;ball.x=cx;ball.y=cyy;ball.z=1.1;carrier=thief;catchBy=thief;label='INT'}
    }
   }
   if(s.kind==='int'&&t<catchT){const thief=getD(['CB1','CB2','S1','S2'][h%4]);const k=ease(seg(t,.1,catchT));thief.x=lerp(thief.x0,cx,k);thief.y=lerp(thief.y0,cyy,k)}
  }
 }
 // Line play and pursuit for everyone not already scripted.
 const pass=!runLike;
 for(const f of figs){
  if(f.team===side&&LINE.has(f.role)){f.x=f.x0+d*(pass?-.9:1.2)*ease(seg(t,0,.4))}
 }
 const focus=carrier||groundAt||catchPt||ball,tacklerIdx=hash(s.actors?.tk||s.seq)%defenders.length;
 defenders.forEach((f,i)=>{
  if(f.fixed)return;
  const k=DLINE.has(f.role)?.55:/LB/.test(f.role)?.85:.8,drop=pass&&!DLINE.has(f.role)?d*2*ease(seg(t,0,.35)):0;
  const pursue=Math.pow(seg(t,.3,1),1.2)*(i===tacklerIdx&&s.kind!=='inc'?1:k);
  const ang=i*2.4,ox=Math.cos(ang)*1.3*(1-pursue*.6),oy=Math.sin(ang)*1.3*(1-pursue*.6);
  f.x=lerp(f.x0+drop,focus.x+ox,pursue);f.y=lerp(f.y0,focus.y+oy,pursue);
  if(DLINE.has(f.role)&&!pass)f.x=lerp(f.x,f.x0-d*.6,.5*(1-pursue));
 });
 return{figs,ball,carrier,trail,flash,catchBy,target,label,camX:(carrier||ball).x+d*6};
}
function kickScene(s,t){
 const base=formation(s.side,s.los,ballLane(s),s.kind),{L,d,by}=base,figs=base.figs.map(f=>({...f,x0:f.x,y0:f.y})),side=s.side;
 const ball={x:L,y:by,z:.2};let carrier=null,label=null;const trail=[];
 const kicker=figs.find(f=>f.team===side&&f.role==='QB'),cover=figs.filter(f=>f.team===side&&f.role!=='QB');
 if(s.kind==='punt'){
  const goal=d>0?110:10,land=s.tb?goal+d*5:worldX(side,clampN(s.los+s.net,1,99)),apex=9;
  if(t<.18){const k=seg(t,0,.18);ball.x=lerp(L,kicker.x0,k);ball.y=by;ball.z=.9}
  else if(t<.25){ball.x=kicker.x0;ball.z=1}
  else{const k=seg(t,.25,.9);ball.x=lerp(kicker.x0,land,k);ball.y=by+(k*2.5);ball.z=lerp(1,.2,k)+4*apex*k*(1-k);
   for(let i=0;i<=14;i++){const kk=Math.min(k,i/14);trail.push({x:lerp(kicker.x0,land,kk),y:by+kk*2.5,z:lerp(1,.2,kk)+4*apex*kk*(1-kk)})}}
  const ret=figs.find(f=>f.team!==side&&f.role==='S1');ret.x=lerp(ret.x0,land,ease(seg(t,.1,.85)));ret.y=lerp(ret.y0,by+2.5,ease(seg(t,.1,.85)));
  cover.forEach((f,i)=>{f.x=f.x0+d*Math.min(Math.abs(land-f.x0)-3,s.net*.8)*ease(seg(t,.25,1))*(.6+(i%4)*.1)});
  for(const f of figs)if(f.team!==side&&f.role!=='S1')f.x=f.x0+d*s.net*.45*ease(seg(t,.3,1))*((f.role.length%3)*.15+.5);
  return{figs,ball,carrier,trail,flash:0,label,camX:ball.x+d*4,kick:true};
 }
 // Field goal: the ball reaches the plane of the uprights at the end line.
 const holder=kicker,postX=d>0?120:0,mY=MID_Y+(s.made?((hash(s.seq)%5)-2)*.5:((hash(s.seq)&1)?1:-1)*(4.6+hash(s.seq)%3)),endZ=s.made?3.33+2.2:3.9,apex=Math.max(endZ+1.5,s.dist*.13);
 const k=seg(t,.3,.9);
 if(t<.15){const kk=seg(t,0,.15);ball.x=lerp(L,holder.x0,kk);ball.z=.6}
 else if(t<.3){ball.x=holder.x0;ball.y=by;ball.z=.3}
 else{ball.x=lerp(holder.x0,postX,k);ball.y=lerp(by,mY,k);ball.z=lerp(.3,endZ,k)+4*(apex-endZ/2)*k*(1-k);
  for(let i=0;i<=14;i++){const kk=Math.min(k,i/14);trail.push({x:lerp(holder.x0,postX,kk),y:lerp(by,mY,kk),z:lerp(.3,endZ,kk)+4*(apex-endZ/2)*kk*(1-kk)})}}
 if(t>=.92)label=s.made?'GOOD':'NO GOOD';
 for(const f of figs)if(f.team!==side&&DLINE.has(f.role))f.x=f.x0-d*.7*ease(seg(t,0,.3));
 return{figs,ball,carrier,trail,flash:0,label,camX:lerp(L-d*4,postX-d*9,ease(seg(t,.3,.9))),kick:true,fg:true};
}
function restScene(side,los,seq){
 const base=formation(side||'home',los??25,MID_Y+[-3.4,0,3.4][(Number(seq)||0)%3],'run');
 return{figs:base.figs,ball:{x:base.L,y:base.by,z:.15},carrier:null,trail:[],flash:0,camX:base.L+base.d*8};
}

// ---- Drawing ----
function shade(hex,amt){
 const v=String(hex||'#777').replace('#','');if(!/^[0-9a-f]{6}$/i.test(v))return hex;
 const n=parseInt(v,16),f=c=>clampN(Math.round(amt<0?c*(1+amt):c+(255-c)*amt),0,255);
 return `rgb(${f(n>>16&255)},${f(n>>8&255)},${f(n&255)})`;
}
function poly(ctx,cam,pts,z=0){ctx.beginPath();pts.forEach(([x,y],i)=>{const p=project(cam,x,y,z);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)});ctx.closePath()}
function quad(ctx,cam,x0,y0,x1,y1,fill,z=0){poly(ctx,cam,[[x0,y0],[x1,y0],[x1,y1],[x0,y1]],z);ctx.fillStyle=fill;ctx.fill()}
// Text laid flat on the turf: each character gets its own local affine transform, so the
// lettering follows the perspective across a long word.
function flatText(ctx,cam,text,x,y,{size=2.2,ax=[1,0],color='rgba(255,255,255,.82)',font='800'}={}){
 const chars=[...String(text)],w=size*.62,total=w*chars.length,ay=[ax[1],-ax[0]];
 chars.forEach((ch,i)=>{
  const off=-total/2+w*(i+.5),cx=x+ax[0]*off,cyy=y+ax[1]*off,o=project(cam,cx,cyy),px=project(cam,cx+ax[0],cyy+ax[1]),py=project(cam,cx+ay[0],cyy+ay[1]);
  ctx.save();ctx.setTransform(cam.dpr*(px.x-o.x)/10,cam.dpr*(px.y-o.y)/10,cam.dpr*(py.x-o.x)/10,cam.dpr*(py.y-o.y)/10,cam.dpr*o.x,cam.dpr*o.y);
  ctx.fillStyle=color;ctx.font=`${font} ${size*10}px system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(ch,0,0);ctx.restore();
 });
}
function drawField(ctx,cam,colors,names){
 const {W,H}=cam,sky=ctx.createLinearGradient(0,0,0,H*.45);sky.addColorStop(0,'#0b1220');sky.addColorStop(1,'#1b2433');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 // Stands behind the far sideline, then the apron around the field.
 const a=project(cam,-40,FIELD_W+7,0),b=project(cam,160,FIELD_W+7,9);ctx.fillStyle='#1e2a3b';ctx.fillRect(0,b.y,W,a.y-b.y);
 for(let i=0;i<5;i++){const r0=project(cam,-40,FIELD_W+7,i*1.8),r1=project(cam,-40,FIELD_W+7,i*1.8+.9);ctx.fillStyle=i%2?'#253246':'#1a2534';ctx.fillRect(0,r1.y,W,r0.y-r1.y)}
 quad(ctx,cam,-40,-12,160,FIELD_W+7,'#24572e');
 for(let i=0;i<20;i++)quad(ctx,cam,10+i*5,0,15+i*5,FIELD_W,i%2?'#2f7a3b':'#2b7136');
 quad(ctx,cam,0,0,10,FIELD_W,shade(colors.away.primary,-.15));quad(ctx,cam,110,0,120,FIELD_W,shade(colors.home.primary,-.15));
 const white='rgba(255,255,255,.9)',line=(x0,y0,x1,y1,w=.12)=>{const dx=x1-x0,dy=y1-y0,l=Math.hypot(dx,dy)||1,nx=-dy/l*w,ny=dx/l*w;poly(ctx,cam,[[x0+nx,y0+ny],[x1+nx,y1+ny],[x1-nx,y1-ny],[x0-nx,y0-ny]]);ctx.fillStyle=white;ctx.fill()};
 line(0,0,120,0,.18);line(0,FIELD_W,120,FIELD_W,.18);line(0,0,0,FIELD_W,.18);line(120,0,120,FIELD_W,.18);
 for(let x=10;x<=110;x+=5)line(x,0,x,FIELD_W,x===10||x===110?.2:.1);
 for(let x=11;x<110;x++){if(x%5===0)continue;for(const hy of HASH_Y)line(x,hy-.35,x,hy+.35,.07);line(x,.4,x,1.1,.07);line(x,FIELD_W-1.1,x,FIELD_W-.4,.07)}
 for(let n=10;n<=90;n+=10){const label=String(n<=50?n:100-n);flatText(ctx,cam,label,10+n,8.5,{size:2.4});flatText(ctx,cam,label,10+n,FIELD_W-8.5,{size:2.4,ax:[-1,0]})}
  for(const [side,x,ax] of [['away',5,[0,1]],['home',115,[0,-1]]]){const t=String(names[side]||'').toUpperCase();flatText(ctx,cam,t,x,MID_Y,{size:Math.min(3.6,46/(.62*Math.max(8,t.length))),ax,color:'rgba(255,255,255,.9)'})}
}
function drawPosts(ctx,cam,x){
 const base=project(cam,x+(x<60?-1:1),MID_Y,0),bar=project(cam,x,MID_Y,3.33),l=project(cam,x,MID_Y-3.08,3.33),r=project(cam,x,MID_Y+3.08,3.33),lt=project(cam,x,MID_Y-3.08,10),rt=project(cam,x,MID_Y+3.08,10);
 ctx.strokeStyle='#f2d43d';ctx.lineCap='round';ctx.lineWidth=Math.max(1.5,bar.s*.14);
 ctx.beginPath();ctx.moveTo(base.x,base.y);ctx.lineTo(bar.x,bar.y);ctx.moveTo(l.x,l.y);ctx.lineTo(r.x,r.y);ctx.moveTo(l.x,l.y);ctx.lineTo(lt.x,lt.y);ctx.moveTo(r.x,r.y);ctx.lineTo(rt.x,rt.y);ctx.stroke();
}
function drawFig(ctx,cam,f,colors,hl,label){
 const g=project(cam,f.x,f.y,0),s=g.s*1.2,top=project(cam,f.x,f.y,1.95),head=project(cam,f.x,f.y,2.35),c=colors[f.team];
 ctx.fillStyle='rgba(0,0,0,.32)';ctx.beginPath();ctx.ellipse(g.x,g.y,s*.55,s*.2,0,0,Math.PI*2);ctx.fill();
 if(hl){ctx.strokeStyle=hl;ctx.lineWidth=Math.max(1.5,s*.08);ctx.beginPath();ctx.ellipse(g.x,g.y,s*.8,s*.3,0,0,Math.PI*2);ctx.stroke()}
 const w=Math.max(2.5,s*.62),hgt=g.y-top.y,mid=g.y-hgt*.42;
 ctx.fillStyle=c.pants;ctx.fillRect(g.x-w*.42,mid,w*.84,g.y-mid);
 ctx.fillStyle=c.jersey;ctx.beginPath();ctx.roundRect?ctx.roundRect(g.x-w/2,top.y,w,mid-top.y+1,w*.25):ctx.rect(g.x-w/2,top.y,w,mid-top.y+1);ctx.fill();
 ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1;ctx.stroke();
 const hr=Math.max(1.6,s*.3);ctx.fillStyle=c.helmet;ctx.beginPath();ctx.arc(head.x,head.y,hr,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=c.stripe;ctx.fillRect(head.x-hr*.15,head.y-hr,hr*.3,hr*1.1);
 if(label){ctx.font=`700 ${clampN(s*.75,10,13)}px system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.lineWidth=3;ctx.strokeStyle='rgba(8,12,20,.85)';ctx.strokeText(label,head.x,head.y-hr-2);ctx.fillStyle='#fff';ctx.fillText(label,head.x,head.y-hr-2)}
}
function drawBall(ctx,cam,b,ring){
 const sh=project(cam,b.x,b.y,0),p=project(cam,b.x,b.y,b.z),s=p.s;
 if(b.z>.25){ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(sh.x,sh.y,s*.3,s*.12,0,0,Math.PI*2);ctx.fill()}
 if(ring){ctx.strokeStyle=ring;ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(5,s*.5),0,Math.PI*2);ctx.stroke()}
 ctx.fillStyle='#7a4a24';ctx.strokeStyle='#3d2410';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(p.x,p.y,Math.max(3,s*.3),Math.max(2,s*.19),-.3,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.strokeStyle='#f5efe0';ctx.beginPath();ctx.moveTo(p.x-Math.max(1.2,s*.1),p.y);ctx.lineTo(p.x+Math.max(1.2,s*.1),p.y);ctx.stroke();
}
function drawTrail(ctx,cam,trail,color){
 if(trail.length<2)return;ctx.save();ctx.setLineDash([4,4]);ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.beginPath();
 trail.forEach((q,i)=>{const p=project(cam,q.x,q.y,q.z);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)});ctx.stroke();ctx.restore();
}
function drawBanner(ctx,cam,text,color,alpha,sub){
 if(alpha<=0)return;const {W,H}=cam,h=Math.max(38,H*.15),y=H*.36-h/2;
 ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.fillRect(0,y,W,h);ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(0,y,W,3);ctx.fillRect(0,y+h-3,W,3);
 ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${clampN(W/18,16,30)}px system-ui,sans-serif`;ctx.fillText(text,W/2,y+h*(sub?.42:.5));
 if(sub){ctx.font=`600 ${clampN(W/40,10,14)}px system-ui,sans-serif`;ctx.fillText(sub,W/2,y+h*.8)}ctx.restore();
}
function drawCard(ctx,cam,text,alpha){
 if(alpha<=0)return;const {W,H}=cam,w=Math.min(W*.7,320),h=52;ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='rgba(10,16,28,.88)';ctx.strokeStyle='rgba(255,255,255,.25)';
 ctx.beginPath();ctx.roundRect?ctx.roundRect(W/2-w/2,H/2-h/2,w,h,10):ctx.rect(W/2-w/2,H/2-h/2,w,h);ctx.fill();ctx.stroke();
 ctx.fillStyle='#fff';ctx.font=`800 ${clampN(W/26,14,22)}px system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,W/2,H/2);ctx.restore();
}
function lastName(n){const parts=String(n||'').trim().split(/\s+/);return parts.length>1?parts.slice(1).join(' '):parts[0]||''}

// ---- Mounting: DOM, controls and the animation loop ----
function teamColors(meta){
 const out={};
 for(const side of ['home','away']){
  const b=meta[side]?.brand||{},primary=b.primary||(side==='home'?'#3987e5':'#d95926'),secondary=b.secondary||'#f2ede3';
  out[side]=side==='home'?{primary,jersey:primary,pants:'#e8e4da',helmet:secondary,stripe:primary,ui:primary}:{primary,jersey:'#f4f2ec',pants:'#e8e4da',helmet:primary,stripe:secondary,ui:primary};
 }
 return out;
}
function mount(host,{rows,meta,onStep}={}){
 const tl=timeline(rows,meta),steps=tl.steps,colors=teamColors(meta),names={home:meta.home?.name||'Home',away:meta.away?.name||'Away'},nm=id=>(id!=null&&meta.names?.[id])||null;
 if(!steps.length)return null;
 host.innerHTML=`<div class="gcf">
  <div class="gcf-bug"><span class="gcf-team away" style="--gcf-team:${esc(colors.away.ui)}"><b>${esc(names.away)}</b><strong data-gcf-score="away">0</strong></span>
   <span class="gcf-situation"><b data-gcf-clock>Q1 15:00</b><span data-gcf-down></span></span>
   <span class="gcf-team home" style="--gcf-team:${esc(colors.home.ui)}"><strong data-gcf-score="home">0</strong><b>${esc(names.home)}</b></span></div>
  <div class="gcf-stage"><canvas data-gcf-canvas role="img" aria-label="Angled field replay"></canvas></div>
  <div class="gcf-drive"><div class="gcf-drive-head" data-gcf-drive-head></div><div class="gcf-strip" data-gcf-strip></div></div>
  <div class="gcf-play" data-gcf-play aria-live="polite"></div>
  <ol class="gcf-log" data-gcf-log></ol>
  <div class="gcf-controls">
   <button type="button" data-gcf-restart title="Restart" aria-label="Restart">⟲</button>
   <button type="button" data-gcf-prev title="Previous drive" aria-label="Previous drive">⏮</button>
   <button type="button" class="gcf-primary" data-gcf-toggle aria-pressed="false">▶ Play</button>
   <button type="button" data-gcf-next title="Next drive" aria-label="Next drive">⏭</button>
   <select data-gcf-speed aria-label="Replay speed"><option value="1">1x</option><option value="4">4x</option><option value="key">Key plays</option></select>
   <input type="range" min="0" max="${steps.length-1}" value="0" step="1" data-gcf-scrub aria-label="Replay position">
  </div></div>`;
 const $q=sel=>host.querySelector(sel),canvas=$q('[data-gcf-canvas]'),ctx=canvas.getContext('2d'),toggle=$q('[data-gcf-toggle]'),scrub=$q('[data-gcf-scrub]'),speedSel=$q('[data-gcf-speed]');
 let si=0,pt=0,playing=false,speed='1',raf=null,last=null,camX=null,W=0,H=0,dpr=1,shownStep=-1,shownPhase='';
 const rateFor=()=>speed==='4'?4:speed==='key'?keyRate(tl):1;
 const total=s=>{const d=durations(s),k=speed==='key';return(k?d.pre*.5:d.pre)+d.play+d.post};
 const nextIndex=i=>{let j=i+1;while(j<steps.length&&(durations(steps[j]).post+durations(steps[j]).play===0||(speed==='key'&&!isKey(steps[j]))))j++;return j};
 const resize=()=>{const w=Math.max(260,host.clientWidth||canvas.parentElement.clientWidth||640);W=w;H=Math.round(clampN(w*(w<520?.66:.52),220,400));dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);canvas.style.width=`${W}px`;canvas.style.height=`${H}px`};
 const sceneAt=(s,ms)=>{
  const d=durations(s),pre=speed==='key'?d.pre*.5:d.pre;
  if(SNAP_KINDS.has(s.kind)){const t=ms<pre?0:clampN((ms-pre)/Math.max(1,d.play),0,1);return{phase:ms<pre?'pre':ms<pre+d.play?'play':'post',t,sc:s.kind==='punt'||s.kind==='fg'?kickScene(s,t):scene(s,t)}}
  if((s.kind==='score'||s.kind==='after')&&s.from!=null){const f=steps[s.from];return{phase:'post',t:1,sc:f.kind==='punt'||f.kind==='fg'?kickScene(f,1):scene(f,1)}}
  const side=s.post.poss||s.pre.poss;return{phase:'post',t:1,sc:restScene(side,s.post.spot>=100?75:s.post.spot,s.seq)};
 };
 const render=()=>{
  const s=steps[si];if(!s)return;const {phase,t,sc}=sceneAt(s,pt);
  const cam=camera(W,H,0);cam.dpr=dpr;const want=clampCam(cam,sc.camX);
  if(camX==null)camX=want;cam.x=camX;
  ctx.setTransform(dpr,0,0,dpr,0,0);drawField(ctx,cam,colors,names);
  if(SNAP_KINDS.has(s.kind)&&s.kind!=='punt'&&s.kind!=='fg'){
   const L=worldX(s.side,s.los);quad(ctx,cam,L-.18,0,L+.18,FIELD_W,'rgba(70,140,255,.85)',.01);
   const fd=s.los+s.toGo;if(fd<100&&phase!=='post')quad(ctx,cam,worldX(s.side,fd)-.18,0,worldX(s.side,fd)+.18,FIELD_W,'rgba(255,214,10,.9)',.01);
  }
  const items=sc.figs.map(f=>({y:f.y,draw:()=>{const hl=f===sc.carrier?(f.team===s.side?'#fff':colors[f.team].primary):null;drawFig(ctx,cam,f,colors,hl,f===sc.carrier&&phase!=='pre'?carrierName(s,f):null)}}));
  for(const x of [0,120])items.push({y:MID_Y,draw:()=>drawPosts(ctx,cam,x)});
  items.sort((a,b)=>b.y-a.y).forEach(it=>it.draw());
  drawTrail(ctx,cam,sc.trail,s.kind==='int'&&sc.catchBy?colors[other(s.side)].primary:'rgba(255,255,255,.75)');
  drawBall(ctx,cam,sc.ball,sc.catchBy?colors[sc.catchBy.team].primary:null);
  if(sc.flash>0){ctx.fillStyle=`rgba(220,40,40,${.28*sc.flash})`;ctx.fillRect(0,0,W,H)}
  if(sc.label&&s.kind==='fg'&&pt<total(s)-durations(s).post){ctx.font=`900 ${clampN(W/16,18,34)}px system-ui,sans-serif`;ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='rgba(0,0,0,.6)';ctx.fillStyle=s.made?'#ffd60a':'#ff6b6b';ctx.strokeText(sc.label,W/2,H*.2);ctx.fillText(sc.label,W/2,H*.2)}
  const d=durations(s),postStart=total(s)-d.post;
  if(s.banner&&pt>=postStart){const k=(pt-postStart)/Math.max(1,d.post),alpha=k<.1?k/.1:k>.7?(1-k)/.3:1;drawBanner(ctx,cam,s.banner.text,colors[s.banner.side||s.side||'home'].primary,alpha*.94,bannerSub(s))}
  if(s.kind==='card'){const k=pt/Math.max(1,d.post);drawCard(ctx,cam,s.card,playing?(k<.15?k/.15:k>.8?(1-k)/.2:1):1)}
  if(s.kind==='cut'&&s.label){ctx.font=`700 ${clampN(W/34,11,15)}px system-ui,sans-serif`;ctx.textAlign='left';ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillText(s.label,12,22)}
  // Ease the camera toward the action.
  camX=want===camX?camX:camX+(want-camX)*.12;
  if(Math.abs(want-camX)<.05)camX=want;
  syncUi(s,phase);
  return Math.abs(want-camX)>.05;
 };
 const bannerSub=s=>{if(s.kind==='score'&&s.from!=null){const f=steps[s.from],a=f.actors||{};if(f.kind==='pass')return `${nm(a.qb)||''} to ${nm(a.tg)||''} · ${f.y} yards`.trim();if(f.kind==='run')return `${nm(a.ca)||''} · ${f.y} yards`;if(f.kind==='int'||f.kind==='fumble')return 'Defensive score'}if(s.kind==='int')return nm(s.actors?.ib)||'';if(s.kind==='sack')return nm(s.actors?.sb)||'';if(s.kind==='fg')return `${s.dist} yards`;if(s.clutch)return s.clutch==='TIE'?'Tied up late':'Takes the lead late';return ''};
 const carrierName=(s,f)=>{const a=s.actors||{};if(f.team!==s.side)return lastName(nm(a.ib));if(f.role==='QB')return lastName(nm(a.qb));return lastName(nm(a.ca)||nm(a.tg))};
 const syncUi=(s,phase)=>{
  const key=`${s.i}:${phase}`;if(key===shownPhase)return;shownPhase=key;
  const st=phase==='post'?s.post:s.pre;
  $q('[data-gcf-score="away"]').textContent=String(st.score.away);$q('[data-gcf-score="home"]').textContent=String(st.score.home);
  $q('[data-gcf-clock]').textContent=st.q>4?periodText(st.q):`${periodText(st.q)} ${clockText(st.c)}`;
  const down=SNAP_KINDS.has(s.kind)&&phase!=='post'?`${ORD[s.down]||s.down} & ${s.los+s.toGo>=100?'Goal':s.toGo} · ${esc(names[s.side])} · ${spotText(s.los)}`:s.kind==='card'?esc(s.card):'';
  $q('[data-gcf-down]').innerHTML=down;
  if(s.i!==shownStep){shownStep=s.i;scrub.value=String(s.i);updatePlay(s);updateDrive(s);onStep?.(s)}
 };
 const updatePlay=s=>{
  const box=$q('[data-gcf-play]');box.innerHTML=s.text?`<strong>${esc(periodText(s.pre.q))} ${esc(clockText(s.pre.c))}</strong> · ${esc(s.text)}`:'';
  const prev=[];for(let j=s.i-1;j>=0&&prev.length<4;j--)if(steps[j].text&&steps[j].kind!=='mark')prev.push(steps[j]);
  $q('[data-gcf-log]').innerHTML=prev.map(p=>`<li>${esc(p.text)}</li>`).join('');
 };
 const updateDrive=s=>{
  const dr=tl.drives[s.drive],strip=$q('[data-gcf-strip]'),head=$q('[data-gcf-drive-head]');
  if(!dr){strip.innerHTML='';head.textContent='';return}
  const segW=p=>p.kind==='punt'||p.kind==='fg'?3:Math.max(2,Math.abs(p.y||0)),done=s.i>=dr.end,snaps=dr.snaps.filter(j=>j<=s.i||done),total=dr.snaps.reduce((n,j)=>n+segW(steps[j]),0)||1;
  head.innerHTML=`${esc(names[dr.side])} drive ${dr.index+1} · from the ${esc(spotText(dr.startSpot).toLowerCase())} · ${snaps.length} play${snaps.length===1?'':'s'}${done&&dr.result?` · <b>${esc(dr.result)}</b>`:''}`;
  strip.innerHTML=dr.snaps.map(j=>{const p=steps[j],w=segW(p)/total*100,cls=p.big?'big':(p.kind==='inc'||(p.y||0)<0||p.kind==='int'||p.kind==='fumble')?'loss':'gain';
   return `<button type="button" class="gcf-seg ${cls}${j===s.i?' now':''}${j>s.i?' future':''}" style="flex-basis:${w.toFixed(2)}%;--gcf-team:${esc(colors[dr.side].ui)}" data-gcf-seek="${j}" aria-label="${esc(p.text||p.kind)}" title="${esc(p.text||p.kind)}"></button>`}).join('');
 };
 const loop=ts=>{
  raf=null;if(!host.isConnected){destroy();return}
  const dialog=host.closest('dialog');if(dialog&&!dialog.open){pause();return}
  if(document.hidden){last=null;return}
  const dt=last==null?16:Math.min(100,ts-last);last=ts;
  if(playing){pt+=dt*rateFor();while(playing&&pt>=total(steps[si])){const n=nextIndex(si);if(n>=steps.length){pt=total(steps[si]);pause();break}pt-=total(steps[si]);si=n;if(speed==='key')camX=null}}
  const moving=render();
  if(playing||moving)raf=requestAnimationFrame(loop);else last=null;
 };
 const kick=()=>{if(!raf&&!destroyed)raf=requestAnimationFrame(loop)};
 const play=()=>{if(si>=steps.length-1&&pt>=total(steps[si])-1){si=0;pt=0;camX=null}if(speed==='key'&&!isKey(steps[si])){const n=nextIndex(si);if(n<steps.length){si=n;pt=0;camX=null}}playing=true;toggle.textContent='❚❚ Pause';toggle.setAttribute('aria-pressed','true');last=null;kick()};
 function pause(){playing=false;toggle.textContent='▶ Play';toggle.setAttribute('aria-pressed','false')}
 const seek=(i,{snap=true}={})=>{si=clampN(i|0,0,steps.length-1);pt=0;if(snap)camX=null;shownPhase='';render();kick()};
 const driveJump=dir=>{const cur=steps[si].drive;let target=cur+dir;if(dir<0&&pt>0&&tl.drives[cur]&&si>tl.drives[cur].start)target=cur;const dr=tl.drives[clampN(target,0,tl.drives.length-1)];if(dr)seek(dr.start)};
 toggle.onclick=()=>playing?pause():play();
 $q('[data-gcf-restart]').onclick=()=>{pause();seek(0)};
 $q('[data-gcf-prev]').onclick=()=>driveJump(-1);
 $q('[data-gcf-next]').onclick=()=>driveJump(1);
 speedSel.onchange=()=>{speed=speedSel.value;pt=0;if(playing&&speed==='key'&&!isKey(steps[si])){const n=nextIndex(si);if(n<steps.length)si=n}camX=null;kick()};
 scrub.oninput=()=>{pause();seek(Number(scrub.value))};
 host.addEventListener('click',ev=>{const b=ev.target.closest?.('[data-gcf-seek]');if(b){pause();seek(Number(b.dataset.gcfSeek))}});
 const onVis=()=>{if(!document.hidden)kick()};document.addEventListener('visibilitychange',onVis);
 let ro=null,destroyed=false;
 if(window.ResizeObserver){ro=new ResizeObserver(()=>{if(!host.isConnected)return destroy();const w=host.clientWidth;if(w&&Math.abs(w-W)>4){resize();shownPhase='';render()}});ro.observe(host)}
 function destroy(){destroyed=true;playing=false;if(raf)cancelAnimationFrame(raf);raf=null;ro?.disconnect();document.removeEventListener('visibilitychange',onVis)}
 resize();render();
 const ctrl={timeline:tl,seek:i=>{pause();seek(i)},play,pause,destroy,
  seekElapsed(e){let best=0;steps.forEach((s,i)=>{if(s.kind!=='mark'&&Math.abs(s.elapsed-e)<Math.abs(steps[best].elapsed-e))best=i});pause();seek(best)},
  setSpeed(v){speedSel.value=String(v);speedSel.onchange()},
  get state(){return{step:si,ms:pt,playing,speed,steps:steps.length,drive:steps[si]?.drive,kind:steps[si]?.kind,score:(pt>0?steps[si].post:steps[si].pre).score}},
  keyDurationMs(){return steps.filter(isKey).reduce((n,s)=>n+total(s),0)/keyRate(tl)}};
 host.__gcf=ctrl;return ctrl;
}
globalThis.DynastyGameCastField=Object.freeze({timeline,durations,keyRate,isKey,elapsedOf,camera,project,scene,kickScene,mount,spotText});
})();
