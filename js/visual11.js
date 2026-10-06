/* V11 — COMBAT CINEMATIC FEEDBACK */
(()=>{
  const root=document.createElement('div'); root.id='combat-v11';
  root.innerHTML='<div class="combat-vignette"></div><div class="combat-flash"></div><div class="combat-kill-feed"></div>';
  document.body.appendChild(root);
  const flash=root.querySelector('.combat-flash'), feed=root.querySelector('.combat-kill-feed');
  const hit=(e,dtype,crit)=>{
    if(!e||!window.scene)return;
    const c=crit?0xffdf72:(dtype==='magic'?0x9b8cff:dtype==='fire'?0xff7048:0xffffff);
    if(window.burst) try{window.burst(e.x,e.hb*.62,e.y,c,crit?10:6,crit?58:34)}catch(_){ }
    if(window.ringFx) try{window.ringFx(e.x,e.y,c,crit?22:13,crit?360:250,e.hb*.45)}catch(_){ }
    if(e.mesh){ e.__v11Punch=(performance.now()); }
  };
  const death=(e)=>{
    if(!e)return;
    if(window.explosionFx) try{window.explosionFx(e.x,e.y,e.isBoss?30:13,e.isBoss?'lg':'sm',true)}catch(_){ }
    if(window.burst) try{window.burst(e.x,e.hb*.45,e.y,e.isBoss?0xffc35a:0xb7d8ff,e.isBoss?18:9,e.isBoss?85:48)}catch(_){ }
    flash.classList.remove('active'); void flash.offsetWidth; flash.classList.add('active');
    if(!e.isBoss){ feed.textContent=''; }
  };
  const shot=(t,e,st)=>{
    if(!t)return;
    if(window.burst) try{window.burst(t.x,t.top,t.y,st?.proj||0xffd36a,st?.area?7:4,st?.area?42:24)}catch(_){ }
    if(t.fig) t.__v11Shot=performance.now();
  };
  window.CombatV11={hit,death,shot};
  let last=performance.now();
  function tick(){
    const now=performance.now(),dt=now-last;last=now;
    if(window.GameState?.enemies) for(const e of GameState.enemies){
      if(e.__v11Punch && e.mesh){const p=Math.min(1,(now-e.__v11Punch)/150);const k=p<.5?1+p*0.16:1+(1-p)*0.08;e.mesh.scale.setScalar((e.sc||1)*k);if(p>=1)e.__v11Punch=0;}
      if(e.dead && e.__v11DeathFx!==true){e.__v11DeathFx=true;death(e)}
    }
    requestAnimationFrame(tick)
  }
  tick();
})();
