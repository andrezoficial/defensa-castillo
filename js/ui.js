// ui.js — HUD, menús, paneles y controles del DOM.
// La lógica de juego vive en engine3d.js; este archivo solo muestra el estado y recoge eventos.

const $ = (id) => document.getElementById(id);
const TOWER_ICONS = { basic: '♜', slow: '✧', area: '⚒' };

/* ---------- HUD ---------- */

function animateStatChange(el, delta) {
  el.classList.remove('stat-pulse-pos', 'stat-pulse-neg');
  void el.offsetWidth; // reinicia la animación CSS
  el.classList.add(delta > 0 ? 'stat-pulse-pos' : 'stat-pulse-neg');
  const f = document.createElement('span');
  f.className = 'stat-float ' + (delta > 0 ? 'stat-float-pos' : 'stat-float-neg');
  f.textContent = (delta > 0 ? '+' : '') + delta;
  el.parentElement.appendChild(f);
  f.addEventListener('animationend', () => f.remove());
}

function updateHUD() {
  const g = $('goldTxt');
  const l = $('lifeTxt');
  const goldDelta = GameState.gold - GameState.lastGold;
  const lifeDelta = GameState.lives - GameState.lastLives;
  g.textContent = GameState.gold;
  l.textContent = GameState.lives;
  $('waveTxt').textContent = GameState.wave;
  if (goldDelta) animateStatChange(g, goldDelta);
  if (lifeDelta) animateStatChange(l, lifeDelta);
  GameState.lastGold = GameState.gold;
  GameState.lastLives = GameState.lives;
  updateCombatUI();
}

function updateCombatUI() {
  $('enemyCount').textContent = GameState.enemies.filter((e) => !e.dead).length;

  const active = GameState.waveActive;
  $('combatStatus').classList.toggle('active', active);
  $('combatStatusText').textContent = active ? `OLEADA ${GameState.wave} · DEFENDIENDO` : 'DEFENSAS EN ESPERA';

  const inCycle = GameState.wave % BOSS_WAVE_INTERVAL;
  const step = inCycle === 0 && GameState.wave > 0 ? BOSS_WAVE_INTERVAL : inCycle;
  $('waveProgressBar').style.width = `${(step / BOSS_WAVE_INTERVAL) * 100}%`;
  $('waveProgressText').textContent = `${step} / ${BOSS_WAVE_INTERVAL}`;

  document.querySelectorAll('#buildButtons .tower-btn').forEach((b) => {
    const d = TOWER_DEFS[b.dataset.tower];
    if (d) b.classList.toggle('poor', GameState.gold < d.cost);
  });

  const next = GameState.wave + 1;
  const nextIsBoss = next % BOSS_WAVE_INTERVAL === 0;
  const wb = $('waveBtn');
  wb.classList.toggle('ready', !active && canAct());
  wb.disabled = active || !canAct();
  $('waveBtnLabel').textContent = active ? 'OLEADA EN CURSO' : `INICIAR OLEADA ${next}`;
  const plan = getWavePlan(next);
  const special = plan.swarm + plan.saboteurs + plan.healers + plan.wraiths;
  $('waveBtnHint').textContent = active
    ? `${GameState.enemies.length} en el campo`
    : `${plan.total} enemigos` + (plan.raiders ? ` · ${plan.raiders} veloces` : '') + ((plan.ogres + plan.brutes) ? ` · ${plan.ogres + plan.brutes} blindados` : '') +
      (special ? ` · ${special} especiales` : '') + (nextIsBoss ? ' · ♛ JEFE' : '');

  if (typeof updateSkillUI === 'function') updateSkillUI();
  Progress.tick();

  // La mejora se ve apagada si falta oro
  const t = GameState.selectedPlacedTower;
  if (t) $('upgradeBtn').classList.toggle('poor', t.level < MAX_TOWER_LEVEL && GameState.gold < getUpgradeCost(t.type, t.level));
}

function toggleBossTag(show, name) {
  const tag = $('bossTag');
  tag.innerHTML = `<span>♛</span> ${name ? name.toUpperCase() + ' EN CAMINO' : 'JEFE EN CAMINO'}`;
  tag.style.display = show ? 'flex' : 'none';
}

