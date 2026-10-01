// config.js
// Toda la configuración "de diseño" del juego vive aquí.
// Añadir una torre, un tipo de enemigo o ajustar el balance de mejoras
// solo requiere tocar este archivo.

const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;

// --- V4.1: mapas ---
// El mapa activo se guarda en localStorage y se aplica al cargar (cambiar de mapa recarga la página).
// El castillo está siempre en (775,150): todos los caminos terminan ahí.
const MAPS = {
  valle: { id: 'valle', name: 'Valle del Alba', desc: 'El camino clásico. Ideal para aprender.', hp: 1, crown: 1, gold: 0, unlock: null,
    ground: 0x3f6b2c, far: 0x2f5222, patches: [0x4a7a35, 0x35591f, 0x548540], pathCol: [0x5c4a2e, 0x9a7a4c],
    path: [{ x: -20, y: 250 }, { x: 150, y: 250 }, { x: 150, y: 80 }, { x: 420, y: 80 }, { x: 420, y: 430 }, { x: 660, y: 430 }, { x: 660, y: 150 }, { x: 840, y: 150 }] },
  paso: { id: 'paso', name: 'Paso del Eclipse', desc: 'Camino largo y sinuoso. Enemigos +20 % de vida, +50 oro iniciales y coronas ×1,5.', hp: 1.2, crown: 1.5, gold: 50, unlock: 'valle',
    ground: 0x4d4a58, far: 0x34313f, patches: [0x5a5668, 0x44414f, 0x625e72], pathCol: [0x3a3340, 0x7d6f8a],
    path: [{ x: -20, y: 430 }, { x: 180, y: 430 }, { x: 180, y: 260 }, { x: 60, y: 260 }, { x: 60, y: 70 }, { x: 300, y: 70 }, { x: 300, y: 340 }, { x: 500, y: 340 }, { x: 500, y: 90 }, { x: 660, y: 90 }, { x: 660, y: 150 }, { x: 840, y: 150 }] },
  bosque: { id: 'bosque', name: 'Bosque Maldito', desc: 'Senderos cerrados. +35 % de vida enemiga y +100 oro iniciales. Coronas ×2.', hp: 1.35, crown: 2, gold: 100, unlock: 'paso',
    ground: 0x29472b, far: 0x1c3320, patches: [0x315b31, 0x203d25, 0x3c6a37], pathCol: [0x4b3827, 0x856746],
    path: [{ x: -20, y: 110 }, { x: 120, y: 110 }, { x: 120, y: 390 }, { x: 300, y: 390 }, { x: 300, y: 150 }, { x: 470, y: 150 }, { x: 470, y: 420 }, { x: 650, y: 420 }, { x: 650, y: 150 }, { x: 840, y: 150 }] },
  fortaleza: { id: 'fortaleza', name: 'Fortaleza del Eclipse', desc: 'La última línea. +60 % de vida, +150 oro iniciales y coronas ×2,5.', hp: 1.6, crown: 2.5, gold: 150, unlock: 'bosque',
    ground: 0x3b3941, far: 0x242329, patches: [0x46444e, 0x323039, 0x514c57], pathCol: [0x39343a, 0x81706d],
    path: [{ x: -20, y: 360 }, { x: 130, y: 360 }, { x: 130, y: 90 }, { x: 290, y: 90 }, { x: 290, y: 430 }, { x: 450, y: 430 }, { x: 450, y: 230 }, { x: 570, y: 230 }, { x: 570, y: 70 }, { x: 690, y: 70 }, { x: 690, y: 150 }, { x: 840, y: 150 }] },
};
const MAP_KEY = 'defensa-castillo-map';
const CURRENT_MAP = (() => { try { return MAPS[localStorage.getItem(MAP_KEY)] || MAPS.valle; } catch (e) { return MAPS.valle; } })();
const PATH_POINTS = CURRENT_MAP.path;

