/* V42 — Mobile HUD / Contextual Controls.
 * Mejora la ergonomía de V40/V41 sin cambiar la lógica de combate.
 */
(function(){
  'use strict';
  const mobile=!!(navigator.maxTouchPoints>0 || (window.matchMedia&&matchMedia('(pointer:coarse)').matches) || Math.min(innerWidth,innerHeight)<=900);
  if(!mobile){window.MobileV42={version:'42.0',mobile:false};return;}
  document.documentElement.classList.add('mobile-v42');

  function addContextBar(){
    const host=document.getElementById('gameHost');
    if(!host || document.getElementById('v42Context')) return;
    const bar=document.createElement('div');
    bar.id='v42Context';
    bar.innerHTML='<span class="v42-dot"></span><b>MAPA</b><small>Arrastra para explorar · pellizca para acercar</small>';
    host.appendChild(bar);
    const hide=()=>bar.classList.add('hide');
    host.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')hide();},{passive:true,once:true});
    setTimeout(hide,5200);
  }

  function watchTowerPanel(){
    const panel=document.getElementById('towerPanel');
    if(!panel)return;
    const update=()=>{
      const visible=getComputedStyle(panel).display!=='none' && panel.offsetHeight>0;
      document.documentElement.classList.toggle('v42-tower-selected',visible);
    };
    new MutationObserver(update).observe(panel,{attributes:true,attributeFilter:['style','class']});
    window.addEventListener('resize',update,{passive:true});
    update();
  }

  function improveCameraControls(){
    ['rotL','rotR'].forEach(id=>{
      const b=document.getElementById(id); if(b)b.setAttribute('aria-hidden','true');
    });
    const reset=document.getElementById('camReset');
    if(reset)reset.title='Centrar mapa';
  }

  function haptics(){
    document.addEventListener('pointerdown',e=>{
      if(e.pointerType!=='touch')return;
      const b=e.target.closest('button');
      if(!b)return;
      try{if(navigator.vibrate)navigator.vibrate(b.classList.contains('upgrade')?[8,18,8]:5)}catch(_){ }
    },{passive:true});
  }

  function boot(){
    addContextBar();
    watchTowerPanel();
    improveCameraControls();
    haptics();
    window.MobileV42={version:'42.0',mobile:true,contextualHud:true,compactCamera:true,haptics:true};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
