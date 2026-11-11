// v0.23 — the award and facility sprites from the November 11 art pack (release dynasty-assets-2026-11-11). Each is
// a 256px transparent WebP rendered from a Meshy model; the models themselves stay in the release as source files.
// Everything here is decorative (empty alt): the text next to each image already says what it is.
(function(root){
  'use strict';
  const FILES=['bowl-laurel','coach-headset','coach-legacy','conference-crown','game-ball','locker-room','player-of-year','practice-facility','rivalry-bell','rivalry-boot','rivalry-lantern','rivalry-shield','scouting-folio','signing-cap','stadium-miniature','weight-room'];
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
