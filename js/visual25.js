/* V25 — COMBATE CINEMÁTICO
 * Capa visual ligera sobre el combate existente. No cambia daño, economía ni IA.
 */
(()=>{
  'use strict';
  const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root=document.createElement('div');root.id='v25CombatLayer';
  root.innerHTML='<div class="v25-impact-flash"></div><div class="v25-boss-cinema"><div class="v25-boss-line"></div><small>ENEMIGO ÉPICO</small><b></b></div><div class="v25-hit-marker"></div>';
  document.body.appendChild(root);
  const flash=root.querySelector('.v25-impact-flash'),boss=root.querySelector('.v25-boss-cinema'),bossName=boss.querySelector('b'),marker=root.querySelector('.v25-hit-marker');
  let flashUntil=0,lastBoss=0;
  const now=()=>performance.now();
  function pulseScreen(strength){
    if(reduce||strength<.35)return;
    flash.style.setProperty('--v25-power',String(Math.min(1,strength)));
    flash.classList.remove('on');void flash.offsetWidth;flash.classList.add('on');
  }
  function hit(e,dtype,crit){
    if(!e||e.dead)return;
    const c=crit?0xffdf70:(dtype==='magic'?0x8fdcff:dtype==='fire'?0xff7048:0xf6e1b0);
    const heavy=!!crit||!!e.isBoss;
    if(window.burst)try{burst(e.x,(e.hb||20)*.58,e.y,c,heavy?9:4,heavy?64:32)}catch(_){ }
    if(window.ringFx)try{ringFx(e.x,e.y,c,heavy?24:11,heavy?360:210,(e.hb||20)*.42)}catch(_){ }
    e.__v25Hit={t:now(),dur:heavy?230:150,dir:(Math.random()-.5)*2.0,amp:heavy?0.11:0.065};
    if(crit||e.isBoss){S.shake=Math.max(S.shake,crit?3.2:1.7);pulseScreen(crit?0.8:.42)}
    if(crit){marker.classList.remove('on');void marker.offsetWidth;marker.classList.add('on')}
  }
  function shot(t,e,st){
    if(!t)return;
    const c=st?.proj||0xffd36a;
    if(window.burst)try{burst(t.x,t.top,t.y,c,st?.area?8:3,st?.area?45:20)}catch(_){ }
    if(window.ringFx)try{ringFx(t.x,t.y,c,st?.area?20:9,st?.area?280:170,t.top)}catch(_){ }
    t.__v25Shot={t:now(),dur:190};
    if(t.fig)t.fig.userData.v25Recoil=now();
  }
  function bossIntro(e){
    if(!e||!e.isBoss||now()-lastBoss<2500)return;
    lastBoss=now();
    bossName.textContent=e.name||'JEFE';
    boss.classList.remove('show');void boss.offsetWidth;boss.classList.add('show');
    if(!reduce){S.shake=Math.max(S.shake,4);S.slow=Math.max(S.slow,420)}
    pulseScreen(.65);
    if(window.waveFx)try{waveFx(e.x,e.y,0xff7048,Math.max(70,e.bd?.size||90),650)}catch(_){ }
    if(window.burst)try{burst(e.x,e.hb*.45,e.y,0xffb04a,18,90)}catch(_){ }
  }
  function updateEnemy(e,time){
    const h=e.__v25Hit;if(h&&e.mesh){
      const p=Math.min(1,(time-h.t)/h.dur),w=Math.sin(p*Math.PI),amp=h.amp*w;
      e.mesh.rotation.z=(e.mesh.rotation.z||0)+amp*h.dir;
      e.mesh.position.y+=(h.amp*18)*w;
      e.mesh.scale.multiplyScalar(1+amp*.35);
      if(p>=1)e.__v25Hit=null;
    }
    const s=e.__v25Shot;
    if(s&&e.mesh){const p=Math.min(1,(time-s.t)/s.dur),w=Math.sin(p*Math.PI);e.mesh.scale.multiplyScalar(1+w*.035);if(p>=1)e.__v25Shot=null}
  }
  function death(e){
    if(!e)return;
    if(e.isBoss){pulseScreen(1);S.shake=Math.max(S.shake,7)}
  }
  window.CombatV25={hit,shot,bossIntro,updateEnemy,death};
})();