// Definiciones de torres (estadísticas de nivel 1). Agregar una entrada
// aquí y un botón en index.html es suficiente para incorporar una torre.
const TOWER_DEFS = {
  basic: { name: 'Torre de Arqueros', cost: 50, range: 120, rate: 600, dmg: 18, color: 0x8b5a2b, proj: 0xf0c14b, dtype: 'pierce' },
  slow: { name: 'Torre del Hechicero', cost: 75, range: 100, rate: 900, dmg: 6, color: 0x4a6fa5, proj: 0x8ecfff, slow: true, dtype: 'magic' },
  area: { name: 'Catapulta', cost: 110, range: 95, rate: 1100, dmg: 14, color: 0x5c3d1f, proj: 0xd97a1f, area: true, dtype: 'siege' },
};

// Nombres/colores de los enemigos (V4.0 añade Plaga, Saboteador, Chamán y Espectro).
const ENEMY_TYPES = {
  goblin: { name: 'Ariete', color: 0x4caf50 },
  raider: { name: 'Balista Veloz', color: 0xd4af37 },
  ogre: { name: 'Torre de Asedio', color: 0x6a1b1b },
  brute: { name: 'Ogro Bruto', color: 0x7fa85f },
  swarm: { name: 'Plaga', color: 0xe0b341 },
  saboteur: { name: 'Saboteador', color: 0x6a6a96 },
  healer: { name: 'Chamán', color: 0x55d98a },
  wraith: { name: 'Espectro', color: 0x8fd3ff },
  boss: { name: 'Jefe', color: 0x8b0000 },
};

// Consejo que aparece la primera vez que sale cada enemigo nuevo.
const ENEMY_TIPS = {
  swarm: 'rápidos y numerosos: la catapulta los barre',
  brute: 'enorme, lento y muy resistente a las flechas: usa magia y catapulta',
  saboteur: 'desactiva las torres cercanas: elimínalo primero',
  healer: 'cura a los aliados a su alrededor: ¡prioridad!',
  wraith: 'resiste flechas y asedio: usa magia',
};

// Estadísticas base de cada enemigo (la vida crece con la oleada w).
const ENEMY_STATS = {
  goblin:   { hp: (w) => 30 + w * 8,  speed: 45, r: 11, reward: 5 },
  raider:   { hp: (w) => 30 + w * 8,  speed: 90, r: 11, reward: 6 },
  ogre:     { hp: (w) => 90 + w * 14, speed: 45, r: 16, reward: 12 },
  brute:    { hp: (w) => 110 + w * 16, speed: 38, r: 17, reward: 14 },
  swarm:    { hp: (w) => 10 + w * 3,  speed: 78, r: 7,  reward: 2 },
  saboteur: { hp: (w) => 40 + w * 9,  speed: 58, r: 11, reward: 9 },
  healer:   { hp: (w) => 55 + w * 10, speed: 40, r: 12, reward: 14 },
  wraith:   { hp: (w) => 60 + w * 11, speed: 55, r: 12, reward: 14 },
};

// Resistencias: fracción del daño que absorbe cada enemigo según el tipo de daño de la torre
// (pierce = flechas, magic = hechizos, siege = catapulta, snipe = francotirador, burn = fuego).
// Un valor negativo significa vulnerabilidad.
const RESIST = {
  ogre: { pierce: 0.3 },
  brute: { pierce: 0.25 },
  boss: { pierce: 0.2 },
  wraith: { pierce: 0.5, siege: 0.5, magic: -0.3 },
};

// --- Enemigos especiales ---
const HEAL_RADIUS = 70;      // radio de curación del Chamán
const HEAL_RATE = 0.04;      // fracción de vida máxima por segundo que cura a cada aliado
const SAB_RANGE = 80;        // alcance con el que el Saboteador desactiva torres
const SAB_COOLDOWN = 4500;   // ms entre sabotajes
const SAB_STUN_MS = 2800;    // ms que una torre queda desactivada

// Prioridades de objetivo que se pueden elegir por torre.
const TARGET_MODES = ['first', 'strong', 'close'];
const TARGET_LABELS = { first: 'PRIMERO', strong: 'MÁS FUERTE', close: 'MÁS CERCANO' };