// Barra de vida del jefe (arriba al centro) con marcas en cada cambio de fase y barra de escudo.
function updateBossBar(b) {
  const el = $('bossBar');
  if (!b) {
    if (el.style.display !== 'none') { el.style.display = 'none'; el.dataset.id = ''; }
    return;
  }
  if (el.dataset.id !== String(b.id)) {
    el.dataset.id = b.id;
    el.style.display = 'block';
    $('bbName').textContent = b.name.toUpperCase();
    $('bbTicks').innerHTML = b.bd.phases.map((ph) => `<span style="left:${ph.at * 100}%"></span>`).join('');
  }
  $('bbPhase').textContent = `FASE ${b.phaseIdx + 1}/${b.bd.phases.length + 1}`;
  $('bbHp').style.width = `${Math.max(0, (b.hp / b.maxHp) * 100)}%`;
  $('bbShield').style.width = b.shield > 0 ? `${(b.shield / b.maxShield) * 100}%` : '0';
  el.classList.toggle('locked', b.phaseLock > S.now);
  el.classList.toggle('enraged', !!b.enraged);
}

/* ---------- Panel de torre ---------- */

function showTowerPanel(t) {
  $('buildButtons').style.display = 'none';
  $('towerPanel').style.display = 'flex';
  refreshTowerPanel(t);
}

function hideTowerPanel() {
  $('towerPanel').style.display = 'none';
  $('buildButtons').style.display = ''; // vuelve al display definido en el CSS (flex/grid)
}

function refreshTowerPanel(t) {
  const st = getEffectiveStats(t);
  $('panelTowerName').textContent = TOWER_DEFS[t.type].name;
  const spDef = specOf(t), elig = needsSpec(t), defs = SPEC_DEFS[t.type];
  const pend = elig && t.specPending ? defs.find((x) => x.id === t.specPending) : null;
  $('towerPanelInfo').textContent = pend
    ? `${pend.desc} Toca de nuevo para confirmar.`
    : `Nivel ${t.level}/${MAX_TOWER_LEVEL}` + (spDef ? ` · ${spDef.name}` : elig ? ' · ¡Elige una especialización!' : '');
  [0, 1].forEach((i) => {
    const b = $('spec' + i), d = defs[i];
    b.style.display = elig ? '' : 'none';
    b.innerHTML = `<b>${d.icon} ${d.name.toUpperCase()}</b><small>${d.cost} ✦</small>`;
    b.title = d.desc;
    b.classList.toggle('pending', !!pend && pend.id === d.id);
    b.classList.toggle('poor', GameState.gold < d.cost);
  });
  $('upgradeBtn').style.display = elig ? 'none' : '';
  $('panelTowerIcon').textContent = TOWER_ICONS[t.type];
  $('panelStats').innerHTML =
    `<div class="panel-stat"><b>${st.dmg}</b><small>DAÑO</small></div>` +
    `<div class="panel-stat"><b>${st.range}</b><small>RANGO</small></div>` +
    `<div class="panel-stat"><b>${(1000 / st.rate).toFixed(1)}/s</b><small>CADENCIA</small></div>` +
    `<div class="panel-stat"><b class="pips">${'◆'.repeat(t.level)}${'◇'.repeat(MAX_TOWER_LEVEL - t.level)}</b><small>NIVEL</small></div>`;
  const u = $('upgradeBtn');
  if (t.level >= MAX_TOWER_LEVEL) {
    $('upgradeCost').textContent = 'MÁXIMO';
    u.classList.add('disabled');
  } else {
    $('upgradeCost').textContent = getUpgradeCost(t.type, t.level) + ' ✦';
    u.classList.remove('disabled');
  }
  $('targetLabel').textContent = TARGET_LABELS[t.mode];
  $('sellValue').textContent = Math.round(t.invested * SELL_REFUND_RATIO) + ' ✦';
  updateCombatUI();
}

/* ---------- Estadísticas ---------- */
function renderStatsPanel() {
  const body = $('statsBody');
  if (!body || typeof Progress === 'undefined') return;
  const d = Progress.data ? Progress.data() : null;
  const kills = d ? d.stats.kills : GameState.kills;
  const bosses = d ? d.stats.bosses : 0;
  const wins = d ? d.stats.wins : 0;
  const waves = d ? d.stats.waves : readBestWave();
  const crowns = d ? d.crowns : 0;
  const totalDamage = d ? d.stats.damage : GameState.totalDamage;
  const totalGold = d ? d.stats.gold : GameState.goldEarned;
  body.innerHTML = `<div class="stats-hero"><b>🏰 ${CURRENT_MAP.name}</b><small>Tu progreso se guarda en este dispositivo</small></div>
    <div class="stats-grid">
      <div><b>${kills.toLocaleString('es-CO')}</b><small>ENEMIGOS</small></div>
      <div><b>${bosses.toLocaleString('es-CO')}</b><small>JEFES</small></div>
      <div><b>${wins.toLocaleString('es-CO')}</b><small>VICTORIAS</small></div>
      <div><b>${waves.toLocaleString('es-CO')}</b><small>MEJOR OLEADA</small></div>
      <div><b>${crowns.toLocaleString('es-CO')}</b><small>CORONAS</small></div>
      <div><b>${Math.round(totalDamage).toLocaleString('es-CO')}</b><small>DAÑO TOTAL</small></div>
      <div><b>${Math.round(totalGold).toLocaleString('es-CO')}</b><small>ORO OBTENIDO</small></div>
    </div>
    <div class="stats-note">Consejo: conserva vidas para conseguir 3 ★ al completar un mapa.</div>`;
}

