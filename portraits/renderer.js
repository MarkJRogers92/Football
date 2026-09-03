/* Dynasty Portraits v1: pure identity/appearance derivation and Canvas 2D rendering. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DynastyPortraits = api;
})(typeof window !== 'undefined' ? window : this, function() {
  'use strict';
  const VERSION = 1;
  const HAIR = ['Buzz cut','Crew cut','High fade','Side part','Swept back','Wavy crop','Short curls','Curly top','Afro','High top','Short twists','Short locs','Long locs','Braids','Cornrows','Mullet','Shag','Long waves','Bald','Mohawk','Flat top','Center part','Loose curls','Taper fade'];
  const BEARDS = ['Clean shaven','Stubble','Mustache','Goatee','Chin beard','Short beard','Full beard'];
  const SKIN = ['#f2c9a4','#e7b48d','#dca17a','#ca8a61','#b97850','#a96843','#945637','#80472e','#6b3928','#542d22'];
  const HAIR_COLORS = ['#171a1c','#28211e','#402b20','#65412a','#936037','#b88b4e','#ddbd78','#853e28'];
  const clamp = (n,a,b) => Math.min(b,Math.max(a,n));
  const number = (n,f,a,b) => clamp(n === null || n === '' || !Number.isFinite(Number(n)) ? f : Number(n),a,b);
  function hash(value) { let h=2166136261; for(const ch of String(value)){h ^= ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0; }
  function rng(seed, name) {let a=hash(`${VERSION}:${seed}:${name}`);return function(){a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
  function deriveIdentity(seed, version=VERSION) {
    if(version!==VERSION) throw new RangeError('Unsupported portrait version');
    const face=rng(seed,'face'),hair=rng(seed,'hair'),color=rng(seed,'color'),extra=rng(seed,'extras');
    return Object.freeze({seed:String(seed),version,shape:Math.floor(face()*6),width:38+face()*9,jaw:25+face()*13,length:64+face()*12,chin:12+face()*11,eyes:13+face()*6,eyeSize:3+face()*2,brow:2+face()*3,nose:4+face()*4,mouth:10+face()*8,ear:5+face()*3,skin:Math.floor(color()*10),hairColor:Math.floor(color()*8),hair:Math.floor(hair()*HAIR.length),beard:Math.floor(hair()*BEARDS.length),maturity:hair(),eyeColor:Math.floor(color()*4),eyeBlack:extra()<.16,freckles:extra()<.15,headband:extra()<.06});
  }
  function deriveAppearance(identity, player={}, school={}, options={}) {
    const o=options.overrides||{};
    const age=number(player.age,18+number(player.eligibilityUsed,0,0,6),16,40);
    const height=number(player.height,74,62,86),weight=number(player.weight,215,140,400);
    const mass=clamp((weight-175)/175,0,1.25),mature=clamp((age-18)/5,0,1);
    const validColor=(v,f)=>/^#[\da-f]{6}$/i.test(v||'')?v:f;
    return Object.freeze({identity,age,height,weight,mass,mature,
      skin:Math.round(number(o.skin,identity.skin,0,9)),hair:Math.round(number(o.hair,identity.hair,0,HAIR.length-1)),
      beard:Math.round(number(o.beard,age<19&&identity.maturity>.35?0:identity.beard,0,BEARDS.length-1)),
      hairColor:Math.round(number(o.hairColor,identity.hairColor,0,7)),
      eyeBlack:o.accessories===false?false:identity.eyeBlack,headband:o.accessories===false?false:identity.headband,freckles:identity.freckles,
      neck:13+mass*9+mature*2,shoulders:76+mass*30+(height-74)*.7,
      primary:validColor(school.primary,'#174d46'),secondary:validColor(school.secondary,'#ecb45b'),
      number:String(Math.round(number(player.jerseyNumber,12,0,99))),neutral:!!options.neutral,
      background:validColor(options.background,'#263b42')});
  }
  function shade(hex,n){return '#'+hex.slice(1).match(/../g).map(v=>clamp(parseInt(v,16)+n,0,255).toString(16).padStart(2,'0')).join('');}
  // Serializable drawing commands provide stable golden tests independent of browser antialiasing.
  function drawingCommands(a) {
    const out=[],poly=(points,color)=>out.push(['poly',points,color]),ellipse=(x,y,rx,ry,color)=>out.push(['ellipse',x,y,rx,ry,color]);
    const rect=(x,y,w,h,c)=>poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],c);
    const f=a.identity,skin=SKIN[a.skin],light=shade(skin,19),shadow=shade(skin,-27),deep=shade(skin,-49),hair=HAIR_COLORS[a.hairColor],hi=shade(hair,17);
    const cx=128,top=49,shapeWidth=[0,3,5,-3,2,-2][f.shape],shapeLength=[0,-6,-2,8,3,6][f.shape];
    const bottom=top+f.length+19+shapeLength,w=f.width+shapeWidth+(a.mass*3),jaw=f.jaw+[3,7,-2,-3,1,-5][f.shape]+(a.mass*3),chin=f.chin+[5,6,-2,-1,1,-3][f.shape];
    const yEye=84+(f.length-64)*.25,yNose=yEye+20,yMouth=Math.min(yNose+15,bottom-13);
    const p=(x,y)=>[cx+x,y];
    rect(0,0,256,256,a.background);
    poly([[0,0],[201,0],[62,256],[0,256]],shade(a.background,5));
    ellipse(128,224,106,20,shade(a.background,-9));
    const jersey=a.neutral?'#495862':a.primary,trim=a.neutral?'#a7b7bc':a.secondary,s=a.shoulders,n=a.neck;
    poly([p(-s,184),p(-s-11,256),p(s+11,256),p(s,184),p(41,162),p(-41,162)],shade(jersey,-18));
    poly([p(-s,184),p(-55,170),p(-37,174),p(-26,202),p(-36,256),p(-s-11,256)],shade(jersey,13));
    poly([p(55,170),p(s,184),p(s+11,256),p(40,256),p(29,203),p(37,174)],shade(jersey,-7));
    poly([p(-37,174),p(0,184),p(37,174),p(41,256),p(-39,256)],jersey);
    poly([p(-s,190),p(-55,174),p(-50,181),p(-s-1,199)],trim);
    poly([p(55,174),p(s,190),p(s+1,199),p(50,181)],trim);
    poly([p(-n,120),p(n,120),p(n+3,165),p(29,172),p(0,193),p(-29,172),p(-n-3,165)],skin);
    poly([p(0,130),p(n,122),p(n+3,165),p(29,172),p(0,185)],shadow);
    poly([p(-n,132),p(n,133),p(n,146),p(0,155),p(-n,148)],deep);
    poly([p(-33,170),p(-24,169),p(0,187),p(24,169),p(33,170),p(0,201)],trim);
    poly([p(-23,171),p(0,188),p(23,171),p(0,194)],shade(jersey,-35));
    // Small procedural block numerals, avoiding platform font raster differences.
    const digits=['111101101101111','010110010010111','111001111100111','111001111001111','101101111001001','111100111001111','111100111101111','111001001001001','111101111101111','111101111001111'];
    const start=128-(a.number.length*16-2)/2;
    a.number.split('').forEach((d,i)=>digits[Number(d)].split('').forEach((bit,j)=>{if(bit==='1')rect(start+i*16+(j%3)*4,215+Math.floor(j/3)*4,3.4,3.4,trim);}));
    // Long hairstyles sit behind the face.
    if([12,15,16,17,21].includes(a.hair)){
      poly([p(-w-5,55),p(w+5,52),p(w+14,147),p(w-4,170),p(w-12,128),p(-w+12,128),p(-w+1,166),p(-w-13,144)],hair);
      for(let k=0;k<4;k++){poly([p(-w-6+k*4,91),p(-w-9+k*4,145),p(-w-5+k*4,158),p(-w-3+k*4,94)],hi);poly([p(w+3-k*4,90),p(w+11-k*4,143),p(w+6-k*4,155),p(w-k*4,91)],shade(hair,8));}
    }
    for(const side of [-1,1]){poly([p(side*(w-2),80),p(side*(w+f.ear),78),p(side*(w+f.ear+2),88),p(side*(w+4),105),p(side*(w-1),107)],side<0?skin:shadow);poly([p(side*(w+1),86),p(side*(w+4),85),p(side*(w+3),98)],deep);}
    const temple=f.shape===1?3:0,cheek=f.shape===2?5:0;
    const outline=[p(-w+10,top),p(w-10,top),p(w,top+15),p(w-temple,101),p(jaw+cheek,bottom-13),p(chin,bottom),p(-chin,bottom),p(-jaw-cheek,bottom-13),p(-w+temple,101),p(-w,top+15)];
    poly(outline,skin);
    poly([p(-w+10,top),p(-9,top+2),p(-18,yEye-7),p(-w+3,yEye+2),p(-w,top+15)],light);
    poly([p(w-10,top),p(w,top+15),p(w-temple,101),p(jaw+cheek,bottom-13),p(chin,bottom),p(7,bottom-1),p(18,104),p(20,top+12)],shadow);
    poly([p(-w+2,101),p(-20,107),p(-14,117),p(-jaw,bottom-13)],shade(skin,-9));
    poly([p(-chin,bottom),p(chin,bottom),p(jaw,bottom-13),p(9,bottom-8),p(-10,bottom-8),p(-jaw,bottom-13)],shade(skin,-16));
    poly([p(-22,yNose+4),p(-8,yNose-2),p(-10,yNose+9),p(-25,yNose+10)],shade(skin,9));
    for(const side of [-1,1]){
      const x=side*f.eyes,sz=f.eyeSize;
      poly([p(x-7,yEye-3),p(x+7,yEye-3),p(x+8,yEye+4),p(x-7,yEye+4)],shade(skin,-17));
      poly([p(x-6.5,yEye),p(x+6.5,yEye-1),p(x+5.5,yEye+3.6),p(x-5.5,yEye+3.6)],'#d9d2bd');
      rect(cx+x-1.7,yEye-.8,sz,4.8,['#3b3026','#4e5042','#55606a','#6b4c2f'][f.eyeColor]);
      rect(cx+x-.7,yEye,2,3,'#202429');rect(cx+x,yEye,.9,.9,'#eee6d5');
      poly([p(x-8,yEye-8),p(x+6,yEye-10+side),p(x+8,yEye-6+side),p(x-7,yEye-5+f.brow*.2)],hair);
      if(a.eyeBlack)poly([p(x-7,yEye+8),p(x+7,yEye+7),p(x+6,yEye+12),p(x-6,yEye+12)],'#252a2b');
      if(a.freckles)for(let k=0;k<4;k++)ellipse(cx+x-6+k*4,yEye+12+(k%2)*3,.75,.65,deep);
    }
    poly([p(-2,yEye+1),p(f.nose+1,yNose),p(3,yNose+4),p(-f.nose,yNose+2)],shade(skin,11));
    poly([p(2,yEye+2),p(f.nose+3,yNose),p(3,yNose+4)],shadow);
    poly([p(-f.nose,yNose+2),p(-2,yNose+4),p(5,yNose+4),p(f.nose+3,yNose)],deep);
    const beard=shade(hair,5);
    if(a.beard===1)poly([p(-jaw-2,yMouth-5),p(-f.mouth-2,yMouth),p(-5,yMouth+7),p(7,yMouth+7),p(f.mouth+3,yMouth),p(jaw+3,yMouth-5),p(jaw-3,bottom-11),p(chin,bottom-2),p(-chin,bottom-2),p(-jaw+3,bottom-11)],shade(skin,-21));
    if(a.beard>=5){poly([p(-w+3,98),p(-jaw+2,114),p(-f.mouth,119),p(0,127),p(f.mouth,119),p(jaw-2,114),p(w-3,98),p(jaw+3,bottom-9),p(chin,bottom+(a.beard===6?9:1)),p(-chin,bottom+(a.beard===6?9:1)),p(-jaw-3,bottom-9)],beard);poly([p(-jaw,122),p(-12,136),p(-chin,bottom),p(-jaw+2,bottom-10)],hi);}
    if(a.beard===3||a.beard===4)poly([p(-10,yMouth+7),p(10,yMouth+7),p(12,bottom-6),p(0,bottom+1),p(-12,bottom-6)],beard);
    if(a.beard===2||a.beard===3||a.beard>=5)poly([p(-f.mouth,yMouth-4),p(-4,yMouth-7),p(0,yMouth-5),p(4,yMouth-7),p(f.mouth,yMouth-4),p(f.mouth+1,yMouth),p(0,yMouth-2),p(-f.mouth-1,yMouth)],beard);
    poly([p(-f.mouth/1.5,yMouth+1),p(0,yMouth),p(f.mouth/1.5,yMouth+1),p(5,yMouth+4),p(-5,yMouth+4)],shade(skin,-36));
    poly([p(-7,yMouth+5),p(6,yMouth+5),p(4,yMouth+7),p(-4,yMouth+7)],shade(skin,8));
    // Each family has its own silhouette. Details use a separate stable stream.
    const h=a.hair,detail=rng(f.seed,'hair-detail');
    const cap=(rise=0)=>[p(-w,76),p(-w-1,51-rise),p(-w+13,37-rise),p(17,34-rise),p(w-3,44-rise),p(w+1,64),p(w-4,80),p(w-8,58),p(-w+9,59),p(-w+5,77)];
    if(h!==18){
      if([0,1,2,19,20,23].includes(h)){
        poly(cap(h===20?9:0),h===0?shade(skin,-43):hair);
        poly([p(-w,63),p(-w+7,60),p(-w+6,85),p(-w+1,89)],shade(skin,-30));
        poly([p(w-7,60),p(w,63),p(w-1,89),p(w-6,85)],shade(skin,-44));
        if(h===0)poly([p(-w+9,48),p(-20,41),p(19,40),p(w-10,49),p(w-10,55),p(-w+9,55)],shade(hair,27));
        if(h===1||h===20)poly([p(-w+7,48-(h===20?10:0)),p(w-7,46-(h===20?10:0)),p(w-8,55),p(-w+8,58)],hi);
        if(h===2||h===23)poly([p(-w+7,45),p(-14,35),p(20,34),p(w-8,43),p(w-10,55),p(-w+8,58)],hi);
        if(h===19)poly([p(-10,56),p(-10,26),p(-1,19),p(10,29),p(13,57)],hi);
      }else if([6,7,8,9,10,11,22].includes(h)){
        const rise=h===8?18:h===9?22:h===7||h===22?12:4;
        poly(cap(rise),hair);
        if(h===9)poly([p(-w+3,53),p(-w+3,20),p(w-3,20),p(w-1,55)],hair);
        const count=h===8?32:h===10||h===11?15:24;
        for(let k=0;k<count;k++){
          const x=-w+2+detail()*(w*2-4), y=(h===9?22:34-rise)+detail()*25;
          const r=h===8?8+detail()*4:h===22?7+detail()*4:4+detail()*4;
          if(h===10||h===11)poly([p(x,y-6),p(x+5,y-7),p(x+7,y+18+(h===11?7:0)),p(x+1,y+21),p(x-2,y+4)],k%3?hair:hi);
          else{ellipse(cx+x,y,r,r*.9,k%3?hair:hi);poly([p(x-r*.4,y-r*.3),p(x,y-r*.55),p(x+r*.3,y-r*.2)],shade(hair,28));}
        }
      }else if(h===13||h===14||h===12){
        poly(cap(1),shade(hair,14));
        for(let k=0;k<9;k++){
          let x=-w+5+k*(w*2-10)/8;
          poly([p(x*.68,39),p(x*.82+4,43),p(x+4,68),p(x,77),p(x-3,64)],hair);
          if(h===12)poly([p(x,45),p(x+6,43),p(x+10,84+(k%3)*10),p(x+5,89+(k%3)*10),p(x+1,68)],hair);
          else for(let j=0;j<(h===13?8:5);j++)poly([p(x*.75+j*x*.045,43+j*5),p(x*.75+3+j*x*.045,45+j*5),p(x*.75+j*x*.045,48+j*5)],hi);
          if(h===13)ellipse(cx+x,84+(k%2)*6,3.5,4,hair);
        }
      }else{
        poly(cap([4,16,17].includes(h)?7:2),hair);
        if(h===21){poly([p(-2,37),p(-27,36),p(-w-5,53),p(-w+3,85),p(-w+15,65)],hi);poly([p(1,37),p(25,36),p(w+7,52),p(w-3,85),p(w-15,64)],hi);}
        else if(h===3){poly([p(-w-1,50),p(-17,31),p(21,33),p(w-6,42),p(7,54),p(-w+4,63)],hi);poly([p(21,34),p(25,37),p(13,56),p(9,56)],shade(hair,-9));}
        else if(h===4){poly([p(-w+1,53),p(-w+14,30),p(3,25),p(w+7,42),p(w-4,55),p(2,42)],hi);}
        else if(h===15){poly([p(-w+3,55),p(-w+9,34),p(19,31),p(w+5,47),p(20,53)],hi);}
        else if(h===17){
          poly([p(-w-3,58),p(-w+4,32),p(-12,29),p(5,35),p(-12,54),p(-w+4,85)],hi);
          poly([p(4,35),p(28,31),p(w+8,48),p(w+8,86),p(w-4,72),p(w-9,48)],shade(hair,7));
        }else{
          for(let k=0;k<(h===16?11:8);k++){const x=-w+4+k*w/4;poly([p(x,44+detail()*5),p(x+12,36),p(x+22,45),p(x+15,62+detail()*13),p(x+9,56),p(x-1,63)],k%3?hair:hi);}
        }
        for(let k=0;k<4;k++)poly([p(-w+9+k*12,48),p(-w+19+k*12,40),p(-w+24+k*12,40),p(-w+12+k*12,49)],shade(hair,25));
      }
    }else poly([p(-w+12,top+1),p(-12,top-1),p(8,top),p(-16,top+5)],light);
    if(a.headband){poly([p(-w-1,65),p(0,62),p(w+1,65),p(w,73),p(0,70),p(-w,73)],trim);rect(123,64,10,5,jersey);}
    return out;
  }
  function paint(commands, canvas, size=256, ratio=1) {
    const pixels=Math.round(number(size,256,32,1024)*number(ratio,1,1,3));canvas.width=pixels;canvas.height=pixels;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas 2D unavailable');ctx.setTransform(pixels/256,0,0,pixels/256,0,0);
    for(const c of commands){ctx.fillStyle=c[c.length-1];ctx.beginPath();if(c[0]==='poly'){c[1].forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}else ctx.ellipse(c[1],c[2],c[3],c[4],0,0,Math.PI*2);ctx.fill();}
    return canvas;
  }
  class PortraitCache {
    constructor(budget=32*1024*1024){this.budget=budget;this.entries=new Map();this.bytes=0;this.hits=0;this.misses=0;}
    get(key){const v=this.entries.get(key);if(!v){this.misses++;return null;}this.hits++;this.entries.delete(key);this.entries.set(key,v);return v.canvas;}
    set(key,canvas){const bytes=canvas.width*canvas.height*4;if(this.entries.has(key)){this.bytes-=this.entries.get(key).bytes;this.entries.delete(key);}if(bytes>this.budget)return;while(this.bytes+bytes>this.budget){const first=this.entries.keys().next().value;this.bytes-=this.entries.get(first).bytes;this.entries.delete(first);}this.entries.set(key,{canvas,bytes});this.bytes+=bytes;}
    clear(){this.entries.clear();this.bytes=0;this.hits=0;this.misses=0;}
  }
  const cache=new PortraitCache();
  function prepare(player={},school={},options={}) {
    // Legacy IDs are a read-only preview fallback. Persist seeds at the game's migration boundary before production integration.
    const seed=player.portraitSeed??player.id??'portrait-preview';
    return deriveAppearance(deriveIdentity(seed,player.portraitVersion??VERSION),player,school,options);
  }
  function getCacheKey(player,school,options={}){return JSON.stringify([VERSION,prepare(player,school,options),number(options.size,256,32,1024),number(options.pixelRatio,1,1,3)]);}
  function renderPlayerPortrait(player,school,canvas,options={}){
    const appearance=prepare(player,school,options),key=getCacheKey(player,school,options),hit=cache.get(key);
    if(hit){canvas.width=hit.width;canvas.height=hit.height;canvas.getContext('2d').drawImage(hit,0,0);return appearance;}
    paint(drawingCommands(appearance),canvas,options.size,options.pixelRatio);
    if(typeof document!=='undefined'){const copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height;copy.getContext('2d').drawImage(canvas,0,0);cache.set(key,copy);}
    return appearance;
  }
  return {VERSION,HAIR,BEARDS,SKIN,HAIR_COLORS,hash,rng,deriveIdentity,deriveAppearance,drawingCommands,paint,prepare,getCacheKey,renderPlayerPortrait,PortraitCache,cache};
});
