/* V40 — Optimización Android / Mobile Performance.
 * Mantiene la calidad visual, pero adapta carga gráfica, efectos y animaciones
 * a teléfonos para priorizar estabilidad, batería y memoria.
 */
(function(){
  'use strict';
  const mobile=!!(navigator.maxTouchPoints>0 || (window.matchMedia&&matchMedia('(pointer:coarse)').matches) || Math.min(innerWidth,innerHeight)<600);
  if(!mobile){window.MobileV40={version:'40.0',mobile:false};return;}
  document.documentElement.classList.add('mobile-v40');

  const applyRuntimeBudget=()=>{
    if(!window.S)return;
    S.perf=S.perf||{};
    S.perf.mode='mobile';
    S.perf.interval=220;
    S.perf.enemyNear=320;
    S.perf.enemyFar=620;
    S.perf.treeNear=360;
    S.perf.treeFar=680;
    S.perf.fxNear=650;
    S.fxCap=150;
    S.mobileFrameBudget=18.5;
  };

  function addPerfBadge(){
    const host=document.getElementById('gameHost');
    if(!host||document.getElementById('v40PerfBadge'))return;
    const b=document.createElement('div');
    b.id='v40PerfBadge';
    b.textContent='MODO MÓVIL';
    b.style.cssText='position:absolute;right:8px;bottom:8px;z-index:5;padding:4px 7px;border-radius:7px;font:600 9px system-ui;letter-spacing:.4px;opacity:.55;pointer-events:none;display:none';
    host.appendChild(b);
  }

  applyRuntimeBudget();
  addPerfBadge();
  window.MobileV40={version:'40.0',mobile:true,adaptiveResolution:true,lightweightShadows:true,fxBudget:150,autoPause:true};
})();
