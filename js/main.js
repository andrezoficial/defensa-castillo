// main.js
// Punto de entrada único. Cualquier cosa nueva que arranque el juego
// (config de Phaser, listeners de la UI) se conecta desde aquí.

bindUIEvents();

const phaserConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'gameHost',
  backgroundColor: '#2f4a24',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: MainScene,
};

new Phaser.Game(phaserConfig);