// Composición determinista de cada oleada (permite mostrarla antes de empezar).
// Los enemigos nuevos aparecen por oleadas: plaga (3), saboteador (4), chamán (6), espectro (8).
function getWavePlan(w) {
  const n = 4 + w * 2;
  const raiders = w > 1 ? Math.round(n * 0.3) : 0;
  const ogres = w > 2 ? Math.round(n * 0.25) : 0;
  const brutes = w >= 4 ? Math.max(1, Math.round(n * 0.12)) : 0;
  const saboteurs = w >= 4 ? Math.max(1, Math.round(n * 0.1)) : 0;
  const healers = w >= 6 ? Math.max(1, Math.round(n * 0.08)) : 0;
  const wraiths = w >= 8 ? Math.max(1, Math.round(n * 0.12)) : 0;
  const swarm = w >= 3 ? Math.round(3 + w * 0.8) : 0;
  const goblins = Math.max(0, n - raiders - ogres - brutes - saboteurs - healers - wraiths);
  return {
    total: goblins + raiders + ogres + brutes + saboteurs + healers + wraiths + swarm,
    goblins, raiders, ogres, brutes, saboteurs, healers, wraiths, swarm,
    boss: w % BOSS_WAVE_INTERVAL === 0,
  };
}

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

// --- Victoria y ajustes de dificultad ---
const WIN_WAVE = 15;          // al superar esta oleada se gana (después se puede seguir en modo sin fin)
const BOSS_LEAK_DAMAGE = 5;   // vidas que cuesta que un jefe llegue al castillo (un enemigo normal cuesta 1)
// A partir de la oleada 10 los enemigos ganan vida extra para que el modo sin fin siga siendo un reto.
function getHpScale(wave) {
  return (1 + Math.max(0, wave - 10) * 0.2) * CURRENT_MAP.hp;
}

// --- Almacenamiento local (mejor racha y sonido) ---
const BEST_WAVE_KEY = 'defensa-castillo-best-wave';
const MUTE_KEY = 'defensa-castillo-muted';
function readBestWave() {
  try { return Number(localStorage.getItem(BEST_WAVE_KEY)) || 0; } catch (e) { return 0; }
}
function writeBestWave(wave) {
  try { if (wave > readBestWave()) localStorage.setItem(BEST_WAVE_KEY, String(wave)); } catch (e) { /* modo privado */ }
}

// =====================================================================
// V4.0 — Habilidades activas, especializaciones, jefes por fases
// =====================================================================

// --- Combate ---
const CRIT_CHANCE = 0.08;   // probabilidad base de golpe crítico de cualquier torre
const CRIT_MULT = 1.75;
const BURN_MS = 4000;       // duración de la quemadura
const CHAIN_RANGE = 70;     // distancia máxima de salto del rayo encadenado
const FREEZE_HIT_MS = 900;  // congelación del Hechicero Glacial

// --- Habilidades activas (cooldown en tiempo de juego, respetan pausa y ×2) ---
const SKILL_DEFS = {
  meteor: { name: 'Meteoro', icon: '☄', key: 'z', cd: 30000, radius: 85, dmg: 150, targeted: true, color: 0xff8a30,
            desc: 'Elige un punto del mapa: un meteoro daña y quema a todo en la zona.' },
  freeze: { name: 'Escarcha', icon: '❄', key: 'x', cd: 40000, dur: 3000, color: 0x9fe0ff,
            desc: 'Congela a todos los enemigos 3 s (los jefes solo se ralentizan).' },
  fury:   { name: 'Furia Real', icon: '⚡', key: 'c', cd: 45000, dur: 7000, mult: 1.7, color: 0xffd45a,
            desc: 'Todas las torres disparan un 70 % más rápido durante 7 s.' },
};

