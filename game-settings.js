// Per-dynasty game settings. Every default is the neutral value, so a dynasty that never opens this
// card (and every save made before it existed) plays exactly as before. Stored as universe.settings.
function gameSettings(){
 const out={};for(const key of Object.keys(GAME_SETTING_DEFS))out[key]=gameSetting(key);return out;
}
function setGameSetting(key,value){
 const def=GAME_SETTING_DEFS[key];if(!def||!universe)return false;
 const n=Number(value);if(!Number.isFinite(n))return false;
 universe.settings={...(universe.settings||{}),[key]:clamp(n,def.min,def.max)};
 autosaveAfter('guidance');return true;
}
function gameSettingLabel(key){
 const def=GAME_SETTING_DEFS[key],value=gameSettings()[key];
 return def.options.find(([v])=>v===value)?.[1]||'Custom';
}
function renderGameSettings(){
 const host=$('#gameSettings');if(!host||!universe)return;
 const current=gameSettings();
 host.innerHTML=`<div class="section-head"><div><div class="eyebrow">GAME SETTINGS</div><h3>How hard should this dynasty be?</h3><div class="muted">Saved with this dynasty. Standard is the balance the game was tuned on.</div></div></div><div class="game-settings-grid">${Object.entries(GAME_SETTING_DEFS).map(([key,def])=>`<label class="game-setting"><span>${def.label}</span><select data-game-setting="${key}">${def.options.map(([v,l])=>`<option value="${v}" ${v===current[key]?'selected':''}>${l}</option>`).join('')}</select><small class="muted">${def.note}</small></label>`).join('')}</div>`;
 host.querySelectorAll('[data-game-setting]').forEach(select=>select.addEventListener('change',()=>{setGameSetting(select.dataset.gameSetting,select.value);setStatus?.('Game settings updated.')}));
}
// renderProgram is registered directly in TAB_RENDERERS rather than through runRender, so wrap it.
const renderProgramBase=TAB_RENDERERS.program;
TAB_RENDERERS.program=()=>{renderProgramBase();renderGameSettings()};

