// config.js
// Toda la configuración "de diseño" del juego vive aquí.
// Añadir una torre, un tipo de enemigo o ajustar el balance de mejoras
// solo requiere tocar este archivo.

const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;

const PATH_POINTS = [
  { x: -20, y: 250 },
  { x: 150, y: 250 },
  { x: 150, y: 80 },
  { x: 420, y: 80 },
  { x: 420, y: 430 },
  { x: 660, y: 430 },
  { x: 660, y: 150 },
  { x: 840, y: 150 },
];

// Definiciones de torres (estadísticas de nivel 1). Agregar una entrada
// aquí y un botón en index.html es suficiente para incorporar una torre.
const TOWER_DEFS = {
  basic: { name: 'Torre de Arqueros', cost: 50, range: 120, rate: 600, dmg: 18, color: 0x8b5a2b, proj: 0xf0c14b },
  slow: { name: 'Torre del Hechicero', cost: 75, range: 100, rate: 900, dmg: 6, color: 0x4a6fa5, proj: 0x8ecfff, slow: true },
  area: { name: 'Catapulta', cost: 110, range: 95, rate: 1100, dmg: 14, color: 0x5c3d1f, proj: 0xd97a1f, area: true },
};

// Nombres/colores de las tropas enemigas, usados con fines temáticos.
const ENEMY_TYPES = {
  goblin: { name: 'Goblin', color: 0x4caf50 },
  raider: { name: 'Jinete Veloz', color: 0xd4af37 },
  ogre: { name: 'Ogro Acorazado', color: 0x6a1b1b },
  boss: { name: 'Rey Ogro', color: 0x8b0000 },
};

const INITIAL_GOLD = 150;
const INITIAL_LIVES = 20;
const MIN_TOWER_DISTANCE_TO_PATH = 38;
const MIN_TOWER_DISTANCE_TO_TOWER = 34;
const AREA_BLAST_RADIUS = 55;
const SLOW_DURATION_MS = 1500;
const SLOW_FACTOR = 0.45;

// --- Mejoras de torre ---
const MAX_TOWER_LEVEL = 3;
const SELL_REFUND_RATIO = 0.6;
const UPGRADE_COST_FACTOR = 0.9; // costo de mejora = cost base * este factor * nivel actual
const DMG_GROWTH = 1.35;   // por nivel
const RANGE_GROWTH = 1.08; // por nivel
const RATE_GROWTH = 0.9;   // por nivel (menor = dispara más rápido)

function getUpgradeCost(type, level) {
  const def = TOWER_DEFS[type];
  return Math.round(def.cost * UPGRADE_COST_FACTOR * level);
}

function getTowerStats(type, level) {
  const def = TOWER_DEFS[type];
  return {
    dmg: Math.round(def.dmg * Math.pow(DMG_GROWTH, level - 1)),
    range: Math.round(def.range * Math.pow(RANGE_GROWTH, level - 1)),
    rate: Math.round(def.rate * Math.pow(RATE_GROWTH, level - 1)),
  };
}

// --- Jefes ---
const BOSS_WAVE_INTERVAL = 5; // cada cuántas oleadas aparece un jefe
