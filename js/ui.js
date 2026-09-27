function selectTower(type){deselectPlacedTower();GameState.selectedTower=GameState.selectedTower===type?null:type;document.querySelectorAll('#buildButtons .tower-btn').forEach(b=>b.classList.remove('selected'));if(GameState.selectedTower){document.getElementById('tower'+type.charAt(0).toUpperCase()+type.slice(1)).classList.add('selected')}else clearPlacementPreview()}
function animateStatChange(el,delta){el.classList.remove('stat-pulse-pos','stat-pulse-neg');void el.offsetWidth;el.classList.add(delta>0?'stat-pulse-pos':'stat-pulse-neg');const f=document.createElement('span');f.className='stat-float '+(delta>0?'stat-float-pos':'stat-float-neg');f.textContent=(delta>0?'+':'')+delta;el.parentElement.appendChild(f);f.addEventListener('animationend',()=>f.remove())}
function updateHUD(){const g=document.getElementById('goldTxt'),l=document.getElementById('lifeTxt'),gd=GameState.gold-GameState.lastGold,ld=GameState.lives-GameState.lastLives;g.textContent=GameState.gold;l.textContent=GameState.lives;document.getElementById('waveTxt').textContent=GameState.wave;if(gd)animateStatChange(g,gd);if(ld)animateStatChange(l,ld);GameState.lastGold=GameState.gold;GameState.lastLives=GameState.lives}
function toggleBossTag(show){document.getElementById('bossTag').style.display=show?'flex':'none'}
function showTowerPanel(t){document.getElementById('buildButtons').style.display='none';document.getElementById('towerPanel').style.display='flex';refreshTowerPanel(t)}
function hideTowerPanel(){document.getElementById('towerPanel').style.display='none';document.getElementById('buildButtons').style.display='flex'}
function refreshTowerPanel(t){const st=getEffectiveStats(t),def=TOWER_DEFS[t.type];document.getElementById('panelTowerName').textContent=def.name;document.getElementById('towerPanelInfo').textContent=`Nivel ${t.level}/${MAX_TOWER_LEVEL}`;document.getElementById('panelTowerIcon').textContent=t.type==='basic'?'♜':t.type==='slow'?'✧':'⚒';document.getElementById('panelStats').innerHTML=`<div class="panel-stat"><b>${st.dmg}</b><small>DAÑO</small></div><div class="panel-stat"><b>${st.range}</b><small>RANGO</small></div><div class="panel-stat"><b>${(1000/st.rate).toFixed(1)}/s</b><small>CADENCIA</small></div><div class="panel-stat"><b class="pips">${'◆'.repeat(t.level)}${'◇'.repeat(MAX_TOWER_LEVEL-t.level)}</b><small>NIVEL</small></div>`;const u=document.getElementById('upgradeBtn');if(t.level>=MAX_TOWER_LEVEL){document.getElementById('upgradeCost').textContent='MÁXIMO';u.classList.add('disabled')}else{document.getElementById('upgradeCost').textContent=getUpgradeCost(t.type,t.level)+' ✦';u.classList.remove('disabled')}document.getElementById('sellValue').textContent=Math.round(t.invested*SELL_REFUND_RATIO)+' ✦'}
function showGameOver(win){document.getElementById('msg').style.display='flex';document.getElementById('msgCrest').textContent=win?'♛':'✠';document.getElementById('msgTitle').textContent=win?'¡CASTILLO A SALVO!':'EL CASTILLO HA CAÍDO';document.getElementById('msgSubtitle').textContent=win?'Tus defensas resistieron la invasión.':'Las fuerzas enemigas atravesaron las defensas.';GameState.scene.scene.pause()}
function togglePause(){GameState.paused=!GameState.paused;const b=document.getElementById('pauseBtn');const o=document.getElementById('pauseOverlay');if(GameState.paused){GameState.scene.scene.pause();b.textContent='▶';o.style.display='flex'}else{GameState.scene.scene.resume();b.textContent='Ⅱ';o.style.display='none'}}
function toggleSpeed(){const n=GameState.speedMultiplier===1?2:1;GameState.speedMultiplier=n;GameState.scene.sys.game.loop.timeScale=n;const b=document.getElementById('speedBtn');b.classList.toggle('active',n===2);b.textContent=n===2?'»×2':'»'}
function bindUIEvents(){document.getElementById('towerBasic').addEventListener('click',()=>selectTower('basic'));document.getElementById('towerSlow').addEventListener('click',()=>selectTower('slow'));document.getElementById('towerArea').addEventListener('click',()=>selectTower('area'));document.getElementById('waveBtn').addEventListener('click',startWave);document.getElementById('restartBtn').addEventListener('click',()=>location.reload());document.getElementById('upgradeBtn').addEventListener('click',()=>{if(GameState.selectedPlacedTower)upgradeTower(GameState.selectedPlacedTower)});document.getElementById('sellBtn').addEventListener('click',()=>{if(GameState.selectedPlacedTower)sellTower(GameState.selectedPlacedTower)});document.getElementById('closeTowerPanel').addEventListener('click',deselectPlacedTower);document.getElementById('pauseBtn').addEventListener('click',togglePause);document.getElementById('speedBtn').addEventListener('click',toggleSpeed)}

