// towers.js
// Colocación, silueta por tipo, selección de una torre ya construida
// (para mejorarla o venderla), y disparo con proyectiles animados.

function createTowerVisual(scene, x, y, type, color) {
  const container = scene.add.container(x, y);
  const base = scene.add.circle(0, 6, 16, 0x4d4d55).setStrokeStyle(2, 0x2a2a30);
  container.add(base);

  if (type === 'basic') {
    const turret = scene.add.rectangle(0, -2, 20, 20, 0x6b5a45).setStrokeStyle(2, 0x2a2a30);
    const roof = scene.add.triangle(0, -18, -13, 6, 13, 6, 0, -12, 0x7a2e2e).setStrokeStyle(1, 0x2a2a30);
    container.add([turret, roof]);
  } else if (type === 'slow') {
    const spire = scene.add.triangle(0, -4, -12, 10, 12, 10, 0, -22, 0x3d3050).setStrokeStyle(2, 0x2a2a30);
    const orb = scene.add.circle(0, -18, 5, color);
    scene.tweens.add({ targets: orb, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });
    container.add([spire, orb]);
  } else if (type === 'area') {
    const wheelL = scene.add.circle(-10, 8, 6, 0x3a2513).setStrokeStyle(1, 0x1a1108);
    const wheelR = scene.add.circle(10, 8, 6, 0x3a2513).setStrokeStyle(1, 0x1a1108);
    const frame = scene.add.rectangle(0, 2, 24, 8, 0x5c3d1f).setStrokeStyle(1, 0x2a2a30);
    const arm = scene.add.rectangle(4, -8, 4, 24, 0x6b4a2a).setOrigin(0.5, 1).setRotation(-0.4);
    container.add([wheelL, wheelR, frame, arm]);
  }
  return container;
}

// Redibuja las gemas de nivel sobre la torre (1 a MAX_TOWER_LEVEL).
function updateLevelPips(tower) {
  if (tower.pips) tower.pips.destroy();
  const scene = GameState.scene;
  const g = scene.add.graphics();
  const startX = tower.x - ((tower.level - 1) * 10) / 2;
  for (let i = 0; i < tower.level; i++) {
    g.fillStyle(0xf0c14b, 1);
    g.fillCircle(startX + i * 10, tower.y - 30, 3);
    g.lineStyle(1, 0x8b5a2b, 1);
    g.strokeCircle(startX + i * 10, tower.y - 30, 3);
  }
  tower.pips = g;
}

function getEffectiveStats(tower) {
  const base = TOWER_DEFS[tower.type];
  const scaled = getTowerStats(tower.type, tower.level);
  return { ...base, ...scaled };
}

function findTowerAt(x, y) {
  for (const t of GameState.towers) {
    if (Math.hypot(t.x - x, t.y - y) < 22) return t;
  }
  return null;
}

// Reglas de colocación centralizadas: las usan tanto placeTower como la
// vista previa, para que siempre estén de acuerdo.
function isValidPlacement(x, y, type) {
  const def = TOWER_DEFS[type];
  if (GameState.gold < def.cost) return false;
  if (y > GAME_HEIGHT - 10) return false;
  if (distToPath(x, y) < MIN_TOWER_DISTANCE_TO_PATH) return false;
  for (const t of GameState.towers) {
    if (Math.hypot(t.x - x, t.y - y) < MIN_TOWER_DISTANCE_TO_TOWER) return false;
  }
  return true;
}

// Dibuja (o borra) el círculo de rango que sigue al dedo/cursor mientras
// se elige dónde colocar la torre seleccionada. Verde si el lugar es
// válido, rojo si no.
function drawPlacementPreview(x, y) {
  const scene = GameState.scene;
  if (!scene || !scene.previewGraphics) return;
  const g = scene.previewGraphics;
  g.clear();
  if (!GameState.selectedTower || y > GAME_HEIGHT) return;

  const def = TOWER_DEFS[GameState.selectedTower];
  const valid = isValidPlacement(x, y, GameState.selectedTower);
  const color = valid ? 0x4caf50 : 0xd93f3f;

  g.fillStyle(color, 0.10);
  g.fillCircle(x, y, def.range);
  g.lineStyle(2, color, 0.7);
  g.strokeCircle(x, y, def.range);
  g.fillStyle(color, 0.9);
  g.fillCircle(x, y, 6);
}

function clearPlacementPreview() {
  const scene = GameState.scene;
  if (scene && scene.previewGraphics) scene.previewGraphics.clear();
}

