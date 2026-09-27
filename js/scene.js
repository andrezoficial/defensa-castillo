// scene.js
// La escena de Phaser es deliberadamente "delgada": dibuja el mapa una vez
// (con ambientación medieval: pradera, camino de tierra y castillo) y en
// cada update() delega en updateTowers/updateEnemies/checkWaveComplete.

class MainScene extends Phaser.Scene {
  create() {
    GameState.scene = this;

    this.drawTerrain();
    this.drawDecorations();
    this.drawPath();
    this.drawCastle();

    // Gráfico reutilizable para la vista previa de rango al elegir torre.
    this.previewGraphics = this.add.graphics();

    this.input.on('pointerdown', (p) => {
      if (p.y > GAME_HEIGHT) return;
      if (GameState.selectedTower) { placeTower(p.x, p.y); drawPlacementPreview(p.x, p.y); return; }
      const tower = findTowerAt(p.x, p.y);
      if (tower) selectPlacedTower(tower); else deselectPlacedTower();
    });

    this.input.on('pointermove', (p) => {
      drawPlacementPreview(p.x, p.y);
    });

    updateHUD();
  }

  drawTerrain() {
    // Pradera base con parches de hierba oscura para dar textura, en vez
    // de un rectángulo plano.
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x2f4a24);
    const g = this.add.graphics();
    const rng = new Phaser.Math.RandomDataGenerator([42]);
    for (let i = 0; i < 140; i++) {
      const x = rng.between(0, GAME_WIDTH);
      const y = rng.between(0, GAME_HEIGHT);
      if (distToPath(x, y) < 40) continue;
      g.fillStyle(rng.pick([0x27401e, 0x35552a, 0x24391c]), 0.6);
      g.fillCircle(x, y, rng.between(3, 7));
    }
  }

  // Árboles, arbustos y rocas dispersos por la pradera, evitando el camino
  // y la zona del castillo, para que el mapa no se sienta vacío.
  drawDecorations() {
    const rng = new Phaser.Math.RandomDataGenerator([99]);
    const spots = [];
    let attempts = 0;
    while (spots.length < 14 && attempts < 400) {
      attempts++;
      const x = rng.between(20, 730);
      const y = rng.between(20, GAME_HEIGHT - 20);
      if (distToPath(x, y) < 55) continue;
      if (spots.some(s => Math.hypot(s.x - x, s.y - y) < 40)) continue;
      spots.push({ x, y });
    }
    spots.forEach((s) => {
      const kind = rng.pick(['tree', 'tree', 'bush', 'rock']);
      if (kind === 'tree') this.drawTree(s.x, s.y);
      else if (kind === 'bush') this.drawBush(s.x, s.y);
      else this.drawRock(s.x, s.y);
    });
  }

  drawTree(x, y) {
    this.add.ellipse(x, y + 14, 26, 10, 0x000000, 0.25);
    this.add.rectangle(x, y + 6, 6, 16, 0x4a3018);
    this.add.circle(x - 8, y - 6, 12, 0x2f4a24);
    this.add.circle(x + 8, y - 6, 12, 0x35552a);
    this.add.circle(x, y - 14, 13, 0x3f6633);
  }

  drawBush(x, y) {
    this.add.ellipse(x, y + 8, 20, 7, 0x000000, 0.2);
    this.add.circle(x - 6, y, 8, 0x2f4a24);
    this.add.circle(x + 6, y, 8, 0x35552a);
    this.add.circle(x, y - 4, 8, 0x3f6633);
  }

  drawRock(x, y) {
    this.add.ellipse(x, y + 6, 16, 6, 0x000000, 0.2);
    this.add.circle(x, y, 8, 0x6b6b73).setStrokeStyle(1, 0x3a3a40);
    this.add.circle(x - 3, y - 2, 3, 0x82828a, 0.6);
  }

  drawPath() {
    // Camino de tierra (en vez de un color de asfalto genérico), con un
    // borde de piedras sueltas para reforzar la ambientación.
    const g = this.add.graphics();
    g.lineStyle(46, 0x7a5a35, 1);
    g.beginPath();
    g.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y);
    for (let i = 1; i < PATH_POINTS.length; i++) g.lineTo(PATH_POINTS[i].x, PATH_POINTS[i].y);
    g.strokePath();

    g.lineStyle(50, 0x4a3520, 0.5);
    g.strokePath();

    // Piedrecillas dispersas sobre el camino.
    const rng = new Phaser.Math.RandomDataGenerator([7]);
    for (let i = 0; i < 60; i++) {
      const x = rng.between(0, GAME_WIDTH);
      const y = rng.between(0, GAME_HEIGHT);
      if (distToPath(x, y) < 20) {
        g.fillStyle(0x8f7a5a, 0.8);
        g.fillCircle(x, y, rng.between(1, 2));
      }
    }
  }

  drawCastle() {
    // Muralla, dos torreones y una bandera ondeante, en lugar de un
    // simple rectángulo con un emoji.
    const cx = 800, cy = 150;

    this.add.rectangle(cx, cy, 70, 100, 0x5a5a63).setStrokeStyle(3, 0x2a2a30);
    // almenas
    const g = this.add.graphics();
    g.fillStyle(0x5a5a63, 1);
    for (let i = -3; i <= 3; i++) g.fillRect(cx - 35 + i * 10, cy - 50 - 8, 6, 8);

    // torreones laterales
    this.add.rectangle(cx - 38, cy - 10, 22, 80, 0x4d4d55).setStrokeStyle(2, 0x2a2a30);
    this.add.rectangle(cx + 38, cy - 10, 22, 80, 0x4d4d55).setStrokeStyle(2, 0x2a2a30);
    this.add.triangle(cx - 38, cy - 60, -14, 12, 14, 12, 0, -18, 0x7a2e2e).setStrokeStyle(1, 0x2a2a30);
    this.add.triangle(cx + 38, cy - 60, -14, 12, 14, 12, 0, -18, 0x7a2e2e).setStrokeStyle(1, 0x2a2a30);

    // portón
    this.add.rectangle(cx, cy + 32, 20, 30, 0x3a2513).setStrokeStyle(2, 0x1a1108);

    // bandera dorada
    this.add.rectangle(cx, cy - 78, 2, 26, 0x3a2513);
    this.add.triangle(cx + 1, cy - 78, 0, 0, 16, 5, 0, 10, 0xf0c14b).setStrokeStyle(1, 0x8b5a2b);

    // antorchas parpadeantes a ambos lados del portón
    [cx - 24, cx + 24].forEach((tx) => {
      this.add.rectangle(tx, cy + 20, 4, 14, 0x3a2513);
      const flame = this.add.circle(tx, cy + 9, 5, 0xd97a1f);
      const glow = this.add.circle(tx, cy + 9, 9, 0xf0c14b, 0.25);
      this.tweens.add({
        targets: flame, scaleX: 0.7, scaleY: 1.3, alpha: 0.7,
        duration: 260 + Math.random() * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: glow, scale: 1.3, alpha: 0.1,
        duration: 320 + Math.random() * 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    });
  }

  update(time, delta) {
    updateTowers(time);
    updateEnemies(time, delta);
    checkWaveComplete();
  }
}

// Banner animado ("¡Oleada N!") que aparece al iniciar cada asalto, con
// una entrada elástica y un desvanecido hacia arriba.
function showWaveBanner(text) {
  const scene = GameState.scene;
  const banner = scene.add.text(GAME_WIDTH / 2, 70, text, {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: '26px',
    fontStyle: 'bold',
    color: '#f0c14b',
    stroke: '#2a1f14',
    strokeThickness: 4,
  }).setOrigin(0.5).setAlpha(0).setScale(0.7).setDepth(20);

  scene.tweens.add({
    targets: banner,
    alpha: 1,
    scale: 1,
    duration: 300,
    ease: 'Back.Out',
    onComplete: () => {
      scene.tweens.add({
        targets: banner,
        alpha: 0,
        y: 46,
        delay: 900,
        duration: 400,
        onComplete: () => banner.destroy(),
      });
    },
  });
}