/* ===== FASE 3 · HUD / MENÚ / CONTROLES ===== */
function updateCombatUI(){
  const count=GameState.enemies.filter(e=>!e.dead).length;
  const countEl=document.getElementById('enemyCount'); if(countEl) countEl.textContent=count;
  const status=document.getElementById('combatStatus'), txt=document.getElementById('combatStatusText');
  if(status&&txt){
    const active=GameState.waveActive;
    status.classList.toggle('active',active);
    txt.textContent=active?`OLEADA ${GameState.wave} · DEFENDIENDO`:'DEFENSAS EN ESPERA';
  }
  const progress=document.getElementById('waveProgressBar'), progressText=document.getElementById('waveProgressText');
  if(progress&&progressText){
    const inCycle=GameState.wave%BOSS_WAVE_INTERVAL;
    const step=inCycle===0&&GameState.wave>0?BOSS_WAVE_INTERVAL:inCycle;
    progress.style.width=`${(step/BOSS_WAVE_INTERVAL)*100}%`;
    progressText.textContent=`${step} / ${BOSS_WAVE_INTERVAL}`;
  }
  const wb=document.getElementById('waveBtn'), hint=document.getElementById('waveBtnHint');
  if(wb){wb.classList.toggle('ready',!GameState.waveActive);if(hint)hint.textContent=GameState.waveActive?'Oleada en curso':'Prepárate para el ataque'}
}
const _updateHUD=updateHUD;
updateHUD=function(){_updateHUD();updateCombatUI()};

function startGamePresentation(){
  const overlay=document.getElementById('startScreen');
  if(overlay) overlay.classList.remove('active');
  if(GameState.scene){GameState.scene.scene.resume();}
  const status=document.getElementById('combatStatusText'); if(status) status.textContent='DEFENSAS EN ESPERA';
}
function bindPhase3UI(){
  const start=document.getElementById('startGameBtn'), how=document.getElementById('howToBtn'), panel=document.getElementById('howToPanel'), close=document.getElementById('closeHowTo'), sound=document.getElementById('soundBtn');
  start?.addEventListener('click',startGamePresentation);
  how?.addEventListener('click',()=>panel?.classList.add('open'));
  close?.addEventListener('click',()=>panel?.classList.remove('open'));
  sound?.addEventListener('click',()=>document.body.classList.toggle('muted'));
  document.addEventListener('keydown',e=>{
    if(e.target.matches('input,textarea')) return;
    if(e.code==='Space'){e.preventDefault();if(GameState.scene&&!GameState.waveActive)startWave()}
    if(e.key.toLowerCase()==='p' && GameState.scene)togglePause();
    if(e.key==='1')selectTower('basic');
    if(e.key==='2')selectTower('slow');
    if(e.key==='3')selectTower('area');
    if(e.key==='Escape'){GameState.selectedTower=null;deselectPlacedTower();panel?.classList.remove('open')}
  });
  setInterval(updateCombatUI,120);
}
const _bindUIEvents=bindUIEvents;
bindUIEvents=function(){_bindUIEvents();bindPhase3UI()};
