// v0.10 lifecycle fix: avoid a temporal-dead-zone read while rendering the active coaching tenure.
careerHistoryHTML=function careerHistoryHTMLFixed(){
 const rows=(universe.careerHistory||[]).slice().reverse().map(x=>
  `<div class="lineitem"><span>${x.startYear}–${x.endYear} · ${x.school}</span><strong>${x.w}-${x.l} · ${x.reason}</strong></div>`).join('');
 const tenure=universe.tenure&&!universe.tenure.closed?universe.tenure:null;
 const current=tenure?(()=>{const r=tenureRecord();
  return `<div class="lineitem"><span>${tenure.startYear}–present · ${tenure.school}</span><strong>${r.w}-${r.l} · current</strong></div>`})():'';
 return (current+rows)||'<div class="muted">No completed seasons yet.</div>';
};
