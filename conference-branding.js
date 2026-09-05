(() => {
'use strict';

// Dynasty Lab v0.9.44 conference identity registry. Presentation-only: these
// values never enter universe state or save data.
const CONFERENCES=Object.freeze({
 'Great Lakes':{short:'GL',primary:'#123A5A',secondary:'#72C7E8',accent:'#E6B94A',tagline:'IRON & WATER'},
 'Northeast':{short:'NE',primary:'#58243A',secondary:'#E5B85B',accent:'#A9C9E8',tagline:'TRADITION IN MOTION'},
 'Atlantic':{short:'ATL',primary:'#164E62',secondary:'#69C7C2',accent:'#E5D39A',tagline:'COAST TO CROWN'},
 'Southeastern':{short:'SE',primary:'#6F2638',secondary:'#E3B34C',accent:'#F0E4C5',tagline:'SATURDAYS RUN DEEP'},
 'Gulf':{short:'GULF',primary:'#17605E',secondary:'#E0793E',accent:'#E9C873',tagline:'BUILT IN THE HEAT'},
 'Heartland':{short:'HRT',primary:'#3D512F',secondary:'#D6B24C',accent:'#B9CDD7',tagline:'FOOTBALL AT THE CENTER'},
 'Southwest':{short:'SW',primary:'#7A3429',secondary:'#E29048',accent:'#5CB7C0',tagline:'BIG SKY. BIGGER STAKES.'},
 'Mountain':{short:'MTN',primary:'#303F66',secondary:'#92B8D9',accent:'#D4B45D',tagline:'EARN THE SUMMIT'},
 'Pacific':{short:'PAC',primary:'#244E70',secondary:'#62B9A7',accent:'#E6B85A',tagline:'FROM COAST TO KICKOFF'},
 'Metro':{short:'MET',primary:'#272B34',secondary:'#E05A55',accent:'#83B9DA',tagline:'THE GAME NEVER SLEEPS'}
});
const FALLBACK={short:'DL',primary:'#234875',secondary:'#73A8FF',accent:'#D6B45E',tagline:'DYNASTY LAB FOOTBALL'};

function identity(name){return CONFERENCES[String(name||'').trim()]||FALLBACK}
function hexToRgb(hex){
 const value=String(hex||'').replace('#','');
 if(!/^[0-9a-f]{6}$/i.test(value))return '115,168,255';
 return `${parseInt(value.slice(0,2),16)},${parseInt(value.slice(2,4),16)},${parseInt(value.slice(4,6),16)}`;
}
function applyVars(el,name){
 if(!el)return null;
 const brand=identity(name);
 el.style.setProperty('--conf-primary',brand.primary);
 el.style.setProperty('--conf-secondary',brand.secondary);
 el.style.setProperty('--conf-accent',brand.accent);
 el.style.setProperty('--conf-primary-rgb',hexToRgb(brand.primary));
 el.style.setProperty('--conf-secondary-rgb',hexToRgb(brand.secondary));
 el.style.setProperty('--conf-accent-rgb',hexToRgb(brand.accent));
 el.dataset.conferenceBrand=String(name||'');
 return brand;
}
function badgeHTML(name,size='md',extraClass=''){
 const conference=String(name||'Conference').trim(),brand=identity(conference);
 return `<span class="conference-crest conference-crest--${size}${extraClass?' '+extraClass:''}" data-conference="${conference.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}" role="img" aria-label="${conference.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))} Conference"><span aria-hidden="true">${brand.short}</span></span>`;
}

window.DynastyConferenceBranding=Object.freeze({names:Object.keys(CONFERENCES),conferences:CONFERENCES,identity,applyVars,badgeHTML});
})();
