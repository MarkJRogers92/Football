/* Dynasty Portraits v1 FROZEN: pure identity/appearance derivation and Canvas 2D rendering. Incompatible visual changes require a new portrait version. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DynastyPortraits = api;
})(typeof window !== 'undefined' ? window : this, function() {
  'use strict';
  const VERSION = 1;
  const VERSION_STATUS = 'frozen';
  const V1_FREEZE_ID = '2026-09-03-body-qc-freeze';
  const HAIR = ['Buzz cut','Crew cut','High fade','Side part','Swept back','Wavy crop','Short curls','Curly top','Afro','High top','Short twists','Short locs','Long locs','Braids','Cornrows','Mullet','Shag','Long waves','Bald','Mohawk','Flat top','Center part','Loose curls','Taper fade'];
  const BEARDS = ['Clean shaven','Stubble','Mustache','Goatee','Chin beard','Short beard','Full beard'];
  const SKIN = ['#f2c9a4','#e7b48d','#dca17a','#ca8a61','#b97850','#a96843','#945637','#80472e','#6b3928','#542d22'];
  const HAIR_COLORS = ['#171a1c','#28211e','#402b20','#65412a','#936037','#b88b4e','#ddbd78','#853e28'];
  const RARE_TRAITS = ['None','Eyebrow cut','Cheek scar','Widow’s peak','Prominent ears','Heavy brows','Sparse beard','Dense beard','Beauty mark'];
  const BODY_ARCHETYPES = Object.freeze({
    QB:Object.freeze({label:'Quarterback',shoulders:0,neck:0,pad:0,sleeve:0,trap:0,torso:0}),
    RB:Object.freeze({label:'Running back',shoulders:4,neck:3,pad:2,sleeve:1,trap:2,torso:3}),
    WR:Object.freeze({label:'Wide receiver',shoulders:-3,neck:-1,pad:-1,sleeve:-1,trap:-1,torso:-2}),
    TE:Object.freeze({label:'Tight end',shoulders:4,neck:2,pad:2,sleeve:2,trap:3,torso:3}),
    OL:Object.freeze({label:'Offensive line',shoulders:9,neck:6,pad:5,sleeve:4,trap:5,torso:7}),
    EDGE:Object.freeze({label:'Edge',shoulders:5,neck:3,pad:3,sleeve:2,trap:3,torso:4}),
    DT:Object.freeze({label:'Defensive tackle',shoulders:9,neck:6,pad:5,sleeve:4,trap:5,torso:6}),
    LB:Object.freeze({label:'Linebacker',shoulders:4,neck:3,pad:2,sleeve:2,trap:3,torso:3}),
    CB:Object.freeze({label:'Cornerback',shoulders:-4,neck:-1,pad:-1,sleeve:-1,trap:-2,torso:-3}),
    S:Object.freeze({label:'Safety',shoulders:-1,neck:0,pad:0,sleeve:0,trap:0,torso:-1}),
    ATH:Object.freeze({label:'Athlete',shoulders:0,neck:0,pad:0,sleeve:0,trap:0,torso:0})
  });

  const CAREER_HAIR_GROW = Object.freeze([
    [1,2,23],[2,3,5,23],[7,23],[4,21],[17,21],[6,16],[7,22],[8,22],[8],[8],[11,14],[12],[12],[12,13],[13],[16],[17],[17],[0],[19],[9],[17],[8,16],[1,2,6]
  ]);
  const CAREER_HAIR_TRIM = Object.freeze([
    [18,0],[0,23],[0,1,23],[1,2],[3],[2,23],[2,23],[6,2],[7,6],[2,20],[2,23],[10],[11,13],[14,10],[2,10],[5,1],[5,3],[5,4,16],[18],[2,0],[1,2],[3,4],[7,6],[0,1]
  ]);
  const CAREER_HAIR_RESTYLE = Object.freeze([
    [0,1,2,23],[0,1,2,3,23],[0,1,2,7,19,20,23],[1,3,4,5,21],[3,4,16,17,21],[3,5,6,16,17,22],[2,6,7,22,23],[2,6,7,8,9,22],[6,7,8,9,22],[2,7,8,9,20],[10,11,13,14],[10,11,12,13,14],[11,12,13],[10,11,12,13,14],[2,10,11,13,14],[1,5,15,16],[3,5,15,16,17,21],[4,5,16,17,21],[18,0,1],[0,2,19,20],[1,2,9,19,20],[3,4,16,17,21],[6,7,8,16,22],[0,1,2,6,23]
  ]);
  function deriveCareerGrooming(seed, baseHair, adultBeard, options={}) {
    const stages=6,hairLock=Number.isInteger(options.hair),beardLock=Number.isInteger(options.beard),enabled=options.enabled!==false;
    const hairBase=Math.round(number(hairLock?options.hair:baseHair,0,0,HAIR.length-1));
    const beardAdult=Math.round(number(beardLock?options.beard:adultBeard,0,0,BEARDS.length-1));
    if(!enabled)return Object.freeze(Array.from({length:stages},()=>Object.freeze({hair:hairBase,beard:beardAdult})));
    const r=rng(seed,'career-grooming-v2'),hair=Array(stages).fill(hairBase),beard=Array(stages).fill(0);
    if(hairLock){hair.fill(hairBase);}else{
      const temperament=r(),maxChanges=temperament<.2?0:temperament<.72?1:temperament<.94?2:3;
      const baseChance=temperament<.2?0:temperament<.72?.27:temperament<.94?.39:.5;
      let current=hairBase,changes=0,lastChange=-2;
      for(let stage=1;stage<stages;stage++){
        const seniorBoost=stage===4?.06:stage===5?.12:0;
        const canChange=changes<maxChanges&&stage-lastChange>1;
        if(canChange&&r()<baseChance+seniorBoost){
          const mode=r(),pool=(mode<.42?CAREER_HAIR_GROW[current]:mode<.72?CAREER_HAIR_TRIM[current]:CAREER_HAIR_RESTYLE[current])||[current];
          const candidates=pool.filter(v=>v!==current);
          if(candidates.length){current=candidates[Math.floor(r()*candidates.length)];changes++;lastChange=stage;}
        }
        hair[stage]=current;
      }
    }
    if(beardLock){beard.fill(beardAdult);}else{
      const maturity=number(options.maturity,.5,0,1),target=beardAdult;
      let onset=target===0?99:target===1?2:2+Math.floor(r()*2);
      if(maturity>.72)onset=Math.max(1,onset-1);else if(maturity<.25)onset=Math.min(4,onset+1);
      for(let stage=0;stage<stages;stage++){
        if(stage<onset)beard[stage]=0;
        else if(target===0)beard[stage]=0;
        else if(target===1)beard[stage]=1;
        else if(target===2)beard[stage]=stage===onset?1:2;
        else if(target===3)beard[stage]=stage===onset?1:3;
        else if(target===4)beard[stage]=stage===onset?1:4;
        else if(target===5)beard[stage]=stage===onset?1:5;
        else beard[stage]=stage===onset?1:stage===onset+1?5:6;
      }
      // A rare late-career shave/regrow gives believable change without constantly rerolling facial hair.
      if(target>=2&&r()<.14){const shaveStage=4+Math.floor(r()*2);beard[shaveStage]=r()<.55?0:1;}
    }
    return Object.freeze(hair.map((h,i)=>Object.freeze({hair:h,beard:beard[i]})));
  }
  const clamp = (n,a,b) => Math.min(b,Math.max(a,n));
  const number = (n,f,a,b) => clamp(n === null || n === '' || !Number.isFinite(Number(n)) ? f : Number(n),a,b);
  function hash(value) { let h=2166136261; for(const ch of String(value)){h ^= ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0; }
  function rng(seed, name) {let a=hash(`${VERSION}:${seed}:${name}`);return function(){a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
  function deriveIdentity(seed, version=VERSION) {
    if(version!==VERSION) throw new RangeError('Unsupported portrait version');
    const face=rng(seed,'face'),hair=rng(seed,'hair'),color=rng(seed,'color'),extra=rng(seed,'extras'),accessoryDetail=rng(seed,'accessory-detail'),rare=rng(seed,'rare-traits-v1');
    // Keep the original extras stream call order stable; accessory and rare-trait variants live in their own streams.
    const eyeBlack=extra()<.16,freckles=extra()<.15,headband=extra()<.06;
    const eyeBlackStyle=eyeBlack?1+Math.floor(accessoryDetail()*3):0;
    const headbandStyle=headband?1+Math.floor(accessoryDetail()*2):0;
    const earringStyle=accessoryDetail()<.075?1+Math.floor(accessoryDetail()*3):0;
    const earringTone=Math.floor(accessoryDetail()*2),headbandTone=Math.floor(accessoryDetail()*3);
    // Each distinctive trait is intentionally uncommon. Multiple traits are possible, but naturally rare.
    const beardRoll=rare(),rareTraits=Object.freeze({
      eyebrowCut:rare()<.025,scar:rare()<.015,widowPeak:rare()<.035,prominentEars:rare()<.025,heavyBrows:rare()<.035,
      beardDensity:beardRoll<.02?.68:beardRoll>.98?1.2:1,beautyMark:rare()<.015,side:rare()<.5?-1:1
    });
    return Object.freeze({seed:String(seed),version,shape:Math.floor(face()*6),width:38+face()*9,jaw:25+face()*13,length:64+face()*12,chin:12+face()*11,eyes:13+face()*6,eyeSize:3+face()*2,brow:2+face()*3,nose:4+face()*4,mouth:10+face()*8,ear:5+face()*3,skin:Math.floor(color()*10),hairColor:Math.floor(color()*8),hair:Math.floor(hair()*HAIR.length),beard:Math.floor(hair()*BEARDS.length),maturity:hair(),eyeColor:Math.floor(color()*4),eyeBlack,eyeBlackStyle,freckles,headband,headbandStyle,earringStyle,earringTone,headbandTone,rareTraits});
  }
  function deriveAppearance(identity, player={}, school={}, options={}) {
    const o=options.overrides||{};
    const age=number(player.age,18+number(player.eligibilityUsed,0,0,6),16,40);
    const height=number(player.height,74,62,86),weight=number(player.weight,215,140,400);
    const mass=clamp((weight-175)/175,0,1.25),mature=clamp((age-18)/5,0,1);
    const position=String(player.pos||player.position||'ATH').toUpperCase();
    const body=BODY_ARCHETYPES[position]||BODY_ARCHETYPES.ATH;
    const validColor=(v,f)=>/^#[\da-f]{6}$/i.test(v||'')?v:f;
    const noneRare=()=>({eyebrowCut:false,scar:false,widowPeak:false,prominentEars:false,heavyBrows:false,beardDensity:1,beautyMark:false,side:identity.rareTraits.side||-1});
    const forcedRare=Math.round(number(o.rareTraitStyle,-1,-1,RARE_TRAITS.length-1));
    let rareTraits=o.rareTraits===false?noneRare():{...identity.rareTraits};
    if(forcedRare>=0){rareTraits=noneRare();if(forcedRare===1)rareTraits.eyebrowCut=true;else if(forcedRare===2)rareTraits.scar=true;else if(forcedRare===3)rareTraits.widowPeak=true;else if(forcedRare===4)rareTraits.prominentEars=true;else if(forcedRare===5)rareTraits.heavyBrows=true;else if(forcedRare===6)rareTraits.beardDensity=.68;else if(forcedRare===7)rareTraits.beardDensity=1.2;else if(forcedRare===8)rareTraits.beautyMark=true;}
    rareTraits=Object.freeze(rareTraits);
    return Object.freeze({identity,age,height,weight,mass,mature,position,
      skin:Math.round(number(o.skin,identity.skin,0,9)),hair:Math.round(number(o.hair,identity.hair,0,HAIR.length-1)),
      beard:Math.round(number(o.beard,age<19&&identity.maturity>.35?0:identity.beard,0,BEARDS.length-1)),
      hairColor:Math.round(number(o.hairColor,identity.hairColor,0,7)),
      eyeBlackStyle:o.accessories===false?0:Math.round(number(o.eyeBlackStyle,identity.eyeBlackStyle||0,0,3)),
      headbandStyle:o.accessories===false?0:Math.round(number(o.headbandStyle,identity.headbandStyle||0,0,2)),
      earringStyle:o.accessories===false?0:Math.round(number(o.earringStyle,identity.earringStyle||0,0,3)),
      earringTone:identity.earringTone||0,headbandTone:identity.headbandTone||0,freckles:identity.freckles,rareTraits,
      neck:13+mass*9+mature*2+body.neck*.28,shoulders:76+mass*30+(height-74)*.7+body.shoulders,padRise:3+mass*3+body.pad*.5,sleeveDrop:8+mass*4+body.sleeve*.5,trapRise:body.trap,torsoWidth:40+mass*2.5+body.torso,
      primary:validColor(school.primary,'#174d46'),secondary:validColor(school.secondary,'#ecb45b'),
      number:String(Math.round(number(player.jerseyNumber,12,0,99))),neutral:!!options.neutral,
      background:validColor(options.background,'#263b42')});
  }
  function shade(hex,n){return '#'+hex.slice(1).match(/../g).map(v=>clamp(parseInt(v,16)+n,0,255).toString(16).padStart(2,'0')).join('');}
  // Serializable drawing commands provide stable golden tests independent of browser antialiasing.
  function drawingCommands(a) {
    const out=[],poly=(points,color)=>out.push(['poly',points,color]),ellipse=(x,y,rx,ry,color)=>out.push(['ellipse',x,y,rx,ry,color]);
    const rect=(x,y,w,h,c)=>poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],c);
    const f=a.identity,skin=SKIN[a.skin],light=shade(skin,19),shadow=shade(skin,-27),deep=shade(skin,-49),hair=HAIR_COLORS[a.hairColor],hi=shade(hair,[5,6].includes(a.hairColor)?8:17);
    const cx=128,top=49,shapeWidth=[0,3,5,-3,2,-2][f.shape],shapeLength=[0,-6,-2,8,3,6][f.shape];
    const matureJaw=a.mature*1.9,matureChin=a.mature*.8;
    const bottom=top+f.length+19+shapeLength,w=f.width+shapeWidth+(a.mass*3),jaw=f.jaw+[3,7,-2,-3,1,-5][f.shape]+(a.mass*3)+matureJaw,chin=f.chin+[5,6,-2,-1,1,-3][f.shape]+matureChin;
    const yEye=84+(f.length-64)*.25,yNose=yEye+20,yMouth=Math.min(yNose+15,bottom-13);
    const p=(x,y)=>[cx+x,y];
    // Fine facial rendering variation lives in its own stream so the stored identity fields remain stable.
    const faceDetail=rng(f.seed,'face-art');
    const eyeSlant=(faceDetail()-.5)*2.8,baseEyeOpen=3.8+faceDetail()*1.6,eyeOpen=Math.max(3.25,baseEyeOpen-a.mature*.35),browTilt=(faceDetail()-.5)*3.6,browArch=faceDetail()*2.6;
    const browThick=2+faceDetail()*1.35,noseBridge=3.2+faceDetail()*3,noseTip=(faceDetail()-.5)*2.7,noseDrop=(faceDetail()-.5)*3.2,mouthCurve=(faceDetail()-.5)*2.6,lipFull=1.2+faceDetail()*1.9,faceAsym=(faceDetail()-.5)*1.5;
    const cheekSet=(faceDetail()-.5)*5.5,cheekDepth=3+faceDetail()*6,templeDepth=1+faceDetail()*4,browSet=(faceDetail()-.5)*2.6,mouthBias=(faceDetail()-.5)*2.2,philtrum=1.2+faceDetail()*2.4;
    // Expression geometry is rendering-only: it gives each stable identity a more readable resting face without adding mutable player state.
    const eyeStyle=Math.floor(faceDetail()*4),eyeLift=(faceDetail()-.5)*1.3,gazeX=(faceDetail()-.5)*1.25,gazeY=(faceDetail()-.5)*.7,browLift=(faceDetail()-.5)*2.4;
    const mouthMood=(faceDetail()-.5)*3.6,mouthTilt=(faceDetail()-.5)*1.5,mouthScale=.88+faceDetail()*.2,upperLip=.8+faceDetail()*1.2,lowerLip=1.2+faceDetail()*1.8;
    const rt=a.rareTraits||{eyebrowCut:false,scar:false,widowPeak:false,prominentEars:false,heavyBrows:false,beardDensity:1,beautyMark:false,side:-1};
    rect(0,0,256,256,a.background);
    poly([[0,0],[201,0],[62,256],[0,256]],shade(a.background,5));
    ellipse(128,224,106,20,shade(a.background,-9));
    const jersey=a.neutral?'#495862':a.primary,trim=a.neutral?'#a7b7bc':a.secondary,s=a.shoulders,n=a.neck,pad=a.padRise,sleeve=a.sleeveDrop,trap=a.trapRise||0,torso=a.torsoWidth||40,trapY=160-trap;
    // Layered shoulder pads and sleeves give the uniform a football silhouette instead of a generic shirt shape.
    poly([p(-s,181-pad),p(-s-12,256),p(s+12,256),p(s,181-pad),p(44,trapY),p(-44,trapY)],shade(jersey,-19));
    poly([p(-s,181-pad),p(-58,167-pad*.35),p(-39,171),p(-27,202),p(-37,256),p(-s-12,256)],shade(jersey,13));
    poly([p(58,167-pad*.35),p(s,181-pad),p(s+12,256),p(41,256),p(30,203),p(39,171)],shade(jersey,-7));
    poly([p(-torso,171-trap*.16),p(0,182-trap*.08),p(torso,171-trap*.16),p(torso+3,256),p(-torso-1,256)],jersey);
    // Sleeve caps, cuffs and pad highlights stay readable at 48-64 px.
    poly([p(-s,187-pad),p(-59,171-pad*.2),p(-51,180),p(-s-2,198+sleeve*.12)],trim);
    poly([p(59,171-pad*.2),p(s,187-pad),p(s+2,198+sleeve*.12),p(51,180)],trim);
    poly([p(-s-1,193),p(-62,181),p(-59,188+sleeve),p(-s-5,204+sleeve*.45)],shade(jersey,-31));
    poly([p(62,181),p(s+1,193),p(s+5,204+sleeve*.45),p(59,188+sleeve)],shade(jersey,-25));
    poly([p(-s+8,180-pad),p(-57,170-pad*.25),p(-45,174),p(-61,183)],shade(jersey,22));
    poly([p(57,170-pad*.25),p(s-8,180-pad),p(61,183),p(45,174)],shade(jersey,3));
    poly([p(-n,120),p(n,120),p(n+3,165),p(29,172),p(0,193),p(-29,172),p(-n-3,165)],skin);
    poly([p(0,130),p(n,122),p(n+3,165),p(29,172),p(0,185)],shadow);
    poly([p(-n,132),p(n,133),p(n,146),p(0,155),p(-n,148)],deep);
    // Rib-knit collar with a darker inner V gives the neckline more depth.
    poly([p(-36,168),p(-25,167),p(0,185),p(25,167),p(36,168),p(0,202)],trim);
    poly([p(-25,170),p(0,188),p(25,170),p(0,197)],shade(jersey,-37));
    poly([p(-21,173),p(0,189),p(21,173),p(0,194)],shade(trim,-18));
    // Chest planes/folds keep large uniforms from reading as a flat color block.
    poly([p(-torso+1,197-trap*.1),p(-11,207),p(-17,256),p(-torso+4,256)],shade(jersey,7));
    poly([p(torso-1,197-trap*.1),p(13,207),p(19,256),p(torso+1,256)],shade(jersey,-12));
    poly([p(-8,202),p(0,207),p(8,202),p(4,256),p(-4,256)],shade(jersey,-5));
    // Small procedural block numerals, with a dark underlay for cleaner thumbnail readability.
    const digits=['111101101101111','010110010010111','111001111100111','111001111001111','101101111001001','111100111001111','111100111101111','111001001001001','111101111101111','111101111001111'];
    const digitStep=5,digitSpan=20,start=128-(a.number.length*digitSpan-3)/2;
    a.number.split('').forEach((d,i)=>digits[Number(d)].split('').forEach((bit,j)=>{if(bit==='1'){const x=start+i*digitSpan+(j%3)*digitStep,y=212+Math.floor(j/3)*digitStep;rect(x-.8,y-.8,5.8,5.8,shade(jersey,-42));rect(x,y,4.2,4.2,trim);}}));
    // Long styles build their rear silhouette before the face so features stay readable.
    if([12,15,16,17,21].includes(a.hair)){
      const back=rng(f.seed,'hair-back-detail');
      if(a.hair===12){
        for(const side of [-1,1])for(let k=0;k<4;k++){
          const x=side*(w+2+k*3),drop=132+k*8+back()*16,bend=side*(3+back()*5);
          poly([p(x-side*6,60+k*2),p(x,57+k*2),p(x+bend,drop),p(x+bend-side*5,drop+13),p(x-side*5,92)],k%3?hair:hi);
        }
      }else if(a.hair===15){
        poly([p(-w+5,58),p(w-5,57),p(w+8,104),p(w+11,151),p(w-2,169),p(w-10,121),p(-w+10,121),p(-w+2,169),p(-w-11,151),p(-w-8,105)],hair);
        poly([p(-w-5,91),p(-w+3,98),p(-w+1,154),p(-w-6,163)],hi);poly([p(w+4,92),p(w-2,99),p(w-1,154),p(w+6,162)],shade(hair,7));
      }else if(a.hair===16){
        poly([p(-w-3,55),p(w+3,54),p(w+11,102),p(w+7,148),p(w-3,161),p(w-12,123),p(-w+11,127),p(-w+2,162),p(-w-8,145),p(-w-11,96)],hair);
        for(let k=0;k<3;k++){poly([p(-w-4+k*5,87),p(-w-8+k*4,125),p(-w-2+k*3,151)],k%2?hi:hair);poly([p(w+3-k*5,88),p(w+8-k*4,125),p(w+2-k*3,149)],k%2?shade(hair,8):hair);}
      }else if(a.hair===17){
        poly([p(-w-4,53),p(w+4,52),p(w+12,98),p(w+10,151),p(w-1,169),p(w-10,126),p(-w+10,126),p(-w+1,169),p(-w-10,151),p(-w-12,99)],hair);
        for(let k=0;k<3;k++){const y=92+k*18;poly([p(-w-6,y),p(-w+2,y+7),p(-w-3,y+17),p(-w-9,y+10)],hi);poly([p(w+6,y),p(w-2,y+7),p(w+3,y+17),p(w+9,y+10)],shade(hair,8));}
      }else{
        poly([p(-w-5,55),p(-4,42),p(0,49),p(4,42),p(w+5,55),p(w+10,107),p(w+6,153),p(w-2,166),p(w-10,119),p(-w+10,119),p(-w+2,166),p(-w-6,153),p(-w-10,107)],hair);
        poly([p(-w-5,84),p(-w+4,91),p(-w+1,151),p(-w-5,160)],hi);poly([p(w+5,84),p(w-4,91),p(w-1,151),p(w+5,160)],shade(hair,8));
      }
    }
    const earBoost=rt.prominentEars?3.2:0;
    for(const side of [-1,1]){poly([p(side*(w-2),80),p(side*(w+f.ear+earBoost),78),p(side*(w+f.ear+2+earBoost),88),p(side*(w+4+earBoost*.35),105),p(side*(w-1),107)],side<0?skin:shadow);poly([p(side*(w+1),86),p(side*(w+4+earBoost*.45),85),p(side*(w+3+earBoost*.35),98)],deep);}
    const temple=f.shape===1?3:0,cheek=f.shape===2?5:0;
    const outline=[p(-w+10,top),p(w-10,top),p(w,top+15),p(w-temple,101),p(jaw+cheek,bottom-13),p(chin,bottom),p(-chin,bottom),p(-jaw-cheek,bottom-13),p(-w+temple,101),p(-w,top+15)];
    poly(outline,skin);
    poly([p(-w+10,top),p(-9,top+2),p(-18,yEye-7),p(-w+3,yEye+2),p(-w,top+15)],light);
    poly([p(w-10,top),p(w,top+15),p(w-temple,101),p(jaw+cheek,bottom-13),p(chin,bottom),p(7,bottom-1),p(18,104),p(20,top+12)],shadow);
    // Seeded forehead/temple planes make otherwise similar head outlines read differently at 48-64 px.
    poly([p(-w+8,top+5),p(-15,top+3),p(-22,yEye-11+browSet),p(-w+4,90)],shade(skin,Math.round(5-templeDepth)));
    poly([p(w-8,top+5),p(15,top+4),p(24,yEye-10-browSet*.4),p(w-3,92)],shade(skin,Math.round(-12-templeDepth)));
    poly([p(-w+2,101),p(-20,107+cheekSet*.2),p(-14,117),p(-jaw,bottom-13)],shade(skin,-9));
    poly([p(-chin,bottom),p(chin,bottom),p(jaw,bottom-13),p(9,bottom-8),p(-10,bottom-8),p(-jaw,bottom-13)],shade(skin,-16-Math.round(a.mature*4)));
    // Cheek planes add structure without changing permanent identity fields.
    poly([p(-w+4,99+cheekSet*.25),p(-24,103+cheekSet),p(-13,114+cheekSet*.35),p(-jaw+4,bottom-16),p(-18,bottom-22)],shade(skin,Math.round(7-cheekDepth*.35)));
    poly([p(w-4,99-cheekSet*.18),p(25,103-cheekSet*.55),p(14,115-cheekSet*.2),p(jaw-4,bottom-16),p(19,bottom-22)],shade(skin,Math.round(-10-cheekDepth*.65)));
    if(a.mature>.15){
      const ageShade=shade(skin,-18-Math.round(a.mature*9));
      poly([p(-25,yEye+7),p(-11,yEye+9),p(-15,yEye+11+a.mature*2),p(-27,yEye+9)],ageShade);
      poly([p(11,yEye+9),p(25,yEye+7),p(27,yEye+9),p(15,yEye+11+a.mature*2)],ageShade);
      poly([p(-f.nose-5,yNose+8),p(-f.mouth-3,yMouth-5),p(-f.mouth+1,yMouth-3)],shade(skin,-12-Math.round(a.mature*7)));
      poly([p(f.nose+5,yNose+8),p(f.mouth+3,yMouth-5),p(f.mouth-1,yMouth-3)],shade(skin,-18-Math.round(a.mature*7)));
    }
    for(const side of [-1,1]){
      const x=side*f.eyes,offset=side<0?-faceAsym:faceAsym*.45,y=yEye+offset+eyeLift,slant=side*eyeSlant;
      const eyeScale=[1.08,.76,.91,1.18][eyeStyle],localOpen=Math.max(2.6,eyeOpen*eyeScale),eyeInset=[0,.8,.35,-.25][eyeStyle],outerBias=[0,.2,-1.0,.65][eyeStyle]*side;
      poly([p(x-8+eyeInset,y-3-slant*.25),p(x+7-eyeInset,y-3+slant*.25+outerBias*.18),p(x+8-eyeInset,y+3.6+slant*.18+outerBias*.25),p(x-7+eyeInset,y+3.7-slant*.18)],shade(skin,-18));
      poly([p(x-6.8+eyeInset,y-1.15-slant*.18),p(x+6.4-eyeInset,y-1.25+slant*.18+outerBias*.12),p(x+5.45-eyeInset,y+localOpen+outerBias*.22),p(x-5.75+eyeInset,y+localOpen)],'#d9d2bd');
      const iris=['#3b3026','#4e5042','#55606a','#6b4c2f'][f.eyeColor],irisY=y+1.05+gazeY,irisX=x+gazeX;
      ellipse(cx+irisX,irisY,f.eyeSize*.61,Math.max(1.65,localOpen*.43),iris);ellipse(cx+irisX,irisY+.15,1.12,Math.max(1.45,localOpen*.34),'#202429');ellipse(cx+irisX-.6,irisY-1.05,.62,.62,'#eee6d5');
      poly([p(x-7.1+eyeInset,y-1.3-slant*.15),p(x+6.5-eyeInset,y-1.5+slant*.15+outerBias*.1),p(x+5.7-eyeInset,y-.3+slant*.1),p(x-6+eyeInset,y-.15-slant*.1)],deep);
      if(eyeStyle===2)poly([p(x-7,y-2.7),p(x+6,y-3.1+outerBias*.1),p(x+4.8,y-.9),p(x-5.5,y-.65)],shade(skin,-10));
      const browY=y-8-browArch*.45+browSet*.25+browLift-a.mature*.45,browSlope=side*browTilt,effectiveBrowThick=browThick+(rt.heavyBrows?1.6:0);
      poly([p(x-8,browY-browSlope*.35),p(x+6,browY-1+browSlope*.35),p(x+8,browY+effectiveBrowThick+browSlope*.3),p(x-7,browY+effectiveBrowThick-browSlope*.3)],hair);
      if(rt.eyebrowCut&&side===rt.side){const cutX=x+side*4.2,cutTone=side<0?shade(skin,1):shade(skin,-15);poly([p(cutX-1.2,browY-1.2),p(cutX+.4,browY-1),p(cutX+1.8,browY+effectiveBrowThick+1.2),p(cutX+.1,browY+effectiveBrowThick+1.4)],cutTone);}
      if(a.eyeBlackStyle===1){
        poly([p(x-7,y+7.2),p(x+7,y+6.8),p(x+6.2,y+10.1),p(x-6.3,y+10.6)],'#252a2b');
      }else if(a.eyeBlackStyle===2){
        poly([p(x-7,y+7.1),p(x+6.5,y+6.7),p(x+6,y+8.8),p(x-6.5,y+9.2)],'#252a2b');
        poly([p(x-5.5,y+10),p(x+5.3,y+9.7),p(x+4.8,y+11.7),p(x-5,y+12)],'#252a2b');
      }else if(a.eyeBlackStyle===3){
        ellipse(cx+x-.6,y+9.3,7.1,3.05,'#252a2b');
        ellipse(cx+x+3.9*side,y+10.2,3.1,2.25,shade('#252a2b',7));
      }
      if(a.freckles)for(let k=0;k<4;k++)ellipse(cx+x-6+k*4,y+11+(k%2)*2.5,.75,.65,deep);
    }
    if(rt.scar){const side=rt.side||-1,x=side*(f.eyes+10),y=yEye+14,scarTone=side<0?shade(skin,-24):shade(skin,-34);poly([p(x-1.1,y-3.5),p(x+.2,y-4),p(x+4.3*side,y+4.2),p(x+3.1*side,y+4.8)],scarTone);}
    if(rt.beautyMark){const side=rt.side||-1;ellipse(cx+side*(f.eyes+9),yEye+17,1.05,1.05,shade(skin,-58));}
    // A bridge, tip and nostrils make nose-width/length changes much easier to read at roster size.
    const noseY=yNose+noseDrop;
    poly([p(-noseBridge*.35,yEye+3),p(1,yEye+1),p(f.nose*.5,noseY-4),p(1+noseTip,noseY+2),p(-f.nose*.35,noseY-1)],shade(skin,12));
    poly([p(1,yEye+2),p(noseBridge*.55,yEye+5),p(f.nose+2,noseY),p(2+noseTip,noseY+4)],shadow);
    poly([p(-f.nose,noseY+1),p(-2+noseTip*.2,noseY+4),p(4+noseTip*.3,noseY+4),p(f.nose+2,noseY)],deep);
    ellipse(cx-f.nose*.55,noseY+2.8,1.45,.9,shade(skin,-58));ellipse(cx+f.nose*.65,noseY+2.7,1.35,.85,shade(skin,-58));
    const beard=shade(hair,5),beardDeep=shade(hair,-13),beardHi=shade(hair,18),beardDetail=rng(f.seed,'beard-detail');
    const baseBeardDensity=.72+a.mature*.28,beardTrait=rt.beardDensity||1,beardDensity=clamp(baseBeardDensity*beardTrait,.42,1.35);
    if(a.beard===1){
      // Stubble is texture rather than a solid painted jaw mask.
      poly([p(-jaw-1,yMouth+1),p(-7,yMouth+8),p(0,bottom-1),p(7,yMouth+8),p(jaw+1,yMouth+1),p(jaw-2,bottom-10),p(chin,bottom),p(-chin,bottom),p(-jaw+2,bottom-10)],shade(skin,-11-Math.round(a.mature*4)));
      const stubbleCount=beardTrait<.9?12:beardTrait>1.1?24:18;for(let k=0;k<stubbleCount;k++){const side=k%2?-1:1,x=side*(5+beardDetail()*(jaw-5)),y=yMouth+6+beardDetail()*Math.max(8,bottom-yMouth-10);ellipse(cx+x,y,.48+.28*beardDensity,.55+.3*beardDensity,k%4?beardDeep:beard);}
    }
    if(a.beard===5||a.beard===6){
      const full=a.beard===6,densityShift=beardTrait<.9?8:beardTrait>1.1?-4:0,cheekY=(full?105:111)+densityShift,drop=(full?10:3)+(beardTrait<.9?-3:beardTrait>1.1?3:0);
      poly([p(-w+5,cheekY),p(-jaw+1,118),p(-f.mouth-1,yMouth+2),p(-5,yMouth+8),p(0,yMouth+10),p(5,yMouth+8),p(f.mouth+1,yMouth+2),p(jaw-1,118),p(w-5,cheekY),p(jaw+3,bottom-8),p(chin,bottom+drop),p(0,bottom+drop+3),p(-chin,bottom+drop),p(-jaw-3,bottom-8)],beard);
      poly([p(-jaw+2,121),p(-13,bottom-8),p(-chin+2,bottom+drop-1),p(-jaw+5,bottom-9)],beardHi);
      poly([p(jaw-2,120),p(15,bottom-7),p(chin-2,bottom+drop-1),p(jaw-5,bottom-8)],beardDeep);
      for(let k=0;k<(full?12:7);k++){const side=k%2?-1:1,x=side*(9+beardDetail()*Math.max(9,jaw-10)),y=116+beardDetail()*Math.max(8,bottom-120);poly([p(x-1.2,y),p(x+1.5,y+2),p(x+.4,y+6),p(x-1.7,y+3)],k%3?beardDeep:beardHi);}
    }
    if(a.beard===4){
      // Chin beard leaves the cheeks and upper lip clean.
      poly([p(-9,yMouth+7),p(-5,yMouth+11),p(-8,bottom-5),p(0,bottom+5+a.mature*3),p(8,bottom-5),p(5,yMouth+11),p(9,yMouth+7)],beard);
      poly([p(-2,yMouth+10),p(3,yMouth+11),p(2,bottom+1),p(-1,bottom+3)],beardHi);
    }
    if(a.beard===3){
      // Goatee combines a separated mustache with a tapered center chin patch.
      poly([p(-11,yMouth-5),p(-3,yMouth-7),p(-1,yMouth-4),p(-4,yMouth),p(-12,yMouth-1)],beard);
      poly([p(1,yMouth-4),p(3,yMouth-7),p(11,yMouth-5),p(12,yMouth-1),p(4,yMouth)],beardDeep);
      poly([p(-8,yMouth+7),p(8,yMouth+7),p(7,bottom-5),p(0,bottom+2),p(-7,bottom-5)],beard);
      poly([p(-2,yMouth+10),p(3,yMouth+10),p(2,bottom-2),p(-1,bottom)],beardHi);
    }
    if(a.beard===2){
      // Two-lobed mustache with seed-controlled width and center gap.
      const moustacheWidth=Math.max(9.5,f.mouth*(.7+beardDetail()*.18)),stacheDrop=3+beardDetail()*2;
      poly([p(-moustacheWidth,yMouth-5),p(-4,yMouth-7),p(-1.3,yMouth-4),p(-3,yMouth-1),p(-moustacheWidth+1,yMouth+stacheDrop)],beard);
      poly([p(1.3,yMouth-4),p(4,yMouth-7),p(moustacheWidth,yMouth-5),p(moustacheWidth-1,yMouth+stacheDrop),p(3,yMouth-1)],beardDeep);
    }
    if(a.beard>=5){
      poly([p(-f.mouth*.9,yMouth-5),p(-4,yMouth-7),p(-1.2,yMouth-4),p(-3,yMouth),p(-f.mouth*.88,yMouth+1)],beardDeep);
      poly([p(1.2,yMouth-4),p(4,yMouth-7),p(f.mouth*.9,yMouth-5),p(f.mouth*.88,yMouth+1),p(3,yMouth)],beard);
    }
    const mouthY=yMouth+mouthCurve*.35+mouthBias*.18,mouthHalf=f.mouth*.72*mouthScale,leftCorner=mouthY+mouthMood+mouthTilt,rightCorner=mouthY+mouthMood-mouthTilt,centerY=mouthY-mouthMood*.42;
    poly([p(-mouthHalf,leftCorner),p(-3,centerY-upperLip),p(0,centerY-.2),p(3,centerY-upperLip),p(mouthHalf,rightCorner),p(4,centerY+1.45),p(-4,centerY+1.45)],shade(skin,-39));
    poly([p(-f.mouth*.48*mouthScale,centerY+1.9),p(0,centerY+1.2),p(f.mouth*.48*mouthScale,centerY+1.9),p(4,centerY+2.8+lowerLip+lipFull*.3),p(-4,centerY+2.8+lowerLip+lipFull*.3)],shade(skin,7));
    poly([p(-4,centerY+2.05),p(4,centerY+2.05),p(2,centerY+2.55),p(-2,centerY+2.55)],shade(skin,-22));
    poly([p(-2,yMouth-8),p(0,yMouth-8-philtrum),p(2,yMouth-8),p(1,yMouth-4),p(-1,yMouth-4)],shade(skin,-16));
    // Each hairstyle gets a distinct silhouette; detail randomness is isolated from identity/gameplay RNG.
    const h=a.hair,detail=rng(f.seed,'hair-detail');
    const fadeSides=()=>{poly([p(-w,59),p(-w+8,56),p(-w+7,82),p(-w+1,88)],shade(hair,-4));poly([p(w-8,56),p(w,59),p(w-1,88),p(w-7,82)],shade(hair,-10));};
    const topCap=(topY=38,edgeY=60)=>[p(-w+2,edgeY),p(-w+7,topY+7),p(-18,topY),p(17,topY-1),p(w-7,topY+6),p(w-2,edgeY),p(w-8,64),p(-w+8,64)];
    if(h===18){
      poly([p(-w+12,top+1),p(-12,top-1),p(8,top),p(-16,top+5)],light);
    }else if(h===0){
      poly([p(-w+4,58),p(-w+10,49),p(-20,44),p(19,43),p(w-10,49),p(w-4,58),p(w-7,63),p(-w+7,63)],shade(hair,4));fadeSides();
      for(let k=0;k<5;k++)poly([p(-24+k*12,48),p(-19+k*12,46),p(-16+k*12,50)],hi);
    }else if(h===1){
      fadeSides();poly(topCap(36,59),hair);poly([p(-w+10,45),p(-19,36),p(18,36),p(w-10,45),p(w-10,51),p(-w+10,52)],hi);
    }else if(h===2){
      fadeSides();poly([p(-w+10,56),p(-w+15,38),p(-16,31),p(18,31),p(w-11,40),p(w-7,57),p(w-12,61),p(-w+12,61)],hair);poly([p(-17,34),p(18,33),p(w-13,41),p(-w+16,43)],hi);
    }else if(h===3){
      poly(topCap(34,62),hair);poly([p(-w+2,51),p(-18,31),p(7,32),p(24,39),p(8,51),p(-w+6,62)],hi);poly([p(8,32),p(24,37),p(14,54),p(9,55)],shade(hair,-9));fadeSides();
    }else if(h===4){
      poly(topCap(31,61),hair);poly([p(-w+3,52),p(-w+14,31),p(-4,25),p(20,29),p(w+5,43),p(w-5,54),p(8,42)],hi);poly([p(-2,29),p(19,28),p(30,39),p(17,37)],shade(hair,7));
    }else if(h===5){
      poly(topCap(34,64),hair);for(let k=0;k<7;k++){const x=-w+8+k*(w*2-16)/6,y=40+(k%2)*3;poly([p(x-6,y+10),p(x,y-4),p(x+8,y+2),p(x+5,y+16),p(x,y+11)],k%2?hair:hi);}fadeSides();
    }else if(h===6){
      poly(topCap(39,63),hair);for(let k=0;k<13;k++){const x=-w+7+(k%7)*(w*2-14)/6,y=39+Math.floor(k/7)*11+(k%2)*2,r=4.5+detail()*2;ellipse(cx+x,y,r,r*.86,k%3?hair:hi);}fadeSides();
    }else if(h===7){
      fadeSides();poly(topCap(30,61),hair);for(let k=0;k<16;k++){const x=-w+11+(k%8)*(w*2-22)/7,y=29+Math.floor(k/8)*12+(k%2)*2,r=5+detail()*2.5;ellipse(cx+x,y,r,r*.88,k%3?hair:hi);}
    }else if(h===8){
      poly([p(-w-7,61),p(-w-5,37),p(-w+5,19),p(-19,10),p(7,9),p(w-1,17),p(w+8,34),p(w+8,61),p(w,70),p(-w,70)],hair);
      for(let k=0;k<24;k++){const angle=(k/24)*Math.PI*2,radius=25+detail()*12,x=Math.cos(angle)*radius*.95,y=34+Math.sin(angle)*radius*.62;const r=6+detail()*3;ellipse(cx+x,y,r,r*.9,k%4?hair:hi);} 
    }else if(h===9){
      fadeSides();poly([p(-w+9,58),p(-w+10,24),p(-w+15,18),p(w-14,18),p(w-9,25),p(w-8,58),p(w-13,63),p(-w+13,63)],hair);poly([p(-w+15,20),p(w-14,20),p(w-13,26),p(-w+14,27)],hi);for(let k=0;k<5;k++)poly([p(-18+k*9,25),p(-16+k*9,52),p(-12+k*9,52),p(-13+k*9,24)],shade(hair,k%2?7:-4));
    }else if(h===10){
      fadeSides();poly(topCap(34,61),shade(hair,-2));for(let k=0;k<9;k++){const x=-w+10+k*(w*2-20)/8,len=15+(k%3)*4;poly([p(x-3,37),p(x+3,35),p(x+5,35+len),p(x+1,39+len),p(x-2,50)],k%2?hair:hi);poly([p(x+1,39),p(x+4,43),p(x,47)],shade(hair,20));}
    }else if(h===11){
      fadeSides();poly(topCap(32,61),hair);for(let k=0;k<8;k++){const x=-w+10+k*(w*2-20)/7,len=24+(k%3)*7;poly([p(x-3,34),p(x+4,33),p(x+6,34+len),p(x+1,39+len),p(x-3,51)],k%3?hair:hi);}
    }else if(h===12){
      poly(topCap(33,63),hair);for(let k=0;k<7;k++){const x=-w+10+k*(w*2-20)/6,len=34+(k%3)*7;poly([p(x-3,35),p(x+4,34),p(x+5,35+len),p(x,42+len),p(x-3,53)],k%3?hair:hi);} 
    }else if(h===13){
      poly(topCap(35,61),shade(hair,-2));
      // Braids hang outside the cheek line instead of reading like marks painted across the face.
      for(const side of [-1,1])for(let k=0;k<2;k++){
        const x=side*(w-2+k*6),base=57+k*3,rope=[];
        for(let j=0;j<8;j++){const y=base+j*7,shift=side*(j%2?1.15:-1.15);rope.push(p(x-2.4+shift,y));}
        for(let j=7;j>=0;j--){const y=base+j*7,shift=side*(j%2?1.15:-1.15);rope.push(p(x+2.4+shift,y));}
        poly(rope,k?hair:shade(hair,-5));
        for(let j=1;j<7;j+=2){const y=base+j*7,shift=side*(j%2?1.15:-1.15);poly([p(x-1.7+shift,y),p(x+1.6+shift,y+1.2),p(x+.9+shift,y+3.2),p(x-1.8+shift,y+2.2)],hi);}
        ellipse(cx+x,base+52,2.2,2.7,shade(hair,-10));
      }
      for(let k=0;k<6;k++){const x=-20+k*8;poly([p(x-1.6,57),p(x+1.6,57),p(x*.58+1.5,37),p(x*.58-1.2,34)],k%2?shade(hair,-8):hi);}
    }else if(h===14){
      fadeSides();poly(topCap(35,60),shade(hair,-3));for(let k=0;k<7;k++){const front=-w+9+k*(w*2-18)/6,crown=front*.58;poly([p(front-3,57),p(front+2,58),p(crown+4,35),p(crown,33)],k%2?hair:hi);poly([p(front-1,53),p(front+2,52),p(crown+2,38)],shade(hair,18));}poly([p(-w+7,58),p(0,63),p(w-7,58),p(w-9,64),p(0,68),p(-w+9,64)],hair);
    }else if(h===15){
      poly(topCap(35,62),hair);fadeSides();for(let k=0;k<6;k++){const x=-w+9+k*(w*2-18)/5;poly([p(x-5,47),p(x,34+(k%2)*2),p(x+8,42),p(x+5,58),p(x,54)],k%2?hair:hi);} 
    }else if(h===16){
      poly(topCap(30,64),hair);for(let k=0;k<8;k++){const x=-w+5+k*(w*2-10)/7;poly([p(x-5,43),p(x+1,29+(k%3)*3),p(x+9,40),p(x+5,67+(k%2)*7),p(x,60)],k%3?hair:hi);} 
    }else if(h===17){
      poly([p(-w+2,61),p(-w+9,39),p(-7,29),p(-1,34),p(7,29),p(w-9,39),p(w-2,61),p(w-9,68),p(4,49),p(0,42),p(-5,49),p(-w+9,68)],hair);poly([p(-w+8,43),p(-9,31),p(-3,37),p(-w+12,59)],hi);poly([p(w-8,43),p(9,31),p(3,37),p(w-12,59)],shade(hair,9));
    }else if(h===19){
      fadeSides();poly([p(-18,58),p(-16,40),p(-12,32),p(-9,29),p(9,29),p(13,32),p(16,40),p(18,58),p(10,64),p(-10,64)],hair);poly([p(-6,32),p(5,31),p(10,36),p(8,51),p(1,55)],hi);poly([p(-12,39),p(-10,33),p(-9,52),p(-14,57)],shade(hair,-10));
    }else if(h===20){
      fadeSides();poly([p(-w+10,58),p(-w+12,31),p(-w+17,25),p(w-17,25),p(w-11,31),p(w-9,58),p(w-13,63),p(-w+13,63)],hair);poly([p(-w+17,25),p(w-17,25),p(w-15,31),p(-w+15,31)],hi);for(let k=0;k<4;k++)poly([p(-18+k*12,32),p(-16+k*12,54),p(-12+k*12,54),p(-13+k*12,31)],shade(hair,8));
    }else if(h===21){
      poly([p(-w+2,61),p(-w+8,39),p(-9,28),p(-2,33),p(-3,49),p(-w+10,70),p(-w+4,72)],hair);poly([p(w-2,61),p(w-8,39),p(9,28),p(2,33),p(3,49),p(w-10,70),p(w-4,72)],hair);poly([p(-w+9,42),p(-10,30),p(-4,35),p(-w+12,59)],hi);poly([p(w-9,42),p(10,30),p(4,35),p(w-12,59)],shade(hair,9));
    }else if(h===22){
      poly(topCap(33,64),hair);for(let k=0;k<18;k++){const x=-w+6+(k%9)*(w*2-12)/8,y=31+Math.floor(k/9)*16+(k%2)*3,r=6+detail()*3;ellipse(cx+x,y,r,r*.9,k%3?hair:hi);}poly([p(-w+5,56),p(-w-2,73),p(-w+4,88),p(-w+10,68)],hair);poly([p(w-5,56),p(w+2,73),p(w-4,88),p(w-10,68)],hair);
    }else if(h===23){
      fadeSides();poly([p(-w+9,59),p(-w+13,43),p(-17,37),p(16,36),p(w-13,43),p(w-9,59),p(w-13,63),p(-w+13,63)],hair);poly([p(-17,39),p(15,38),p(w-15,44),p(-w+15,46)],hi);poly([p(-w+3,67),p(-w+10,61),p(-w+8,79),p(-w+2,84)],shade(skin,-31));poly([p(w-10,61),p(w-3,67),p(w-2,84),p(w-8,79)],shade(skin,-42));
    }
    if(rt.widowPeak&&h!==18){poly([p(-6,top+1),p(0,top+10),p(6,top+1),p(4,top-1),p(-4,top-1)],hair);}
    if(a.headbandStyle){
      const bandColor=[trim,jersey,'#d9e0dc'][a.headbandTone%3];
      if(a.headbandStyle===1){
        poly([p(-w-1,64.5),p(0,62.4),p(w+1,64.5),p(w+.2,69.6),p(0,68.1),p(-w-.2,69.6)],bandColor);
        rect(124.5,64.1,7,3.4,shade(bandColor,-18));
      }else{
        poly([p(-w-1.5,63.2),p(0,60.5),p(w+1.5,63.2),p(w+.5,72.5),p(0,70),p(-w-.5,72.5)],bandColor);
        poly([p(-6,62.2),p(6,62.2),p(5,68.6),p(-5,68.6)],shade(bandColor,-18));
      }
    }
    if(a.earringStyle){
      const metal=a.earringTone?'#d4b76c':'#c9d2d4',rim=shade(metal,-42);
      const drawStud=side=>{const ex=cx+side*(w+f.ear+1),ey=95;ellipse(ex,ey,2.25,2.25,rim);ellipse(ex-.45,ey-.55,1.25,1.25,metal);};
      if(a.earringStyle===1||a.earringStyle===3)drawStud(-1);
      if(a.earringStyle===2||a.earringStyle===3)drawStud(1);
    }
    return out;
  }
  function appearanceSimilarity(a,b) {
    const fa=a.identity||a,fb=b.identity||b;
    const delta=(x,y,span)=>Math.min(1,Math.abs(x-y)/span);
    let distance=0,total=0;
    const add=(d,w)=>{distance+=clamp(d,0,1)*w;total+=w;};
    add(fa.shape===fb.shape?0:.8,5);add(delta(fa.width,fb.width,9),8);add(delta(fa.jaw,fb.jaw,13),7);add(delta(fa.length,fb.length,12),6);add(delta(fa.chin,fb.chin,11),5);
    add(delta(fa.eyes,fb.eyes,6),5);add(delta(fa.eyeSize,fb.eyeSize,2),3);add(delta(fa.nose,fb.nose,4),6);add(delta(fa.mouth,fb.mouth,8),5);add(delta(fa.ear,fb.ear,3),2);
    add(delta((a.skin??fa.skin),(b.skin??fb.skin),9),14);add((a.hair??fa.hair)===(b.hair??fb.hair)?0:1,12);add(delta((a.hairColor??fa.hairColor),(b.hairColor??fb.hairColor),7),4);
    add((a.beard??fa.beard)===(b.beard??fb.beard)?0:.75,4);add(fa.eyeColor===fb.eyeColor?0:.7,2);
    const ra=fa.rareTraits||{},rb=fb.rareTraits||{};const rareKeys=['eyebrowCut','scar','widowPeak','prominentEars','heavyBrows','beautyMark'];add(rareKeys.some(k=>!!ra[k]!==!!rb[k])?.6:0,3);
    return Math.round((1-distance/total)*1000)/10;
  }
  function findSimilarAppearances(items, threshold=86) {
    const pairs=[];
    for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
      const score=appearanceSimilarity(items[i],items[j]);if(score>=threshold)pairs.push(Object.freeze({a:i,b:j,score}));
    }
    pairs.sort((x,y)=>y.score-x.score||x.a-y.a||x.b-y.b);return Object.freeze(pairs);
  }
  const FRAME_PRESETS=Object.freeze({icon:{zoom:1.36,focalY:100},list:{zoom:1.23,focalY:104},card:{zoom:1.08,focalY:110},profile:{zoom:1,focalY:128}});
  function paint(commands, canvas, size=256, ratio=1, frame='profile') {
    const pixels=Math.round(number(size,256,32,1024)*number(ratio,1,1,3));canvas.width=pixels;canvas.height=pixels;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas 2D unavailable');
    const preset=FRAME_PRESETS[frame]||FRAME_PRESETS.profile,base=pixels/256,zoom=preset.zoom;
    ctx.setTransform(base*zoom,0,0,base*zoom,base*(128-128*zoom),base*(preset.focalY-preset.focalY*zoom));
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
    // Preview fallback only. Production/new-game integration should assign portraitSeed explicitly; backward migration is intentionally out of scope for the current project direction.
    const seed=player.portraitSeed??player.id??'portrait-preview';
    return deriveAppearance(deriveIdentity(seed,player.portraitVersion??VERSION),player,school,options);
  }
  function getCacheKey(player,school,options={}){return JSON.stringify([VERSION,prepare(player,school,options),number(options.size,256,32,1024),number(options.pixelRatio,1,1,3),FRAME_PRESETS[options.frame]?options.frame:'profile']);}
  function renderPlayerPortrait(player,school,canvas,options={}){
    const appearance=prepare(player,school,options),key=getCacheKey(player,school,options),hit=cache.get(key);
    if(hit){canvas.width=hit.width;canvas.height=hit.height;canvas.getContext('2d').drawImage(hit,0,0);return appearance;}
    paint(drawingCommands(appearance),canvas,options.size,options.pixelRatio,options.frame);
    if(typeof document!=='undefined'){const copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height;copy.getContext('2d').drawImage(canvas,0,0);cache.set(key,copy);}
    return appearance;
  }
  return {VERSION,VERSION_STATUS,V1_FREEZE_ID,HAIR,BEARDS,SKIN,HAIR_COLORS,RARE_TRAITS,BODY_ARCHETYPES,FRAME_PRESETS,hash,rng,deriveIdentity,deriveAppearance,deriveCareerGrooming,appearanceSimilarity,findSimilarAppearances,drawingCommands,paint,prepare,getCacheKey,renderPlayerPortrait,PortraitCache,cache};
});