// --- Especializaciones de torre (al nivel máximo, dos caminos por torre) ---
// mul: multiplicadores sobre las estadísticas del nivel 3 (rate mayor = dispara más lento).
const SPEC_DEFS = {
  basic: [
    { id: 'sniper', name: 'Francotirador', icon: '◎', cost: 120, color: 0xffe27a,
      mul: { dmg: 2.4, range: 1.45, rate: 1.7 }, crit: 0.3, dtype: 'snipe',
      desc: 'Alcance +45 %, daño ×2,4, críticos 30 % e ignora armadura. Dispara más lento.' },
    { id: 'volley', name: 'Ráfaga', icon: '⇶', cost: 120, color: 0xf08a4b,
      mul: { dmg: 0.75, range: 1.05, rate: 0.85 }, multi: 3,
      desc: 'Dispara a 3 enemigos a la vez y algo más rápido.' },
  ],
  slow: [
    { id: 'frost', name: 'Glacial', icon: '❄', cost: 150, color: 0x9fe0ff,
      mul: { dmg: 1.25, range: 1.05, rate: 1 }, slowF: 0.2, slowDur: 2, slowBoss: 0.6, freezeEvery: 5,
      desc: 'Ralentiza mucho más y por más tiempo (también jefes). Cada 5 hechizos congela.' },
    { id: 'storm', name: 'Tormenta', icon: '⚡', cost: 150, color: 0xc9a6ff,
      mul: { dmg: 1.6, range: 1.1, rate: 1.1 }, chain: 4,
      desc: 'Lanza un rayo que salta entre 4 enemigos.' },
  ],
  area: [
    { id: 'bombard', name: 'Bombardera', icon: '✹', cost: 180, color: 0xff9a3a,
      mul: { dmg: 1.5, range: 1.1, rate: 1.35 }, blast: 1.6,
      desc: 'Explosión un 60 % mayor y daño ×1,5. Cadencia más lenta.' },
    { id: 'fire', name: 'Incendiaria', icon: '♨', cost: 180, color: 0xff5a2a,
      mul: { dmg: 1, range: 1, rate: 0.95 }, burn: 0.8,
      desc: 'Los proyectiles prenden fuego: quema 4 s a todos los alcanzados.' },
  ],
};
const specOf = (t) => (t.spec ? SPEC_DEFS[t.type].find((s) => s.id === t.spec) : null);

// --- Jefes por fases ---
// Cada jefe tiene fases que se activan al bajar de cierta fracción de vida (at).
// Entre fases queda invulnerable ~1,3 s. Acciones (do):
//   summon (refuerzos), elite (saboteadores + chamán), wraiths (espectros),
//   enrage (más veloz), shield (escudo que absorbe daño), stomp (pisotón periódico que aturde torres).
const BOSS_DEFS = [
  // Jefe dragón (wyvern animado). model = [clave del modelo, escala]; fly = vuela a media altura; hb = altura de la barra de vida.
  { name: 'Wyvern Ancestral', model: ['wyvernboss', 13], fly: true, hb: 66, tint: null, hpMul: 1.4, speed: 30, size: 90,
    phases: [
      { at: 0.7, title: 'CRÍAS', do: ['summon'] },
      { at: 0.4, title: 'FURIA DRACÓNICA', do: ['enrage', 'stomp'] },
      { at: 0.2, title: 'ESCAMAS ARCANAS', do: ['shield'] },
    ] },
  { name: 'Trabuquete Real', tint: null, hpMul: 1, speed: 28, size: 84,
    phases: [
      { at: 0.66, title: 'REFUERZOS', do: ['summon'] },
      { at: 0.33, title: 'FURIA', do: ['enrage', 'stomp'] },
    ] },
  { name: 'Coloso Blindado', tint: 0x5a78c8, hpMul: 1.35, speed: 26, size: 92,
    phases: [
      { at: 0.75, title: 'ESCUDO ARCANO', do: ['shield'] },
      { at: 0.5, title: 'LEGIÓN', do: ['elite'] },
      { at: 0.25, title: 'FURIA', do: ['enrage', 'shield'] },
    ] },
  { name: 'Señor del Eclipse', tint: 0x9a4bc0, hpMul: 1.7, speed: 30, size: 100,
    phases: [
      { at: 0.8, title: 'ESPECTROS', do: ['wraiths'] },
      { at: 0.55, title: 'TEMBLOR', do: ['stomp', 'shield'] },
      { at: 0.3, title: 'ECLIPSE', do: ['enrage', 'elite', 'wraiths'] },
    ] },
];
const getBossDef = (w) => BOSS_DEFS[(((Math.floor(w / BOSS_WAVE_INTERVAL) - 1) % BOSS_DEFS.length) + BOSS_DEFS.length) % BOSS_DEFS.length];
const STOMP_RANGE = 130;     // alcance del pisotón del jefe
const STOMP_STUN_MS = 2200;
const BOSS_SHIELD_FRAC = 0.22; // el escudo equivale a esta fracción de la vida máxima
