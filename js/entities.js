// entities.js
// Todo lo relativo a enemigos: creación, geometría de la ruta, daño,
// jefes con mecánica especial (invocan refuerzos) y efectos visuales.

function distToPath(px, py) {
  let min = Infinity;
  for (let i = 0; i < PATH_POINTS.length - 1; i++) {
    const a = PATH_POINTS[i], b = PATH_POINTS[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y, len2 = dx * dx + dy * dy;
    let t = len2 ? ((px - a.x) * dx + (py - a.y) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const cx = a.x + t * dx, cy = a.y + t * dy;
    const d = Math.hypot(px - cx, py - cy);
    if (d < min) min = d;
  }
  return min;
}

// Construye una pequeña silueta (torso + cabeza, con un detalle propio de
// cada tropa) en vez de un simple círculo de color. Incluye una sombra
// elíptica para dar sensación de peso sobre el terreno.
function createEnemyVisual(scene, x, y, radius, key, color) {
  const container = scene.add.container(x, y);
  const shadow = scene.add.ellipse(0, radius * 0.9, radius * 1.6, radius * 0.6, 0x000000, 0.25);
  const body = scene.add.circle(0, 4, radius, color).setStrokeStyle(2, 0x1a1108, 0.6);
  const head = scene.add.circle(0, -radius * 0.55, radius * 0.5, 0xe8d4a8).setStrokeStyle(1, 0x1a1108, 0.5);
  container.add([shadow, body, head]);

  if (key === 'raider') {
    const cape = scene.add.triangle(0, radius * 0.2, -radius, radius * 1.3, radius, radius * 1.3, 0, -radius * 0.2, 0xd4af37, 0.55);
    container.addAt(cape, 0);
  }
  if (key === 'ogre') {
    const spike = scene.add.triangle(0, -radius * 1.05, -5, 0, 5, 0, 0, -9, 0x2a2a30);
    container.add(spike);
  }
  if (key === 'boss') {
    // corona dorada de tres puntas para distinguir al jefe a simple vista
    const crown = scene.add.triangle(0, -radius * 1.15, -12, 4, 12, 4, 0, -12, 0xf0c14b).setStrokeStyle(1, 0x8b5a2b);
    const jewel = scene.add.circle(0, -radius * 1.05, 3, 0xd93f3f);
    container.add([crown, jewel]);
  }
  return container;
}

// Pequeño estallido de partículas al morir un enemigo.
function spawnDeathBurst(scene, x, y, color) {
  const count = 6;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const dist = 14 + Math.random() * 10;
    const p = scene.add.circle(x, y, 3, color);
    scene.tweens.add({
      targets: p,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      alpha: 0,
      scale: 0.3,
      duration: 380,
      ease: 'Cubic.easeOut',
      onComplete: () => p.destroy(),
    });
  }
}

function makeEnemy(key, x, y, wpIndex, hp, speed, radius, reward) {
  const scene = GameState.scene;
  const type = ENEMY_TYPES[key];
  const sprite = createEnemyVisual(scene, x, y, radius, key, type.color);
  const bar = scene.add.rectangle(x, y - radius - 8, radius * 2, 4, 0x00ff66).setOrigin(0.5);
  const enemy = {
    sprite, bar, hp, maxHp: hp, speed, baseSpeed: speed,
    wpIndex, x, y, radius, slowUntil: 0,
    color: type.color, reward,
    isBoss: key === 'boss',
    bobSeed: Math.random() * Math.PI * 2,
  };
  GameState.enemies.push(enemy);
  return enemy;
}

function spawnEnemy(fast, tank) {
  const hp = tank ? 90 + GameState.wave * 14 : 30 + GameState.wave * 8;
  const speed = fast ? 90 : 45;
  const radius = tank ? 16 : 11;
  const key = tank ? 'ogre' : (fast ? 'raider' : 'goblin');
  const reward = tank ? 12 : (fast ? 6 : 5);
  const start = PATH_POINTS[0];
  return makeEnemy(key, start.x, start.y, 0, hp, speed, radius, reward);
}

// Jefe: mucha más vida, inmune a la ralentización (ver towers.js) y con
// una mecánica especial: al bajar de la mitad de su vida, invoca 2 goblins
// justo a su lado, que siguen avanzando desde ese punto del camino.
function spawnBoss() {
  const wave = GameState.wave;
  const hp = 320 + wave * 45;
  const start = PATH_POINTS[0];
  const boss = makeEnemy('boss', start.x, start.y, 0, hp, 28, 24, 40 + wave * 5);
  boss.summonedReinforcements = false;
  return boss;
}

function spawnMinionAt(x, y, wpIndex) {
  const hp = 20 + GameState.wave * 5;
  makeEnemy('goblin', x, y, wpIndex, hp, 45, 11, 5);
}

function damageEnemy(enemy, dmg) {
  if (enemy.dead) return;
  enemy.hp -= dmg;

  if (enemy.isBoss && !enemy.summonedReinforcements && enemy.hp > 0 && enemy.hp <= enemy.maxHp * 0.5) {
    enemy.summonedReinforcements = true;
    spawnMinionAt(enemy.x - 22, enemy.y, enemy.wpIndex);
    spawnMinionAt(enemy.x + 22, enemy.y, enemy.wpIndex);
    GameState.scene.cameras.main.shake(180, 0.008);
  }

  if (enemy.hp <= 0) {
    enemy.dead = true;
    GameState.gold += enemy.reward;
    updateHUD();
    spawnDeathBurst(GameState.scene, enemy.x, enemy.y, enemy.color);
    if (enemy.isBoss) GameState.scene.cameras.main.shake(220, 0.012);
    enemy.sprite.destroy();
    enemy.bar.destroy();
  }
}

function killEnemyOffPath(enemy) {
  enemy.dead = true;
  enemy.sprite.destroy();
  enemy.bar.destroy();
}

function updateEnemies(time, delta) {
  for (const e of GameState.enemies) {
    if (e.dead) continue;
    const spd = (e.slowUntil > time ? e.baseSpeed * SLOW_FACTOR : e.baseSpeed) * (delta / 1000);
    const wp = PATH_POINTS[e.wpIndex + 1];

    if (!wp) {
      GameState.lives -= 1;
      updateHUD();
      GameState.scene.cameras.main.shake(80, 0.004);
      killEnemyOffPath(e);
      if (GameState.lives <= 0) showGameOver(false);
      continue;
    }

    const dx = wp.x - e.x, dy = wp.y - e.y, dist = Math.hypot(dx, dy);
    if (dist < 4) {
      e.wpIndex++;
    } else {
      e.x += dx / dist * spd;
      e.y += dy / dist * spd;
    }

    // Pequeño balanceo vertical al caminar, distinto para cada enemigo.
    const bob = Math.sin(time / 150 + e.bobSeed) * 1.6;
    e.sprite.setPosition(e.x, e.y + bob);
    e.bar.setPosition(e.x, e.y - e.radius - 8 + bob * 0.5);

    // La barra de vida cambia de color según el porcentaje restante.
    const ratio = e.hp / e.maxHp;
    e.bar.setFillStyle(ratio < 0.3 ? 0xe0455a : (ratio < 0.6 ? 0xf0c14b : 0x00ff66));
    e.bar.width = ratio * e.radius * 2;
  }
  GameState.enemies = GameState.enemies.filter(e => !e.dead);
}

function startWave() {
  if (GameState.waveActive) return;
  GameState.wave++;
  GameState.waveActive = true;
  GameState.spawning = true;

  const isBossWave = GameState.wave % BOSS_WAVE_INTERVAL === 0;
  toggleBossTag(isBossWave);
  showWaveBanner(isBossWave ? `👑 Oleada ${GameState.wave}: ¡EL REY OGRO! 👑` : `⚔️ Oleada ${GameState.wave}`);
  updateHUD();

  const count = 4 + GameState.wave * 2;
  let spawned = 0;
  GameState.scene.time.addEvent({
    delay: 550,
    repeat: count - 1,
    callback: () => {
      spawned++;
      const fast = GameState.wave > 1 && Math.random() < 0.3;
      const tank = GameState.wave > 2 && Math.random() < 0.25;
      spawnEnemy(fast, tank);
      if (spawned >= count) {
        if (isBossWave) {
          GameState.scene.time.delayedCall(900, () => {
            spawnBoss();
            GameState.spawning = false;
          });
        } else {
          GameState.spawning = false;
        }
      }
    },
  });
}

function checkWaveComplete() {
  if (GameState.waveActive && !GameState.spawning && GameState.enemies.length === 0) {
    GameState.waveActive = false;
    GameState.gold += 25 + GameState.wave * 3;
    toggleBossTag(false);
    updateHUD();
  }
}
