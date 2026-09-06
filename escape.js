// Shared HTML escaping helper. Keep this tiny and load it before app.js so
// presentation helpers inside the app IIFE can safely use `esc(...)`.
(function(root,factory){
  const escapeHtml=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=escapeHtml;
  root.DynastyEscape=escapeHtml;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  return x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
});
var esc=(typeof globalThis!=='undefined'&&globalThis.DynastyEscape)||function(x){return String(x??'')};
