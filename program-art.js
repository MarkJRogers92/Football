// v0.23 — the award and facility sprites from the November 11 art pack (release dynasty-assets-2026-11-11). Each is
// a 256px transparent WebP rendered from a Meshy model; the models themselves stay in the release as source files.
// The November 12 pack (docs/art-pack-2026-11-12.json): eleven screen-header pieces and 23 general props
// adds (medals, football, whistle, trophy cup, envelope, coin...) any screen can show with DynastyArt.img('<name>').
// Everything here is decorative (empty alt): the text next to each image already says what it is.
(function(root){
  'use strict';
  const FILES=['bowl-laurel','bronze-medal','campus-gate','clipboard-blank','coach-headset','coach-legacy','coin-toss','conference-crown','contract-pen','envelope-letter','film-reel','first-aid','football','game-ball','goalposts','gold-medal','gold-star','graduation-cap','headset','helmet-plain','history-book','kickoff-tee','locker-room','megaphone','money-bag','newspaper','pennant','plaque','playbook-clipboard','player-of-year','practice-facility','ribbon-rosette','rivalry-bell','rivalry-boot','rivalry-lantern','rivalry-shield','roster-jersey','scoreboard','scouting-folio','signing-cap','silver-medal','stadium-lights','stadium-miniature','stopwatch','training-cones','transfer-duffel','trophy-cup','wall-calendar','weight-room','whistle'];
  const src=key=>FILES.includes(key)?`assets/awards/${key}.webp`:'';
  const attr=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function img(key,cls='dl-art'){const s=src(key);return s?`<img class="${attr(cls)}" src="${s}" alt="" aria-hidden="true" loading="lazy" decoding="async" width="256" height="256">`:''}
  // Rivalry trophies are named "The <place> <noun>"; four nouns have their own art and the rest share the shield.
  function rivalryKey(trophy){const t=String(trophy||'').toLowerCase();return/\bbell\b/.test(t)?'rivalry-bell':/\bboot\b/.test(t)?'rivalry-boot':/\blantern\b/.test(t)?'rivalry-lantern':'rivalry-shield'}
  const FACILITY={stadium:'stadium-miniature',training:'weight-room',football_ops:'practice-facility'};
  const MILESTONE={'conf-title':'conference-crown',rival:'rivalry-shield','national-title':'player-of-year',repeat:'player-of-year'};
  const facilityKey=id=>FACILITY[id]||'';
  const milestoneKey=id=>MILESTONE[id]||(/win|season|perfect/.test(String(id))?'game-ball':'coach-legacy');
  root.DynastyArt={FILES,src,img,rivalryKey,facilityKey,milestoneKey};
})(typeof globalThis!=='undefined'?globalThis:this);