/* ---------- Carga ---------- */

function setLoadState(state, progress = 0, message = '') {
  GameState.ready = state === 'ready';
  const btn = $('startGameBtn');
  const status = $('loadStatus');
  btn.disabled = state !== 'ready';
  $('continueSaveBtn').disabled = state !== 'ready';
  $('retryLoadBtn').hidden = state !== 'error';
  status.classList.toggle('error', state === 'error');
  if (state === 'loading') {
    $('startLabel').textContent = 'PREPARANDO EL CAMPO…';
    status.textContent = `CARGANDO MODELOS 3D · ${Math.round(progress * 100)}%`;
  } else if (state === 'ready') {
    $('startLabel').textContent = 'COMENZAR DEFENSA';
    status.textContent = '';
  } else {
    $('startLabel').textContent = 'NO SE PUDO CARGAR';
    status.textContent = message;
  }
}

function refreshBestChip() {
  const best = readBestWave();
  $('bestChip').textContent = best > 0
    ? `MEJOR RACHA · OLEADA ${best}`
    : `V6.9 · ${WIN_WAVE} OLEADAS + MODO SIN FIN`;
}

/* ---------- Flujo de partida ---------- */

function beginGame() {
  if (!GameState.ready || GameState.started) return;
  Sound.unlock();
  Music.setMood('calm');
  GameState.started = true;
  GameState.totalDamage = 0;
  GameState.goldEarned = 0;
  S.running = true;
  $('startScreen').classList.remove('active');
  $('howToPanel').classList.remove('open');
  Progress.applyRun();
  updateHUD();
}

function togglePause() {
  if (!GameState.started || GameState.over) return;
  GameState.paused = !GameState.paused;
  S.running = !GameState.paused;
  $('pauseBtn').textContent = GameState.paused ? '▶' : 'Ⅱ';
  $('pauseBtn').title = GameState.paused ? 'Continuar' : 'Pausa';
  $('pauseOverlay').style.display = GameState.paused ? 'flex' : 'none';
  Music.duck(GameState.paused);
  if (GameState.paused) clearSelection();
  updateCombatUI();
}

function toggleSpeed() {
  const n = GameState.speedMultiplier === 1 ? 2 : 1;
  GameState.speedMultiplier = n;
  const b = $('speedBtn');
  b.classList.toggle('active', n === 2);
  b.textContent = n === 2 ? '»×2' : '»';
}

function toggleSound() {
  Sound.unlock();
  Sound.setMuted(!Sound.isMuted());
  syncSoundButton();
  if (!Sound.isMuted()) sfx.click();
}

function syncSoundButton() {
  const off = Sound.isMuted();
  const b = $('soundBtn');
  b.classList.toggle('off', off);
  b.title = off ? 'Activar sonido' : 'Silenciar';
  b.setAttribute('aria-pressed', String(off));
}

function showGameOver(win) {
  if (GameState.over) return;
  GameState.over = true;
  S.running = false;
  Save.clear();
  Music.setMood(win ? 'calm' : null);
  clearSelection();
  writeBestWave(GameState.wave);
  const best = readBestWave();
  const sum = Progress.onEnd(win);
  $('msg').style.display = 'flex';
  $('msgCrest').textContent = win ? '♛' : '✠';
  $('msgTitle').textContent = win ? '¡CASTILLO A SALVO!' : 'EL CASTILLO HA CAÍDO';
  $('msgSubtitle').textContent = win
    ? `Resististe ${WIN_WAVE} oleadas y derrotaste a ${GameState.kills} enemigos. ¿Cuánto más puede aguantar el reino?`
    : `Las fuerzas enemigas atravesaron las defensas en la oleada ${GameState.wave}. Enemigos derrotados: ${GameState.kills}. Mejor racha: oleada ${best}.`;
  $('msgSubtitle').textContent += sum.stars ? ` ${'★'.repeat(sum.stars)}${'☆'.repeat(3 - sum.stars)}` : '';
  $('msgSubtitle').textContent += ` · +${sum.crowns} 👑 en esta partida.`;
  $('resultStats').innerHTML = `<div><b>${GameState.kills}</b><small>BAJAS</small></div><div><b>${Math.round(GameState.totalDamage).toLocaleString('es-CO')}</b><small>DAÑO</small></div><div><b>${GameState.goldEarned.toLocaleString('es-CO')}</b><small>ORO OBTENIDO</small></div><div><b>${GameState.wave}</b><small>OLEADAS</small></div>`;
  $('continueBtn').hidden = !win;
  if (win) sfx.win();
  else sfx.lose();
  updateCombatUI();
}

