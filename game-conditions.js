// Game conditions: the stadium and the weather a game is played in (v0.16 play model).
//
// Everything here is derived from the home program and the calendar, never from the gameplay random
// stream: asking for a game's conditions (the forecast on This Week, the Game Day header, the archive)
// always gives the same answer and consumes no draws. A dome removes the weather, altitude lets kicks
// carry, and wind, rain, snow and cold change how the game is played (see effects()).
(function(root,factory){
  const rngApi=(typeof module==='object'&&module.exports)?require('./rng.js'):root.DynastyRng;
  const api=factory(rngApi);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DynastyGameConditions=api;
})(typeof window==='object'?window:globalThis,function(DynastyRng){
'use strict';
if(!DynastyRng)throw new Error('Game conditions require DynastyRng.');

const VERSION=1;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const num=(v,fallback)=>Number.isFinite(Number(v))?Number(v):fallback;

// Weeks after the first Saturday of September. Week 1 is early September; the postseason runs into January.
const weeksIn=week=>clamp(num(week,6)-1,0,19);

function hasDome(home,neutral,rng){
  if(neutral)return rng.next()<.34;                              // many neutral sites are indoor stadiums
  const key=DynastyRng.hashSeed(`dome:${home.id??home.name}`)%100;
  const rich=num(home.facilities,60)>=85,cold=num(home.lat,38)>=40;
  return key<(4+(rich?7:0)+(cold?3:0));                          // about one program in ten plays indoors
}
// A rough mountain-west box; enough for kicking-distance flavor, not a surveyed elevation.
function highAltitude(home){
  const lat=num(home.lat,38),lon=num(home.lon,-90);
  return lat>=34&&lat<=45.5&&lon<=-103&&lon>=-113;
}

function forGame(options={}){
  const home=options.home||{},year=num(options.year,2027),week=num(options.week,6);
  const neutral=!!options.neutral,seed=`conditions:${year}:${week}:${neutral?String(options.gameId??''):String(home.id??home.name??'home')}`;
  const rng=DynastyRng.create(seed);
  const lat=num(home.lat,38),lon=num(home.lon,-90);
  const indoor=hasDome(home,neutral,rng);
  const high=!neutral&&highAltitude(home);
  // Draw everything in a fixed order so a dome or a neutral site never shifts the other numbers.
  const tempNoise=rng.gauss()*6.5,windNoise=Math.abs(rng.gauss())*4.2,precipRoll=rng.next(),intensityRoll=rng.next(),skyRoll=rng.next();
  if(indoor){
    return{version:VERSION,roof:'dome',altitude:'low',temp:72,wind:0,precip:0,sky:'dome',neutral};
  }
  const w=weeksIn(week);
  // Early-September highs fall with latitude, then 2.5 degrees a week into the winter.
  const high0=92-1.05*(clamp(neutral?36:lat,24,49)-26),temp=Math.round(clamp(high0-w*2.5-6+tempNoise,-2,100));
  const plains=lon>=-104&&lon<=-93&&lat>=30&&lat<=47,coast=lon<=-122||lon>=-81&&lat<=36||lat<=30.5;
  let wind=5.5+windNoise+(plains?4:0)+(coast?2:0)+(w>=8?1.5:0);
  const northwest=lat>=42&&lon<=-119,southeast=lon>=-92&&lat<=36,desert=lon<=-103&&lat<=37.5&&lon>=-121;
  let chance=northwest?(w>=4?.30:.12):southeast?(w<=4?.22:.16):desert?.05:.14;
  if(neutral)chance=.12;
  const wet=precipRoll<chance;
  let precip=0,sky='clear';
  if(wet){precip=intensityRoll<.58?1:intensityRoll<.88?2:3;sky=temp<=33?'snow':'rain';wind+=precip>=3?3:0}
  else sky=skyRoll<.34?'cloudy':'clear';
  return{version:VERSION,roof:'open',altitude:high?'high':'low',temp,wind:Math.round(clamp(wind,0,38)),precip,sky,neutral};
}

// Numbers the engine reads. Everything is an adjustment to a rate already in the model; a calm 70 degree
// afternoon at sea level returns all zeros and ones.
function effects(c){
  const cond=c&&typeof c==='object'?c:{};
  const dome=cond.roof==='dome',temp=num(cond.temp,70),wind=dome?0:clamp(num(cond.wind,0),0,45),p=dome?0:clamp(num(cond.precip,0),0,3),high=cond.altitude==='high';
  const gust=Math.max(0,wind-12),cold=temp<30,freezing=temp<20,snow=cond.sky==='snow';
  const fgFlat=p*.008+(cold?.015:0)+gust*.0028-(dome?.01:0);
  return{
    dome,high,wind,precip:p,temp,
    passComp:clamp(-gust*.0028-[0,.009,.021,.036][p]-(cold?.01:0)+(dome?.01:0),-.09,.02)+0,
    passYards:clamp(1-Math.max(0,wind-15)*.005-p*.014-(freezing?.015:0)+(dome?.015:0),.78,1.04),
    rushYards:clamp(1-p*.006+(snow?.01:0),.9,1.02),
    passRate:clamp(-Math.max(0,wind-18)*.003-p*.014,-.08,0)+0,
    fumble:clamp(1+p*.18+(cold?.12:0)+(freezing?.1:0),1,1.8),
    interception:clamp(1+Math.max(0,wind-15)*.012+p*.05,1,1.4),
    fgFlat:clamp(fgFlat,-.01,.14),
    fgPerYard:clamp(Math.max(0,wind-8)*.0002-(high?.0016:0),-.003,.01),
    puntYards:clamp(-Math.max(0,wind-10)*.25-p*.6-(freezing?.8:0)+(high?3.5:0)+(dome?.5:0),-9,5),
    touchback:clamp((high?.1:0)+(dome?.03:0)-p*.02-gust*.003,-.12,.14)
  };
}

function skyLabel(c){
  if(c.roof==='dome')return'Indoors';
  if(c.sky==='snow')return['Flurries','Light snow','Snow','Heavy snow'][c.precip]||'Snow';
  if(c.sky==='rain')return['Drizzle','Light rain','Rain','Heavy rain'][c.precip]||'Rain';
  return c.sky==='cloudy'?'Overcast':'Clear';
}
function severity(c){
  const e=effects(c);
  const score=Math.max(0,e.wind-12)/4+e.precip*1.3+(e.temp<30?1:0)+(e.temp<15?1:0)+(e.temp>96?.7:0);
  return score>=4.2?'harsh':score>=2.4?'rough':score>=1?'mild':'calm';
}
// What the conditions mean for this game, in the words a coach would use. Empty for a calm afternoon.
function notes(c){
  const e=effects(c),out=[];
  if(c.roof==='dome')out.push('Indoors: clean ball, true kicks, no wind');
  if(e.wind>=18)out.push(`Wind ${e.wind} mph: deep passes and field goals suffer`);
  else if(e.wind>=12)out.push(`Wind ${e.wind} mph: long field goals are less certain`);
  if(e.precip>=2)out.push(c.sky==='snow'?'Heavy snow: slick ball, shorter kicks':'Wet field: more fumbles, harder to throw');
  else if(e.precip===1)out.push(c.sky==='snow'?'Snow in the air: grip is a worry':'Light rain: the ball will be slick');
  if(e.temp<=25)out.push(`${e.temp}°F: cold ball, shorter kicks`);
  if(e.temp>=97)out.push(`${e.temp}°F: heat will wear on both lines`);
  if(c.altitude==='high')out.push('Thin air: kicks and punts carry farther');
  return out;
}
function describe(c){
  if(!c||typeof c!=='object')return{headline:'',short:'',notes:[],severity:'calm'};
  const parts=[skyLabel(c)];
  if(c.roof!=='dome'){parts.push(`${num(c.temp,70)}°F`);if(num(c.wind,0)>=10)parts.push(`Wind ${Math.round(c.wind)} mph`)}
  if(c.altitude==='high')parts.push('High altitude');
  const sev=severity(c);
  return{headline:parts.join(' · '),short:c.roof==='dome'?'Indoors':`${skyLabel(c)}, ${num(c.temp,70)}°F`,notes:notes(c),severity:sev};
}
function sanitize(value){
  if(!value||typeof value!=='object')return null;
  const sky=['clear','cloudy','rain','snow','dome'].includes(value.sky)?value.sky:'clear',roof=value.roof==='dome'||sky==='dome'?'dome':'open';
  return{
    version:VERSION,roof,altitude:value.altitude==='high'?'high':'low',
    temp:Math.round(clamp(num(value.temp,70),-20,115)),wind:Math.round(clamp(num(value.wind,0),0,45)),
    precip:Math.round(clamp(num(value.precip,0),0,3)),sky:roof==='dome'?'dome':sky,neutral:!!value.neutral
  };
}

return{VERSION,forGame,effects,describe,notes,severity,sanitize};
});
