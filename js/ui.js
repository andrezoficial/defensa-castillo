// ui.js
// Todo lo que toca el DOM (fuera del canvas de Phaser) vive aquí: HUD con
// animaciones, botones de construcción, panel de mejora/venta, aviso de
// jefe y controles de pausa/velocidad.

function selectTower(type) {
  deselectPlacedTower();
  GameState.selectedTower = (GameState.selectedTower === type) ? null : type;
  document.querySelectorAll('#buildButtons .btn').forEach(b => b.classList.remove('selected'));
  if (GameState.selectedTower) {
    const id = 'tower' + type.charAt(0).toUpperCase() + type.slice(1);
    document.getElementById(id).classList.add('selected');
  } else {
    clearPlacementPreview();
  }
}

// Pequeño "+N" / "-N" flotante y un pulso de color sobre la cifra que
// cambió, para que el cambio se note aunque no se esté mirando el número.
function animateStatChange(el, delta) {
  el.classList.remove('stat-pulse-pos', 'stat-pulse-neg');
  void el.offsetWidth; // fuerza reflow para poder reiniciar la animación
  el.classList.add(delta > 0 ? 'stat-pulse-pos' : 'stat-pulse-neg');

  const floatEl = document.createElement('span');
  floatEl.className = 'stat-float ' + (delta > 0 ? 'stat-float-pos' : 'stat-float-neg');
  floatEl.textContent = (delta > 0 ? '+' : '') + delta;
  el.parentElement.appendChild(floatEl);
  floatEl.addEventListener('animationend', () => floatEl.remove());
}

function updateHUD() {
  const goldEl = document.getElementById('goldTxt');
  const lifeEl = document.getElementById('lifeTxt');

  const goldDelta = GameState.gold - GameState.lastGold;
  const lifeDelta = GameState.lives - GameState.lastLives;

  goldEl.textContent = GameState.gold;
  lifeEl.textContent = GameState.lives;
  document.getElementById('waveTxt').textContent = GameState.wave;

  if (goldDelta !== 0) animateStatChange(goldEl, goldDelta);
  if (lifeDelta !== 0) animateStatChange(lifeEl, lifeDelta);

  GameState.lastGold = GameState.gold;
  GameState.lastLives = GameState.lives;
}

function toggleBossTag(show) {
  document.getElementById('bossTag').style.display = show ? 'flex' : 'none';
}

function showTowerPanel(tower) {
  document.getElementById('buildButtons').style.display = 'none';
  document.getElementById('towerPanel').style.display = 'flex';
  refreshTowerPanel(tower);
}

function hideTowerPanel() {
  document.getElementById('towerPanel').style.display = 'none';
  document.getElementById('buildButtons').style.display = 'flex';
}

function refreshTowerPanel(tower) {
  const stats = getEffectiveStats(tower);
  const name = TOWER_DEFS[tower.type].name;
  document.getElementById('towerPanelInfo').textContent =
    `${name} · Nivel ${tower.level}/${MAX_TOWER_LEVEL} — Daño ${stats.dmg} · Rango ${stats.range}`;

  const upgradeBtn = document.getElementById('upgradeBtn');
  const upgradeCost = document.getElementById('upgradeCost');
  if (tower.level >= MAX_TOWER_LEVEL) {
    upgradeCost.textContent = 'MÁX';
    upgradeBtn.classList.add('disabled');
  } else {
    upgradeCost.textContent = getUpgradeCost(tower.type, tower.level);
    upgradeBtn.classList.remove('disabled');
  }
  document.getElementById('sellValue').textContent = Math.round(tower.invested * SELL_REFUND_RATIO);
}

function showGameOver(win) {
  document.getElementById('msg').style.display = 'flex';
  document.getElementById('msgTitle').textContent = win
    ? '🏆 ¡Castillo a salvo!'
    : '💀 El castillo ha caído';
  GameState.scene.scene.pause();
}

// --- Pausa y velocidad x2 ---
function togglePause() {
  GameState.paused = !GameState.paused;
  const btn = document.getElementById('pauseBtn');
  const overlay = document.getElementById('pauseOverlay');
  if (GameState.paused) {
    GameState.scene.scene.pause();
    btn.textContent = '▶️';
    overlay.style.display = 'flex';
  } else {
    GameState.scene.scene.resume();
    btn.textContent = '⏸️';
    overlay.style.display = 'none';
  }
}

function toggleSpeed() {
  const next = GameState.speedMultiplier === 1 ? 2 : 1;
  GameState.speedMultiplier = next;
  GameState.scene.sys.game.loop.timeScale = next;
  const btn = document.getElementById('speedBtn');
  btn.classList.toggle('active', next === 2);
  btn.textContent = next === 2 ? '⏩ x2' : '⏩';
}

function bindUIEvents() {
  document.getElementById('towerBasic').addEventListener('click', () => selectTower('basic'));
  document.getElementById('towerSlow').addEventListener('click', () => selectTower('slow'));
  document.getElementById('towerArea').addEventListener('click', () => selectTower('area'));
  document.getElementById('waveBtn').addEventListener('click', startWave);
  document.getElementById('restartBtn').addEventListener('click', () => location.reload());

  document.getElementById('upgradeBtn').addEventListener('click', () => {
    if (GameState.selectedPlacedTower) upgradeTower(GameState.selectedPlacedTower);
  });
  document.getElementById('sellBtn').addEventListener('click', () => {
    if (GameState.selectedPlacedTower) sellTower(GameState.selectedPlacedTower);
  });
  document.getElementById('closeTowerPanel').addEventListener('click', deselectPlacedTower);

  document.getElementById('pauseBtn').addEventListener('click', togglePause);
  document.getElementById('speedBtn').addEventListener('click', toggleSpeed);
}