function continueEndless() {
  if (!GameState.over) return;
  GameState.over = false;
  GameState.continued = true;
  $('msg').style.display = 'none';
  S.running = !GameState.paused;
  updateHUD();
}

/* ---------- Eventos ---------- */

function bindUIEvents() {
  const panel = $('howToPanel');

  $('startGameBtn').addEventListener('click', beginGame);
  $('retryLoadBtn').addEventListener('click', initGame);
  $('howToBtn').addEventListener('click', () => panel.classList.add('open'));
  $('closeHowTo').addEventListener('click', () => panel.classList.remove('open'));
  const statsPanel = $('statsPanel');
  $('statsBtn').addEventListener('click', () => { renderStatsPanel(); statsPanel.classList.add('open'); });
  $('closeStats').addEventListener('click', () => statsPanel.classList.remove('open'));

  document.querySelectorAll('#buildButtons .tower-btn').forEach((b) =>
    b.addEventListener('click', () => selectTower(b.dataset.tower)));
  $('waveBtn').addEventListener('click', startWave);
  $('restartBtn').addEventListener('click', () => location.reload());
  $('continueBtn').addEventListener('click', continueEndless);
  $('upgradeBtn').addEventListener('click', () => {
    if (GameState.selectedPlacedTower && canAct()) upgradeTower(GameState.selectedPlacedTower);
  });
  $('sellBtn').addEventListener('click', () => {
    if (GameState.selectedPlacedTower && canAct()) sellTower(GameState.selectedPlacedTower);
  });
  $('targetBtn').addEventListener('click', () => {
    if (GameState.selectedPlacedTower && canAct()) cycleTarget(GameState.selectedPlacedTower);
  });
  $('closeTowerPanel').addEventListener('click', deselectPlacedTower);
  $('pauseBtn').addEventListener('click', togglePause);
  $('speedBtn').addEventListener('click', toggleSpeed);
  $('soundBtn').addEventListener('click', toggleSound);

  $('rotL').addEventListener('click', () => rotateCam(-1));
  $('rotR').addEventListener('click', () => rotateCam(1));
  $('zoomIn').addEventListener('click', () => zoomCam(0.9));
  $('zoomOut').addEventListener('click', () => zoomCam(1.1));

  // Tras un clic con el ratón, el botón suelta el foco para que Espacio no lo vuelva a pulsar.
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('button');
    if (b && e.detail > 0) b.blur();
  });

  // El audio del navegador se habilita con el primer gesto del usuario.
  const unlockOnce = () => { Sound.unlock(); Music.start(); };
  document.addEventListener('pointerdown', unlockOnce, { once: true });
  document.addEventListener('keydown', unlockOnce, { once: true });

  document.addEventListener('keydown', (e) => {
    if (e.target.matches && e.target.matches('input,textarea,select')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();

    if (k === 'escape') {
      panel.classList.remove('open');
      statsPanel.classList.remove('open');
      if (canAct()) clearSelection();
      return;
    }
    if (!GameState.started || GameState.over) return;

    if (e.code === 'Space') {
      e.preventDefault();
      if (canAct() && !GameState.waveActive) startWave();
    }
    if (k === 'p') togglePause();
    if (k === 'f') toggleSpeed();
    const pt = GameState.selectedPlacedTower;
    if (k === 'z' || k === 'x' || k === 'c') useSkill(k === 'z' ? 'meteor' : k === 'x' ? 'freeze' : 'fury');
    // Con una torre al nivel máximo seleccionada, 1 y 2 eligen su especialización.
    if (pt && canAct() && needsSpec(pt) && (k === '1' || k === '2')) {
      specializeTower(pt, SPEC_DEFS[pt.type][Number(k) - 1].id);
      return;
    }
    if (k === '1') selectTower('basic');
    if (k === '2') selectTower('slow');
    if (k === '3') selectTower('area');
    if (pt && canAct()) {
      if (k === 'u') upgradeTower(pt);
      if (k === 'v') sellTower(pt);
      if (k === 't') cycleTarget(pt);
    }
  });
  // Espacio sobre un botón enfocado lo activaría al soltar; lo evitamos durante la partida.
  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && GameState.started) e.preventDefault();
  });

  // Si la pestaña queda en segundo plano, la partida se pausa sola.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && canAct()) togglePause();
  });

  bindV4Events();
  Progress.init();
  Settings.init();
  Save.init();
  syncSoundButton();
  refreshBestChip();
  setInterval(updateCombatUI, 200);
}
