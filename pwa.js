// v0.22 — installable, offline web build. On the web (http or https, never the desktop app or a file opened from
// disk) this registers the service worker that keeps the game and its art available without a connection. The game
// itself makes no network requests, so once it is cached it plays offline; saves were always on the device.
(function(){
  'use strict';
  if(typeof navigator==='undefined'||!('serviceWorker' in navigator))return;
  if(!/^https?:$/.test(location.protocol)||globalThis.DynastyDesktopShell?.isDesktop)return;
  window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(()=>{})});
})();
