// v0.23 — the award and facility sprites from the November 11 art pack (release dynasty-assets-2026-11-11). Each is
// a 256px transparent WebP rendered from a Meshy model; the models themselves stay in the release as source files.
// The November 12 pack (docs/art-pack-2026-11-12.json): eleven screen-header pieces and 23 general props
// adds (medals, football, whistle, trophy cup, envelope, coin...) any screen can show with DynastyArt.img('<name>').
// Everything here is decorative (empty alt): the text next to each image already says what it is.
(function(root){
  'use strict';
  const FILES=['balance-scale','bowl-laurel','chalkboard','coaching-tree','cornerstone','file-cabinet','seedling','championship-ring','endzone-pylon','gold-football-statue','program-key','bronze-medal','campus-gate','clipboard-blank','coach-headset','coach-legacy','coin-toss','conference-crown','contract-pen','envelope-letter','film-reel','first-aid','football','game-ball','goalposts','gold-medal','gold-star','graduation-cap','hard-hat','headset','helmet-plain','history-book','kickoff-tee','locker-room','compass','dumbbell','megaphone','milestone-marker','money-bag','newspaper','pennant','plaque','playbook-clipboard','player-of-year','podium','practice-facility','ribbon-rosette','rivalry-anvil','rivalry-axe','rivalry-barrel','rivalry-bell','rivalry-boot','rivalry-bucket','rivalry-cannon','rivalry-jug','rivalry-lantern','rivalry-shield','rivalry-spade','roster-jersey','scoreboard','scouting-folio','signing-cap','silver-medal','stadium-lights','stadium-miniature','stopwatch','training-cones','transfer-duffel','trophy-cup','wall-calendar','weight-room','whistle'];
  const src=key=>FILES.includes(key)?`assets/awards/${key}.webp`:'';
  const attr=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function img(key,cls='dl-art'){const s=src(key);return s?`<img class="${attr(cls)}" src="${s}" alt="" aria-hidden="true" loading="lazy" decoding="async" width="256" height="256">`:''}
  // Rivalry trophies are named "The <place> <noun>" (TROPHY_NOUNS in app.js); every noun has its own art and anything else gets the shield.
  // Bell, boot and lantern come from the Meshy art pack; the other seven are modelled in Blender by tools/blender/rivalry_trophies.py.
  const RIVALRY_NOUNS=['bell','axe','boot','jug','barrel','anvil','lantern','spade','bucket','cannon'];
  function rivalryKey(trophy){const t=String(trophy||'').toLowerCase();const noun=RIVALRY_NOUNS.find(n=>new RegExp(`\\b${n}\\b`).test(t));return noun?`rivalry-${noun}`:'rivalry-shield'}
  const FACILITY={stadium:'stadium-miniature',training:'weight-room',football_ops:'practice-facility'};
  const MILESTONE={'conf-title':'conference-crown',rival:'rivalry-shield','national-title':'championship-ring',repeat:'gold-football-statue',perfect:'gold-star','ten-wins':'trophy-cup','three-posts':'program-key'};
  const facilityKey=id=>FACILITY[id]||'';
  const milestoneKey=id=>MILESTONE[id]||(/win|season|perfect/.test(String(id))?'game-ball':'coach-legacy');
  // Weekly briefing items: one small prop per kind of story, matched on the item's kicker.
  // Also used by the Season screen's story cards (gameday-season-presentation.js storyCard).
  // hard-hat, compass, dumbbell, milestone-marker, podium, balance-scale, chalkboard, coaching-tree, seedling,
  // cornerstone and file-cabinet are modelled in Blender by tools/blender/props.py.
  const KICKER={INJURY:'first-aid',MEDICAL:'first-aid',RECRUITING:'envelope-letter','TOP TARGET':'envelope-letter',WAVERING:'envelope-letter',COMMITMENT:'envelope-letter',FLIP:'envelope-letter',DECOMMIT:'envelope-letter','OFFER PULLED':'envelope-letter','RECRUITING BATTLE':'envelope-letter','SIGNING DAY':'contract-pen',SIGNED:'contract-pen',TRANSFER:'transfer-duffel',RIVALRY:'pennant','RIVALRY WEEK':'pennant',FINAL:'football',HEADLINE:'newspaper',RANKINGS:'gold-star',BOWL:'bowl-laurel','BOWL WATCH':'bowl-laurel',HONOR:'gold-medal',DRAFT:'helmet-plain',ACADEMICS:'graduation-cap','ACADEMIC WATCH':'graduation-cap','COLLEGE CAREER ENDED':'graduation-cap',ADMINISTRATION:'program-key','SEASON GOALS':'program-key',BOOSTERS:'money-bag','COACHING SEARCH':'headset','COACHING TREE':'coaching-tree',STAFF:'headset',CAREER:'plaque',ROSTER:'clipboard-blank',REDSHIRTS:'clipboard-blank','LOCKER ROOM':'locker-room','PROMISE BROKEN':'locker-room','NEXT UP':'film-reel',SEASON:'scoreboard','FAMILIAR FACE':'ribbon-rosette',MOMENTUM:'megaphone',FACILITIES:'hard-hat',LOST:'compass',CUT:'compass',FLIPPED:'compass',PAYOFF:'dumbbell',MILESTONE:'milestone-marker','RECORD WATCH':'podium','SCHOOL RECORD':'podium','NATIONAL RECORD':'podium','COACH ARRIVAL':'headset','RECRUITING FALLOUT':'envelope-letter','CONFERENCE RACE':'conference-crown',DEVELOPMENT:'dumbbell','ROLE BATTLE':'balance-scale','CAMP ROLE BATTLE':'balance-scale',EMERGING:'seedling',CORNERSTONE:'cornerstone',BREAKOUT:'gold-star',PROMISE:'contract-pen','COACH TREE':'coaching-tree'};
  const kickerKey=k=>KICKER[String(k||'').trim().toUpperCase()]||'';
  // The three offseason stops and the top three statistical leaders.
  const STOP={departures:'graduation-cap',signing:'contract-pen',portal:'transfer-duffel',spring:'transfer-duffel'};
  const stopKey=phase=>STOP[phase]||'';
  const medalKey=rank=>['gold-medal','silver-medal','bronze-medal'][rank]||'';
  root.DynastyArt={FILES,src,img,rivalryKey,facilityKey,milestoneKey,kickerKey,stopKey,medalKey};
})(typeof globalThis!=='undefined'?globalThis:this);
