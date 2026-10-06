/* V37 — Habilidades especiales de héroes/torres.
 * Añade una habilidad propia a cada clase sin sustituir las habilidades globales V4.
 * Ligero para móvil: reutiliza FX existentes y guarda cooldown por torre.
 */
(function(){
  'use strict';
  const defs = {
    basic:{name:'Lluvia de Flechas',icon:'🏹',cd:18000,color:0xffd36b,desc:'Dispara una lluvia sobre los enemigos cercanos.',range:105},
    slow:{name:'Tormenta Arcana',icon:'🔮',cd:22000,color:0xb99cff,desc:'Impacto mágico en área que ralentiza a los enemigos.',range:115},
    area:{name:'Bombardeo',icon:'💥',cd:26000,color:0xff8b45,desc:'Golpea varias veces una zona y causa gran daño.',range:125}
  };
  window.HeroSkillsV37 = {version:'37.0',defs:defs};

  function selected(){return GameState && GameState.selectedPlacedTower;}
  function ready(t){return !t || !t.v37Next || S.now >= t.v37Next;}
  function enemiesNear(t,r){
    return GameState.enemies.filter(e=>!e.dead && Math.hypot(e.x-t.x,e.y-t.y)<=r).sort((a,b)=>Math.hypot(a.x-t.x,a.y-t.y)-Math.hypot(b.x-t.x,b.y-t.y));
  }
  function mark(t,d){t.v37Next=S.now+d.cd; refreshTowerPanel(t); ringFx(t.x,t.y,d.color,45,420); burst(t.x,t.top||35,t.y,d.color,10,55);}

  function use(t){
    if(!t || !canAct() || !ready(t)){ if(typeof sfx!=='undefined'&&sfx.deny)sfx.deny(); return; }
    const d=defs[t.type], es=enemiesNear(t,d.range);
    if(!es.length){ showRewardToast('⚠ No hay enemigos al alcance'); if(sfx.deny)sfx.deny(); return; }
    if(t.type==='basic'){
      mark(t,d); sfx.click();
      es.slice(0,6).forEach((e,i)=>setTimeout(()=>{
        if(e.dead)return;
        damageEnemy(e,Math.round(getEffectiveStats(t).dmg*2.2),'pierce');
        spark(e.x,30,e.y,d.color,260,2); ringFx(e.x,e.y,16,d.color,180);
      },i*65));
      showRewardToast('🏹 ¡Lluvia de Flechas!');
    } else if(t.type==='slow'){
      mark(t,d); sfx.freezeAll();
      const center=es[0]; explosionFx(center.x,center.y,70,'lg',false); flashScreen('#b99cff',0.16,300);
      es.slice(0,8).forEach(e=>{ damageEnemy(e,Math.round(getEffectiveStats(t).dmg*3.5),'magic'); if(!e.dead){e.slowF=0.35;e.slowUntil=Math.max(e.slowUntil||0,S.now+4200);} });
      showRewardToast('🔮 ¡Tormenta Arcana!');
    } else {
      mark(t,d); sfx.meteorCall();
      const center=es[0];
      [0,180,360].forEach((delay,j)=>setTimeout(()=>{
        if(!GameState.started)return;
        explosionFx(center.x,center.y,62,'lg',true); S.shake=6;
        enemiesNear(t,70).slice(0,9).forEach(e=>damageEnemy(e,Math.round(getEffectiveStats(t).dmg*2.4),'siege'));
      },delay));
      showRewardToast('💥 ¡Bombardeo!');
    }
  }
  window.useHeroSkillV37=use;

  function addButton(){
    const panel=document.getElementById('towerPanelActions'); if(!panel || document.getElementById('heroSkillBtn'))return;
    const b=document.createElement('button'); b.id='heroSkillBtn'; b.className='panel-btn hero-skill';
    b.innerHTML='<b>HABILIDAD</b><small>LISTA</small>';
    b.addEventListener('click',()=>use(selected())); panel.insertBefore(b,panel.querySelector('.upgrade'));
  }
  function refresh(){
    const b=document.getElementById('heroSkillBtn'),t=selected(); if(!b)return;
    if(!t){b.style.display='none';return;}
    const d=defs[t.type], left=Math.max(0,(t.v37Next||0)-S.now), ok=left<=0 && canAct();
    b.style.display=''; b.classList.toggle('disabled',!ok); b.classList.toggle('ready',ok);
    b.innerHTML=`<b>${d.icon} ${d.name.toUpperCase()}</b><small>${left>0?Math.ceil(left/1000)+' s':'LISTA'}</small>`;
    b.title=d.desc;
  }
  window.HeroSkillsV37Refresh=refresh;
  function boot(){addButton(); refresh(); setInterval(refresh,250);}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
