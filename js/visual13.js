/* V13 — PRESENTACIÓN CINEMÁTICA / HUD PREMIUM
   Capa visual independiente: no cambia reglas, economía, daño ni IA. */
(function(){
  'use strict';
  const root=document.getElementById('wrap');
  if(!root) return;

  const layer=document.createElement('div');
  layer.id='v13Presentation';
  layer.innerHTML=`
    <div class="v13-topline"><span class="v13-realm">LAS TIERRAS DEL ECLIPSE</span><span class="v13-divider"></span><span id="v13Phase">FORTALEZA EN CALMA</span></div>
    <div id="v13WaveIntro" class="v13-wave-intro"><div class="v13-wave-kicker">NUEVA AMENAZA</div><div id="v13WaveTitle">OLEADA 1</div><div id="v13WaveSub">Las defensas están listas.</div></div>
    <div id="v13BossAlert" class="v13-boss-alert"><span class="v13-boss-icon">♛</span><div><small>AMENAZA MAYOR</small><b id="v13BossName">JEFE</b></div></div>
    <div class="v13-corners"><i></i><i></i><i></i><i></i></div>
  `;
  root.appendChild(layer);

  const phase=document.getElementById('v13Phase');
  const intro=document.getElementById('v13WaveIntro');
  const title=document.getElementById('v13WaveTitle');
  const sub=document.getElementById('v13WaveSub');
  const bossAlert=document.getElementById('v13BossAlert');
  const bossName=document.getElementById('v13BossName');
  let lastWave=-1, lastBoss=false, introTimer=0, alertTimer=0;

  function showIntro(wave){
    if(!intro || wave<=0) return;
    title.textContent=`OLEADA ${wave}`;
    const boss=wave%5===0;
    sub.textContent=boss?'Un enemigo de élite se aproxima al castillo.':'Las fuerzas enemigas avanzan. Refuerza tus defensas.';
    intro.classList.remove('show'); void intro.offsetWidth; intro.classList.add('show');
    clearTimeout(introTimer); introTimer=setTimeout(()=>intro.classList.remove('show'),3200);
  }

  function showBoss(name){
    if(!bossAlert) return;
    bossName.textContent=name||'JEFE';
    bossAlert.classList.remove('show'); void bossAlert.offsetWidth; bossAlert.classList.add('show');
    clearTimeout(alertTimer); alertTimer=setTimeout(()=>bossAlert.classList.remove('show'),4300);
  }

  function tick(){
    const gs=window.GameState;
    if(!gs){ requestAnimationFrame(tick); return; }
    const wave=Number(gs.wave||0);
    if(wave!==lastWave){
      if(lastWave>=0 && wave>lastWave) showIntro(wave);
      lastWave=wave;
    }
    const enemies=Array.isArray(gs.enemies)?gs.enemies:[];
    const boss=enemies.find(e=>e && e.isBoss && !e.dead);
    if(boss && !lastBoss){
      showBoss(boss.name || boss.type || 'JEFE');
      lastBoss=true;
    } else if(!boss) lastBoss=false;
    if(phase){
      if(gs.over) phase.textContent='BATALLA CONCLUIDA';
      else if(gs.paused) phase.textContent='TIEMPO DETENIDO';
      else if(boss) phase.textContent='⚠ AMENAZA MAYOR';
      else if(gs.started && gs.wave>0) phase.textContent='DEFENSAS ACTIVAS';
      else phase.textContent='FORTALEZA EN CALMA';
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // Give the result screen a premium secondary line without touching its logic.
  const result=document.querySelector('.result-card');
  if(result){
    const crest=document.getElementById('msgCrest');
    if(crest){
      const ring=document.createElement('div'); ring.className='v13-result-ring';
      crest.parentNode.insertBefore(ring,crest); ring.appendChild(crest);
    }
  }
})();
