(function(){
  'use strict';

  // Title trophy turntable: 192 pre-rendered frames in a 12x16 sheet (polish.css). Each animation frame
  // shows the current frame and fades the next one in over it, so the turn is continuous, not stepped.
  const turn=document.querySelector('.title-trophy .trophy-turn');
  const layers=turn?turn.querySelectorAll('.trophy-frame'):[];
  if(!turn||layers.length<2||turn.dataset.turntable==='1')return;
  turn.dataset.turntable='1';

  const FRAMES=192,COLS=12,ROWS=16,PERIOD_MS=30000;
  const [base,next]=layers;
  const reduced=()=>document.body.classList.contains('motion-reduced')||!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const place=(el,i)=>{el.style.backgroundPosition=`${(i%COLS)/(COLS-1)*100}% ${Math.floor(i/COLS)/(ROWS-1)*100}%`};

  let shown=-1,elapsed=0,last=null;
  function show(position){
    const i=Math.floor(position)%FRAMES;
    if(i!==shown){place(base,i);place(next,(i+1)%FRAMES);shown=i}
    next.style.opacity=(position-Math.floor(position)).toFixed(3);
  }
  function tick(now){
    requestAnimationFrame(tick);
    // Off screen: hold the current angle. Reduced motion: hold the front view.
    if(!turn.offsetParent||reduced()){last=null;if(reduced())show(0);return}
    if(last!==null)elapsed=(elapsed+Math.min(now-last,100))%PERIOD_MS;
    last=now;
    show(elapsed/PERIOD_MS*FRAMES);
  }
  show(0);
  requestAnimationFrame(tick);
})();
