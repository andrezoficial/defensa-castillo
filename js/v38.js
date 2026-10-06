/* V38 — Mobile First / Play Store foundation.
 * Ajusta controles, rendimiento, pausa al salir y feedback táctil sin alterar la lógica de combate.
 */
(function(){
  'use strict';
  const coarse=!!(window.matchMedia&&matchMedia('(pointer:coarse)').matches)||navigator.maxTouchPoints>0;
  const small=Math.min(innerWidth,innerHeight)<=900;
  const mobile=coarse||small;
  if(!mobile){ window.MobileV38={version:'38.0',mobile:false}; return; }

  document.documentElement.classList.add('mobile-v38');
  if(window.S){
    const S=window.S;
    S.lowPower=true;
    S.mobileCam=true;
    S.mobileCamMul=Math.min(S.mobileCamMul||.72,.72);
    // Resolución contenida: menos calor/batería sin hacer el juego borroso.
    S.prMax=Math.min(window.devicePixelRatio||1,1.35);
    S.prMin=.7;
    S.pr=Math.min(S.pr||S.prMax,S.prMax);
  }

  function vibrate(pattern){
    try{ if(navigator.vibrate) navigator.vibrate(pattern); }catch(_){ }
  }
  window.MobileV38={version:'38.0',mobile:true,haptics:!!navigator.vibrate};
  window.MobileV38.tap=function(){vibrate(8)};
  window.MobileV38.strongTap=function(){vibrate([10,25,10])};

  // La pausa al pasar a segundo plano ya la gestiona ui.js (visibilitychange).

  function boot(){
    document.querySelectorAll('button').forEach(function(b){
      if(b.dataset.v38Touch)return;
      b.dataset.v38Touch='1';
      b.addEventListener('pointerdown',function(e){
        if(e.pointerType==='touch') vibrate(6);
      },{passive:true});
    });
    // Reaplica feedback a botones creados dinámicamente (habilidades/paneles).
    const mo=new MutationObserver(function(){
      document.querySelectorAll('button:not([data-v38-touch])').forEach(function(b){
        b.dataset.v38Touch='1';
        b.addEventListener('pointerdown',function(e){if(e.pointerType==='touch')vibrate(6)},{passive:true});
      });
    });
    mo.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
