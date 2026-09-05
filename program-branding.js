(() => {
'use strict';

// Dynasty Lab v0.9.43 program color registry.
// Numeric teamId is the only key. This is presentation-only and never mutates save data.
const PROGRAM_COLORS=[null,
['#12355B','#6CB4EE','#F2C14E'],
['#124E5A','#8EDDE7','#23395B'],
['#7A1F2B','#F4DFA5','#264D3B'],
['#1E3A5F','#D9A441','#F4E7C3'],
['#164A41','#F3C64E','#4F9FCF'],
['#2D3540','#4F8CFF','#C97A40'],
['#135B6C','#6CCBD6','#E2C58F'],
['#722F37','#D8B56A','#5E6B75'],
['#7A263A','#F1E5C7','#28344A'],
['#244A8F','#C7D0DA','#D97B29'],
['#5A2D64','#B8D8F0','#D7B05B'],
['#2F5D50','#E5C15A','#4A7A9B'],
['#193B67','#C84B4B','#EAD8B1'],
['#6D2940','#C5CED7','#4C8295'],
['#2C4A73','#B86F45','#E8D4AF'],
['#23262B','#E87832','#9CA9B6'],
['#176B87','#E2B849','#203C5B'],
['#233B66','#5B88C4','#DDE7F0'],
['#0F4C5C','#D4A64A','#78C6B6'],
['#2F5B3A','#C85D3A','#EAD9AE'],
['#343A40','#4169A8','#B7D7E8'],
['#20513E','#5367A6','#E7D8B2'],
['#6B2C3D','#7CAAC4','#CDA85E'],
['#24717A','#D86A5A','#E3C88A'],
['#173A5E','#C54B45','#D3AA52'],
['#6A2638','#5F7FA8','#E5D5B2'],
['#753821','#B4512B','#E7CFA8'],
['#1D4D69','#4B9FC2','#B9C8D1'],
['#315D7D','#5F8E79','#87B7CF'],
['#2F5F8F','#88BDE0','#E8E0C8'],
['#3E6648','#C5A14A','#E9DFC4'],
['#22303A','#2F8A7C','#DDBD7E'],
['#7A253B','#CDA647','#EADDB9'],
['#1B3B5D','#50A6A5','#B8734B'],
['#2D3D3A','#6F8C5B','#D18A46'],
['#513B67','#647FA3','#D2B15F'],
['#8B2432','#B8C0C8','#20242A'],
['#1F4463','#E99B6B','#6DB7A8'],
['#244E9B','#E97A2B','#E8EEF5'],
['#0F625F','#A8CF45','#27343A'],
['#145B78','#EF8A3A','#E6C77D'],
['#7E2333','#F0E3C5','#32353A'],
['#203E60','#C64F4B','#5AA2B8'],
['#8D4A24','#E58A45','#F1DFC0'],
['#2F3338','#C9783B','#61789A'],
['#6C2837','#7FADD0','#E6D7B3'],
['#2E5442','#E5E0CC','#7A3C4B'],
['#315C9B','#B7C3D0','#242931'],
['#5A2D72','#D5AD45','#E8D9B8'],
['#25282D','#B89A58','#4A8D8C'],
['#843226','#C95C42','#D2A94D'],
['#176978','#D86E34','#34424A'],
['#183D63','#C74444','#B5C4CF'],
['#28533F','#C96D32','#E8D8B6'],
['#345E7A','#6E8B5A','#D2B46A'],
['#33523B','#7D8080','#C88C35'],
['#493D7A','#547DD8','#BEC8D6'],
['#7C342D','#B95A42','#D1B376'],
['#1D6766','#D8755C','#E7D7B3'],
['#35495B','#C6A453','#6D8B72'],
['#253E63','#D6A83B','#E3E7EA'],
['#7D3440','#697A89','#C5A05B'],
['#2B5C9B','#B63C45','#D7BD72'],
['#2A2E32','#C29A45','#7196B4'],
['#8B2931','#D85A5E','#E8DCC2'],
['#243E67','#AEBBC7','#B86D43'],
['#272B30','#D3A839','#E6CF77'],
['#702F3D','#6B95B8','#D6BC7A'],
['#2E5C45','#C8A64B','#343B3C'],
['#7E2E33','#B55C58','#E0D0B0'],
['#3D664E','#BFA04D','#E8DEC4'],
['#2C4665','#B76038','#D6BD7A'],
['#1B3F6B','#C74445','#E7D7B7'],
['#272B31','#D64B45','#AEB7C1'],
['#513C73','#B7BDC7','#B77A45'],
['#762F42','#388A8A','#C5A255'],
['#843F27','#C8754C','#D9BD83'],
['#1F6460','#B94A42','#E2D1AC'],
['#7D2D36','#B85958','#E2D6BE'],
['#843E27','#A45C3E','#D2B067'],
['#267078','#C75F3D','#D9C08A'],
['#7E4A38','#B56C53','#3A8D87'],
['#7C2A37','#C9A04E','#263C59'],
['#5C3E72','#C5723D','#D4B77A'],
['#6E3140','#C8A24B','#51727B'],
['#274A6B','#6FA7C9','#C7955B'],
['#8A3436','#C66E67','#D7E0E6'],
['#253C63','#C6A246','#AEBBC8'],
['#285C9A','#D86F2F','#DCE6EE'],
['#82452F','#B56C50','#E2D3B4'],
['#355A9B','#7DB2D7','#C6A550'],
['#654536','#C9A248','#E4D4B7'],
['#293F65','#AEB8C4','#657C70'],
['#27282B','#B94F8A','#C6A04A'],
['#2E5A43','#A7B4B8','#4B7590'],
['#344047','#4B7891','#C5A159'],
['#8D2F3E','#D1A842','#E7D6B3'],
['#2A2B30','#456ED6','#CDA94F'],
['#1D6A83','#D0A94A','#BECBD3'],
['#1E6566','#D87232','#DFD4B8'],
['#3B634D','#C5A24C','#5F84A0'],
['#7E3340','#C7AA72','#30465D'],
['#2D5B3E','#D0BB47','#30383A'],
['#234A67','#568B70','#D7E2E5'],
['#543F73','#C9A449','#B5BDC6'],
['#1F4866','#4F9F9D','#B6C2C9'],
['#2F6A52','#A74A3F','#D3AD55'],
['#273A54','#82B6CA','#72A878'],
['#243B64','#C8A44A','#A34D45'],
['#272A2F','#D2A63B','#8F9DA7'],
['#51386D','#8E6BAE','#AAB6C2'],
['#8B2B32','#C34D4D','#B1BBC4'],
['#7B2835','#B84D58','#C39B45'],
['#253F62','#D1A845','#4E76B8'],
['#2D5E9E','#BBC4CD','#34383D'],
['#8B2B32','#B8C0C8','#3A3F45'],
['#315F9B','#B84343','#D8E4EB'],
['#292C31','#C96C34','#98A5AE'],
['#743244','#C5A052','#E6D8BB'],
['#233F68','#C84A4A','#A8CBD7']
];
const FALLBACK=['#234875','#73A8FF','#D6B45E'];

function hexToRgb(hex){
 const value=String(hex||'').replace('#','');
 if(!/^[0-9a-f]{6}$/i.test(value))return '115,168,255';
 return `${parseInt(value.slice(0,2),16)},${parseInt(value.slice(2,4),16)},${parseInt(value.slice(4,6),16)}`;
}
function brandFor(teamId){
 const id=Number(teamId),colors=Number.isInteger(id)&&id>=1&&id<=120?PROGRAM_COLORS[id]:FALLBACK;
 return {teamId:Number.isInteger(id)&&id>=1&&id<=120?id:0,primary:colors[0],secondary:colors[1],accent:colors[2],primaryRgb:hexToRgb(colors[0]),secondaryRgb:hexToRgb(colors[1]),accentRgb:hexToRgb(colors[2])};
}
function setVars(el,teamId,prefix='program'){
 if(!el)return null;
 const brand=brandFor(teamId);
 el.style.setProperty(`--${prefix}-primary`,brand.primary);
 el.style.setProperty(`--${prefix}-secondary`,brand.secondary);
 el.style.setProperty(`--${prefix}-accent`,brand.accent);
 el.style.setProperty(`--${prefix}-primary-rgb`,brand.primaryRgb);
 el.style.setProperty(`--${prefix}-secondary-rgb`,brand.secondaryRgb);
 el.style.setProperty(`--${prefix}-accent-rgb`,brand.accentRgb);
 if(brand.teamId)el.dataset.brandTeamId=String(brand.teamId);
 return brand;
}
function applyRoot(teamId){
 const root=document.documentElement,brand=setVars(root,teamId,'team');
 root.dataset.teamBrandId=String(brand?.teamId||0);
 return brand;
}

window.DynastyProgramBranding=Object.freeze({teamCount:120,colors:PROGRAM_COLORS,brandFor,applyVars:(el,id)=>setVars(el,id,'program'),applyRoot,hexToRgb});
})();
