/* V44 — Mobile Hero Premium Feedback */
(function(){
  'use strict';
  const mobile=!!(navigator.maxTouchPoints>0||(window.matchMedia&&matchMedia('(pointer:coarse)').matches)||Math.min(innerWidth,innerHeight)<=900);
  if(!mobile){window.MobileV44={version:'44.0',mobile:false};return;}
  document.documentElement.classList.add('mobile-v44');
  const $=id=>document.getElementById(id);
  const targetIcons={first:'🎯',last:'⬇️',strong:'💥',close:'⚔️'};
  let lastTower=null,lastShot=0;

  function ensurePremium(){
    const p=$('towerPanel'); if(!p||$('v44HeroStatus')) return;
    const s=document.createElement('div'); s.id='v44HeroStatus';
    s.innerHTML='<span class="v44-live-dot"></span><span id="v44HeroStatusText">HÉROE SELECCIONADO</span><span class="v44-target-chip" id="v44TargetChip">🎯 PRIMERO</span>';
    p.insertBefore(s,p.querySelector('.panel-stats')||p.firstChild);
  }
  function setPulse(){
    const p=$('towerPanel'); if(!p)return;
    p.classList.remove('v44-hit'); void p.offsetWidth; p.classList.add('v44-hit');
    const card=$('v43HeroCard'); if(card){card.classList.remove('v44-card-pulse');void card.offsetWidth;card.classList.add('v44-card-pulse');}
  }
  function refresh(){
    ensurePremium();
    const t=window.GameState&&GameState.selectedPlacedTower;
    const p=$('towerPanel');
    if(!p||!t){p&&p.classList.remove('v44-active');return;}
    p.classList.add('v44-active');
    const mode=t.mode||'first', chip=$('v44TargetChip');
    if(chip){
      const labels=window.TARGET_LABELS||{first:'PRIMERO',last:'ÚLTIMO',strong:'MÁS FUERTE',close:'MÁS CERCANO'};
      chip.textContent=(targetIcons[mode]||'🎯')+' '+(labels[mode]||'PRIMERO');
    }
    const status=$('v44HeroStatusText'); if(status)status.textContent='HÉROE NIVEL '+(t.level||1)+' · ACTIVO';
    if(lastTower!==t){lastTower=t;lastShot=t.lastShot||0;setTimeout(()=>{if(window.ringFx)try{ringFx(t.x,t.y,0x7fe3ff,32,360)}catch(_){}},30);}
    if((t.lastShot||0)>lastShot){lastShot=t.lastShot||0;setPulse();}
  }
  function touchFeedback(){
    const panel=$('towerPanel'); if(!panel||panel.style.display==='none')return;
    panel.classList.add('v44-touch');setTimeout(()=>panel.classList.remove('v44-touch'),180);
  }
  function boot(){
    ensurePremium();
    setInterval(refresh,180);
    document.addEventListener('pointerup',e=>{
      if(e.pointerType==='touch' && e.target.closest('#gameHost')) setTimeout(refresh,45);
      if(e.pointerType==='touch' && e.target.closest('#towerPanel')) touchFeedback();
    },{passive:true});
    window.addEventListener('resize',refresh,{passive:true});
    refresh();
    window.MobileV44={version:'44.0',mobile:true,premiumHeroFeedback:true,stableCamera:true,attackFeedback:true};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
