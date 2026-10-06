/* V43 — Mobile Hero Selection UX */
(function(){
'use strict';
const mobile=!!(navigator.maxTouchPoints>0||(window.matchMedia&&matchMedia('(pointer:coarse)').matches)||Math.min(innerWidth,innerHeight)<=900);
if(!mobile){window.MobileV43={version:'43.0',mobile:false};return;}
document.documentElement.classList.add('mobile-v43');
const roles={basic:{role:'ARQUERO',desc:'Ataque rápido a distancia',badge:'🏹'},slow:{role:'MAGO',desc:'Daño mágico y control',badge:'🔮'},area:{role:'SIEGE',desc:'Daño de área pesado',badge:'⚒'}};
function panel(){return document.getElementById('towerPanel');}
function ensureCard(){const p=panel();if(!p||document.getElementById('v43HeroCard'))return;const c=document.createElement('div');c.id='v43HeroCard';c.innerHTML='<div class="v43-hero-icon" id="v43HeroIcon">🏹</div><div class="v43-hero-main"><div class="v43-kicker">HÉROE DEFENSIVO</div><strong id="v43HeroRole">ARQUERO</strong><small id="v43HeroDesc">Ataque rápido a distancia</small></div><div class="v43-level" id="v43HeroLevel">NIV 1</div>';p.insertBefore(c,p.firstChild);}
let obs=null,busy=false;
function setText(id,v){const n=document.getElementById(id);if(n&&n.textContent!==v)n.textContent=v;}
function refresh(){
  if(busy)return;
  const p=panel(),t=window.GameState&&GameState.selectedPlacedTower;if(!p||!t)return;
  busy=true;
  try{
    ensureCard();
    const d=roles[t.type]||roles.basic;
    // Solo se escribe si el valor cambia: así el observer no se re-dispara a sí mismo (antes congelaba la página al seleccionar una torre).
    setText('v43HeroIcon',d.badge);setText('v43HeroRole',d.role);setText('v43HeroDesc',d.desc);setText('v43HeroLevel','NIV '+t.level);
    if(!p.classList.contains('v43-ready'))p.classList.add('v43-ready');
  }finally{
    if(obs)obs.takeRecords(); // descarta los cambios provocados por este mismo refresco
    busy=false;
  }
}
function boot(){ensureCard();const p=panel();if(p){obs=new MutationObserver(refresh);obs.observe(p,{attributes:true,childList:true,subtree:true});}document.addEventListener('click',e=>{if(e.target.closest('.tower-btn'))setTimeout(refresh,40);},{passive:true});window.addEventListener('touchstart',()=>setTimeout(refresh,40),{passive:true});window.addEventListener('resize',refresh,{passive:true});refresh();window.MobileV43={version:'43.0',mobile:true,heroSelection:true,stableCamera:true};}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