function selectPlacedTower(tower) {
  GameState.selectedTower = null;
  document.querySelectorAll('#buildButtons .btn').forEach(b => b.classList.remove('selected'));
  GameState.selectedPlacedTower = tower;
  showTowerPanel(tower);
}

function deselectPlacedTower() {
  GameState.selectedPlacedTower = null;
  hideTowerPanel();
}

function upgradeTower(tower) {
  if (tower.level >= MAX_TOWER_LEVEL) return;
  const cost = getUpgradeCost(tower.type, tower.level);
  if (GameState.gold < cost) return;

  GameState.gold -= cost;
  tower.invested += cost;
  tower.level += 1;
  updateHUD();
  updateLevelPips(tower);
  refreshTowerPanel(tower);

  // pequeño destello para notar la mejora
  const flash = GameState.scene.add.circle(tower.x, tower.y, 22, 0xf0c14b, 0.5);
  GameState.scene.tweens.add({ targets: flash, alpha: 0, scale: 1.6, duration: 250, onComplete: () => flash.destroy() });
}

function sellTower(tower) {
  const refund = Math.round(tower.invested * SELL_REFUND_RATIO);
  GameState.gold += refund;
  updateHUD();

  tower.visual.destroy();
  tower.range.destroy();
  if (tower.pips) tower.pips.destroy();
  GameState.towers = GameState.towers.filter(t => t !== tower);
  deselectPlacedTower();
}

function placeTower(x, y) {
  if (!GameState.selectedTower) return;
  if (!isValidPlacement(x, y, GameState.selectedTower)) return;
  const def = TOWER_DEFS[GameState.selectedTower];

  GameState.gold -= def.cost;
  updateHUD();

  const scene = GameState.scene;
  const visual = createTowerVisual(scene, x, y, GameState.selectedTower, def.color);
  const range = scene.add.circle(x, y, def.range, def.color, 0.06).setStrokeStyle(1, def.color, 0.25);

  const tower = {
    x, y, type: GameState.selectedTower, lastShot: 0, visual, range,
    level: 1, invested: def.cost,
  };
  GameState.towers.push(tower);
  updateLevelPips(tower);
}

// Dispara un proyectil que viaja visualmente hasta el objetivo y aplica
// el daño al llegar. El jefe (isBoss) es inmune al efecto de ralentización.
function shootAt(tower, enemy) {
  const scene = GameState.scene;
  const def = getEffectiveStats(tower);
  const targetX = enemy.x, targetY = enemy.y;

  const dist = Math.hypot(targetX - tower.x, targetY - tower.y);
  const travelSpeed = def.area ? 260 : 480;
  const duration = Math.max(90, (dist / travelSpeed) * 1000);

  let proj;
  if (def.area) {
    proj = scene.add.circle(tower.x, tower.y, 6, def.proj);
    scene.tweens.add({ targets: proj, scale: 1.3, duration: 220, yoyo: true, repeat: -1 });
  } else {
    const angle = Math.atan2(targetY - tower.y, targetX - tower.x);
    proj = scene.add.rectangle(tower.x, tower.y, 16, 3, def.proj).setRotation(angle);
  }

  scene.tweens.add({
    targets: proj,
    x: targetX,
    y: targetY,
    duration,
    ease: 'Linear',
    onComplete: () => {
      proj.destroy();
      if (def.area) {
        GameState.enemies.forEach(en => {
          if (Math.hypot(en.x - targetX, en.y - targetY) < AREA_BLAST_RADIUS) {
            damageEnemy(en, def.dmg);
          }
        });
        const ring = scene.add.circle(targetX, targetY, AREA_BLAST_RADIUS, def.proj, 0.15);
        scene.tweens.add({ targets: ring, alpha: 0, scale: 1.4, duration: 250, onComplete: () => ring.destroy() });
      } else {
        if (!enemy.dead) {
          damageEnemy(enemy, def.dmg);
          if (def.slow && !enemy.isBoss) enemy.slowUntil = scene.time.now + SLOW_DURATION_MS;
        }
        const flash = scene.add.circle(targetX, targetY, 8, def.proj, 0.5);
        scene.tweens.add({ targets: flash, alpha: 0, scale: 1.8, duration: 150, onComplete: () => flash.destroy() });
      }
    },
  });
}

function updateTowers(time) {
  for (const t of GameState.towers) {
    const stats = getEffectiveStats(t);
    if (time - t.lastShot < stats.rate) continue;

    let target = null, best = Infinity;
    for (const e of GameState.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - t.x, e.y - t.y);
      if (d <= stats.range && d < best) {
        best = d;
        target = e;
      }
    }
    if (target) {
      t.lastShot = time;
      shootAt(t, target);
    }
  }
}
