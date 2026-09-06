// Deterministic gameplay RNG. Commit 1 exposes and pins the contract without
// switching gameplay callers; later commits can migrate one domain at a time.
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DynastyRng=api;
})(typeof window==='object'?window:globalThis,function(){
  'use strict';
  const VERSION=1,STEP=0x6d2b79f5;

  function hashSeed(value){
    const text=String(value??'dynasty-lab');let h=2166136261;
    for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}
    return(h>>>0)||STEP;
  }
  function word(value,label){
    if(!Number.isInteger(value)||value<0||value>0xffffffff)throw new Error(`Invalid RNG ${label}.`);
    return value>>>0;
  }
  function create(input='dynasty-lab'){
    let seed,state,draws;
    if(input&&typeof input==='object'){
      if(input.version!==VERSION)throw new Error('This RNG state needs a newer game version.');
      seed=word(input.seed,'seed')||STEP;state=word(input.state,'state')||STEP;draws=Number(input.draws);
      if(!Number.isSafeInteger(draws)||draws<0)throw new Error('Invalid RNG draw counter.');
    }else{seed=hashSeed(input);state=seed;draws=0}

    // Mulberry32. Once callers use this sequence, changes require a versioned migration.
    function next(){
      state=(state+STEP)>>>0;let z=state;
      z=Math.imul(z^(z>>>15),z|1);z^=z+Math.imul(z^(z>>>7),z|61);draws++;
      return((z^(z>>>14))>>>0)/4294967296;
    }
    function float(min=0,max=1){
      if(!Number.isFinite(min)||!Number.isFinite(max)||max<min)throw new Error('Invalid RNG range.');
      return min+next()*(max-min);
    }
    function int(min,max){
      if(!Number.isSafeInteger(min)||!Number.isSafeInteger(max)||max<min)throw new Error('Invalid RNG integer range.');
      return Math.floor(float(min,max+1));
    }
    function pick(values){
      if(!Array.isArray(values)||!values.length)throw new Error('Cannot pick from an empty list.');
      return values[int(0,values.length-1)];
    }
    function gauss(){let u=next(),v=next();if(u===0)u=Number.MIN_VALUE;return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
    function snapshot(){return{version:VERSION,seed,state,draws}}
    function substream(name){if(name===undefined||name===null||name==='')throw new Error('RNG substreams need a name.');return create(`${seed}:${name}`)}
    return{next,float,int,pick,gauss,snapshot,substream};
  }
  return{VERSION,create,hashSeed};
});
