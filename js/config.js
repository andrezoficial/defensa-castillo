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

// Nombres/colores de las máquinas de asedio enemigas, usados con fines temáticos.
const ENEMY_TYPES = {
  goblin: { name: 'Ariete', color: 0x4caf50 },
  raider: { name: 'Balista Veloz', color: 0xd4af37 },
  ogre: { name: 'Torre de Asedio', color: 0x6a1b1b },
  boss: { name: 'Trabuquete Real', color: 0x8b0000 },
};

// --- Sprites (Kenney Castle Kit, CC0) ---
// Modelos 3D del kit renderizados a PNG (ver assets/kenney/). Cada imagen está a 2x de resolución
// y se dibuja con SPRITE_SCALE (0.5) para verse nítida. ox/oy = punto de apoyo en el suelo (0-1).
const SPRITE_SCALE = 0.5;
const SPRITES = {
  tower_archer: { file: 'tower_archer.png', ox: 0.5036, oy: 0.8769 },
  tower_wizard: { file: 'tower_wizard.png', ox: 0.5047, oy: 0.8728 },
  tower_catapult: { file: 'tower_catapult.png', ox: 0.517, oy: 0.7154 },
  enemy_ram: { file: 'enemy_ram.png', ox: 0.5131, oy: 0.7642 },
  enemy_ballista: { file: 'enemy_ballista.png', ox: 0.4155, oy: 0.8506 },
  enemy_siegetower: { file: 'enemy_siegetower.png', ox: 0.5103, oy: 0.8443 },
  enemy_trebuchet: { file: 'enemy_trebuchet.png', ox: 0.5581, oy: 0.8237 },
};
// Qué imagen y escala usa cada tipo de enemigo (máquinas de asedio que avanzan hacia el castillo).
// Todas las imágenes miran hacia la derecha; scene/entities las voltean según la dirección.
const ENEMY_SPRITE_DEFS = {
  goblin: { tex: 'enemy_ram', scale: 1 },          // Ariete
  raider: { tex: 'enemy_ballista', scale: 1 },     // Balista (rápida)
  ogre:   { tex: 'enemy_siegetower', scale: 1.05 },// Torre de asedio (acorazada)
  boss:   { tex: 'enemy_trebuchet', scale: 1 },    // Trabuquete (jefe)
};

const INITIAL_GOLD = 150;
const INITIAL_LIVES = 20;
const MIN_TOWER_DISTANCE_TO_PATH = 38;
const MIN_TOWER_DISTANCE_TO_TOWER = 34;
const AREA_BLAST_RADIUS = 55;
const SLOW_DURATION_MS = 1500;
const SLOW_FACTOR = 0.45;

// --- Casillas fijas de construcción ---
// Las torres ya no se colocan libremente: se "enganchan" a una grilla de
// posiciones fijas separadas BUILD_GRID_SIZE px, así nunca queda una
// torre montada sobre otra ni pegada al camino.
const BUILD_GRID_SIZE = 40;
const BUILD_SNAP_MAX_DIST = 90; // si el clic queda más lejos que esto de cualquier casilla, no hace nada

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
