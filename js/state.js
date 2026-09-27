// state.js
// Estado mutable de una partida. Se agrupa en un solo objeto (GameState)
// en lugar de variables sueltas, para que sea fácil de resetear o depurar.

const GameState = {
  scene: null,
  selectedTower: null,
  selectedPlacedTower: null,
  gold: INITIAL_GOLD,
  lives: INITIAL_LIVES,
  lastGold: INITIAL_GOLD,
  lastLives: INITIAL_LIVES,
  wave: 0,
  waveActive: false,
  spawning: false,
  paused: false,
  speedMultiplier: 1,
  towers: [],
  enemies: [],
  buildSlots: [],
  placementDragging: false,
  placementPointerId: null,
  placementX: 0,
  placementY: 0,
};

function resetState() {
  GameState.scene = null;
  GameState.selectedTower = null;
  GameState.selectedPlacedTower = null;
  GameState.gold = INITIAL_GOLD;
  GameState.lives = INITIAL_LIVES;
  GameState.lastGold = INITIAL_GOLD;
  GameState.lastLives = INITIAL_LIVES;
  GameState.wave = 0;
  GameState.waveActive = false;
  GameState.spawning = false;
  GameState.paused = false;
  GameState.speedMultiplier = 1;
  GameState.towers = [];
  GameState.enemies = [];
}
