// state.js
// Estado mutable de una partida. Se agrupa en un solo objeto (GameState)
// en lugar de variables sueltas, para que sea fácil de resetear o depurar.

const GameState = {
  scene: null,
  ready: false,        // modelos 3D cargados
  started: false,      // se pulsó "Comenzar"
  over: false,         // hay un mensaje de victoria/derrota en pantalla
  continued: false,    // se eligió seguir tras la victoria (modo sin fin)
  selectedTower: null,
  selectedPlacedTower: null,
  gold: INITIAL_GOLD,
  lives: INITIAL_LIVES,
  lastGold: INITIAL_GOLD,
  lastLives: INITIAL_LIVES,
  wave: 0,
  kills: 0,
  totalDamage: 0,
  goldEarned: 0,
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
  // V4.0
  skills: { meteor: 0, freeze: 0, fury: 0 }, // instante (tiempo de juego) en que cada habilidad vuelve a estar lista
  selectedSkill: null,
  furyUntil: 0,
  seen: {},            // avisos ya mostrados (enemigos nuevos, sabotaje…)
};

// ¿Se puede interactuar con el mapa ahora mismo? (no en el menú, ni en pausa, ni con un mensaje final)
const canAct = () => GameState.started && !GameState.paused && !GameState.over;

// Expuesto en window: los parches v35–v40 acceden vía window.GameState (un const global no crea propiedad de window).
window.GameState = GameState;
