/* nature18.js — V8.18: Stylized Nature MegaKit (Quaternius, CC0).
   Camino de piedra con bordes, bosque denso en los límites del mapa y claro en la zona de juego,
   hierba / tréboles / flores, rocas y arbustos reales. Todo con InstancedMesh (una llamada de dibujo por pieza).
   Se carga antes de construir el mundo (NK.load); si algo falla, engine3d.js conserva las formas básicas de siempre. */
const NK = { ok: false, base: 'assets/nature/', src: {}, mats: {}, parts: {}, r: Math.random };

const NK_TREES = {
  common: ['CommonTree_1', 'CommonTree_2', 'CommonTree_3', 'CommonTree_4', 'CommonTree_5'],
  pine: ['Pine_1', 'Pine_2', 'Pine_3', 'Pine_4', 'Pine_5'],
  twisted: ['TwistedTree_1', 'TwistedTree_2', 'TwistedTree_3', 'TwistedTree_4', 'TwistedTree_5'],
  dead: ['DeadTree_1', 'DeadTree_2', 'DeadTree_3', 'DeadTree_4', 'DeadTree_5']
};
// Mezcla de árboles por mapa (el Bosque Maldito y la Fortaleza llevan más árboles secos y retorcidos).
const NK_FAM_W = {
  valle: { common: .62, pine: .30, twisted: .08, dead: 0 },
  paso: { common: .12, pine: .34, twisted: .20, dead: .34 },
  bosque: { common: .08, pine: .34, twisted: .28, dead: .30 },
  fortaleza: { common: .10, pine: .30, twisted: .10, dead: .50 }
};
// Colores por mapa: [hoja, brillo propio de hoja, pino, brillo pino, hierba, brillo hierba]
const NK_PAL = {
  valle: { leaf: 0xe6ffb8, leafE: 0x2f5f1c, pine: 0xb8f08a, pineE: 0x2a5a1c, grass: 0xdcffa6, grassE: 0x2a5214 },
  paso: { leaf: 0xcfc4e6, leafE: 0x2a2c4a, pine: 0xaebddb, pineE: 0x1f2c40, grass: 0xb9b3d0, grassE: 0x26283e },
  bosque: { leaf: 0xa3dc92, leafE: 0x1a3a16, pine: 0x84c47e, pineE: 0x143016, grass: 0x93c880, grassE: 0x183616 },
  fortaleza: { leaf: 0xc4c4b2, leafE: 0x2a2a22, pine: 0xaab2a2, pineE: 0x20261e, grass: 0xadb39d, grassE: 0x22261c }
};
const NK_HOUSES = {
  valle: [[740, 360], [740, 460], [740, 260]], paso: [[380, 40], [740, 260], [720, 460]],
  bosque: [[340, 40], [560, 320], [40, 440]], fortaleza: [[40, 40], [340, 40], [40, 240]]
};
const NK_RIVER = [[610, 500], [635, 470], [652, 445], [680, 420], [710, 402], [742, 392], [800, 388]];

/* ---------- Carga ---------- */
function nkKeys() {
  const id = CURRENT_MAP.id, w = NK_FAM_W[id] || NK_FAM_W.valle, k = [];
  for (const f in NK_TREES) if (w[f] > 0) k.push(...NK_TREES[f]);
  k.push('Bush_Common', 'Bush_Common_Flowers', 'Rock_Medium_1', 'Rock_Medium_2', 'Rock_Medium_3', 'Fern_1', 'Plant_1', 'Plant_7',
    'Mushroom_Common', 'Mushroom_Laetiporus', 'Pebble_Round_1', 'Pebble_Round_2', 'Pebble_Round_3', 'Pebble_Square_1', 'Pebble_Square_2', 'Pebble_Square_3',
    'RockPath_Round_Small_1', 'RockPath_Round_Small_2', 'RockPath_Round_Small_3', 'RockPath_Round_Thin', 'RockPath_Round_Wide',
    'RockPath_Square_Small_1', 'RockPath_Square_Small_2', 'RockPath_Square_Small_3', 'RockPath_Square_Thin', 'RockPath_Square_Wide',
    'Grass_Common_Short', 'Grass_Common_Tall', 'Grass_Wispy_Short', 'Grass_Wispy_Tall', 'Clover_1', 'Clover_2',
    'Flower_3_Group', 'Flower_4_Group', 'Flower_3_Single', 'Flower_4_Single');
  return k;
}
function nkLoad() {
  if (!window.THREE || !THREE.GLTFLoader) return Promise.resolve(false);
  const L = new THREE.GLTFLoader(), keys = nkKeys();
  return Promise.all(keys.map(k => new Promise(ok => {
    L.load(NK.base + k + '.gltf', g => { NK.src[k] = g; ok(true) }, undefined, e => { console.warn('Nature kit: pieza omitida', k, e); ok(false) });
  }))).then(res => {
    // Imprescindibles: camino, hierba y al menos un árbol. Si faltan, se usan las formas básicas.
    const need = ['RockPath_Round_Small_1', 'RockPath_Square_Small_1', 'Grass_Common_Short', 'Bush_Common', 'Rock_Medium_1'];
    NK.ok = need.every(k => NK.src[k]) && keys.some(k => /Tree|Pine/.test(k) && NK.src[k]);
    const idn = CURRENT_MAP.id; let s = 7919; for (const c of idn) s = (s * 31 + c.charCodeAt(0)) >>> 0;
    NK.r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; // aleatorio propio y estable por mapa
    return NK.ok;
  }).catch(e => { console.warn('Nature kit no disponible:', e); NK.ok = false; return false });
}

/* ---------- Materiales (mismo criterio que los árboles de siempre: Lambert + brillo propio) ---------- */
function nkMat(m) {
  const key = m.name || m.uuid;
  if (NK.mats[key]) return NK.mats[key];
  const pal = NK_PAL[CURRENT_MAP.id] || NK_PAL.valle, n = m.name || '';
  const o = { map: m.map, side: THREE.DoubleSide, color: 0xffffff, emissive: 0x151515 };
  if (m.map) m.map.anisotropy = 4;
  if (/Leaf_Pine|Pine/i.test(n)) { o.alphaTest = .2; o.color = pal.pine; o.emissive = pal.pineE }
  else if (/^Leaves_(Normal|Twisted)Tree/i.test(n)) { o.alphaTest = .1; o.color = pal.leaf; o.emissive = pal.leafE }
  else if (/^Leaves$/i.test(n)) { o.alphaTest = .35; o.color = pal.grass; o.emissive = pal.grassE }
  else if (/^Grass$/i.test(n)) { o.alphaTest = .3; o.color = pal.grass; o.emissive = pal.grassE }
  else if (/^Flowers$/i.test(n)) { o.alphaTest = .4; o.emissive = 0x2a2a2a }
  else if (/^Bark/i.test(n)) { o.alphaTest = .2; o.emissive = 0x1a0f08 }
  else if (/PathRocks/i.test(n)) { o.emissive = 0x1d1b18 }
  else if (/Rocks/i.test(n)) { o.emissive = 0x1a1a1a }
  else if (/Mushrooms/i.test(n)) { o.emissive = 0x222222 }
  const mt = new THREE.MeshLambertMaterial(o); mt.name = n;
  return NK.mats[key] = mt;
}
// Piezas de una malla del kit con su transformación ya aplicada (un árbol trae 2: tronco y hojas).
function nkParts(k) {
  if (NK.parts[k]) return NK.parts[k];
  const src = NK.src[k]; if (!src) return NK.parts[k] = [];
  src.scene.updateMatrixWorld(true);
  const out = [];
  src.scene.traverse(o => {
    if (!o.isMesh) return;
    const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    out.push({ geo: g, mat: nkMat(ms[0]) });
  });
  return NK.parts[k] = out;
}

/* ---------- Lotes instanciados ---------- */
function nkBatch() {
  const items = new Map();
  return {
    add(k, x, y, z, sx, sy, sz, ry, tint) { if (!NK.src[k]) return; let a = items.get(k); if (!a) items.set(k, a = []); a.push([x, y, z, sx, sy, sz, ry, tint]) },
    count() { let n = 0; items.forEach(a => n += a.length); return n },
    flush(opt = {}) {
      const dum = new THREE.Object3D(), col = new THREE.Color(), made = [];
      items.forEach((a, k) => {
        for (const p of nkParts(k)) {
          const im = new THREE.InstancedMesh(p.geo, p.mat, a.length);
          for (let i = 0; i < a.length; i++) {
            const q = a[i]; dum.position.set(q[0], q[1], q[2]); dum.rotation.set(0, q[6], 0); dum.scale.set(q[3], q[4], q[5]); dum.updateMatrix(); im.setMatrixAt(i, dum.matrix);
            if (q[7] != null) { col.setRGB(q[7], q[7], q[7]); im.setColorAt(i, col) }
          }
          im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
          im.frustumCulled = false; im.castShadow = !!opt.cast; im.receiveShadow = !!opt.receive;
          scene.add(im); made.push(im);
        }
      });
      return made;
    }
  };
}

/* ---------- Utilidades de colocación ---------- */
function nkRiverDist(x, z) {
  if (CURRENT_MAP.id !== 'valle') return 1e9;
  let m = 1e9;
  for (let i = 0; i < NK_RIVER.length - 1; i++) {
    const a = NK_RIVER[i], b = NK_RIVER[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz;
    let t = ((x - a[0]) * dx + (z - a[1]) * dz) / l2; t = Math.max(0, Math.min(1, t));
    m = Math.min(m, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t));
  }
  return m;
}
function nkHouses() {
  return (NK_HOUSES[CURRENT_MAP.id] || NK_HOUSES.valle).filter(c => distToPath(c[0], c[1]) > 70 && !(c[0] > 700 && c[1] < 230)).slice(0, 2);
}
// ¿El punto está libre para decorar? pad = margen extra respecto al camino.
function nkFree(x, z, roadPad, houses) {
  if (x > 690 && x < 870 && z > -40 && z < 262) return false;           // castillo y su explanada
  if (distToPath(x, z) < roadPad) return false;
  if (nkRiverDist(x, z) < 32) return false;
  for (const h of houses) if (Math.hypot(x - h[0], z - h[1]) < 62) return false;
  return true;
}
const nkPick = (arr, r) => arr[Math.min(arr.length - 1, (r * arr.length) | 0)];
const NK_HEAVY = /CommonTree_[12]$|DeadTree|TwistedTree/; // ~8-15 mil vértices: se reparten con menos frecuencia
function nkTreeKey(r1, r2, low) {
  const w = Object.assign({}, NK_FAM_W[CURRENT_MAP.id] || NK_FAM_W.valle);
  if (low) { w.common += w.twisted * .6; w.pine += w.twisted * .4; w.twisted = 0; w.dead *= .5 }
  let t = 0; for (const f in w) t += w[f];
  let a = r1 * t, fam = 'common'; for (const f in w) { if (a < w[f]) { fam = f; break } a -= w[f] }
  const list = NK_TREES[fam].filter(k => NK.src[k]); if (!list.length) return null;
  let key = nkPick(list, r2);
  if (NK_HEAVY.test(key) && NK.r() < .4) key = nkPick(list, NK.r());
  return { key, fam };
}
const NK_TREE_S = { common: [4.9, 2.5], pine: [4.6, 2.2], twisted: [2.3, .9], dead: [3.5, 1.5] };

/* ---------- Camino: tierra + piedras RockPath + borde ---------- */
function nkBuildRoad() {
  const P = PATH_POINTS, r = NK.r, low = !!S.lowPower, pc = CURRENT_MAP.pathCol;
  const flatGeo = (w, h) => { const g = new THREE.PlaneGeometry(w, h); g.rotateX(-Math.PI / 2); return g };
  const stones = [];
  const SM_R = ['RockPath_Round_Small_1', 'RockPath_Round_Small_2', 'RockPath_Round_Small_3'], SM_S = ['RockPath_Square_Small_1', 'RockPath_Square_Small_2', 'RockPath_Square_Small_3'];
  const kinds = [];
  for (const k of [...SM_R, ...SM_S]) kinds.push({ k, w: low ? 1 : .72, sz: 1.5 });
  if (!low) { kinds.push({ k: 'RockPath_Round_Thin', w: .07, sz: 2.1 }, { k: 'RockPath_Square_Thin', w: .07, sz: 2.1 }, { k: 'RockPath_Round_Wide', w: .06, sz: 2.1 }, { k: 'RockPath_Square_Wide', w: .06, sz: 2.1 }) }
  const wsum = kinds.reduce((a, b) => a + b.w, 0);
  const pickKind = () => { let a = r() * wsum; for (const q of kinds) { if (a < q.w) return q; a -= q.w } return kinds[0] };
  const B = nkBatch();
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[i], b = P[i + 1], dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), ang = Math.atan2(-dy, dx), cx = (a.x + b.x) / 2, cz = (a.y + b.y) / 2;
    // Dos capas de tierra planas (sin cajas): la ancha oscura hace de ribete, la estrecha es la calzada.
    const o1 = new THREE.Mesh(flatGeo(L + 78, 70), texturedMat(pc[0], 41 + i, 'road')); o1.position.set(cx, .46 + i * .012, cz); o1.rotation.y = ang; o1.receiveShadow = true; scene.add(o1);
    const o2 = new THREE.Mesh(flatGeo(L + 62, 54), texturedMat(pc[1], 71 + i, 'road')); o2.position.set(cx, .52 + i * .012, cz); o2.rotation.y = ang; o2.receiveShadow = true; scene.add(o2);
    // Piedras de la calzada: lanzamiento de dardos con rechazo por solape, cubriendo ~40 % de la tierra.
    const ux = dx / L, uz = dy / L, nx = -uz, nz = ux;
    const want = Math.floor((L + 54) * 54 * (low ? .26 : .40) / 150);
    for (let t = 0, n = 0; t < want * 5 && n < want; t++) {
      const u = -27 + r() * (L + 54), v = (r() - .5) * 46, q = pickKind(), s = (low ? 8.2 : 7.6) + r() * 2.4, rad = q.sz * s * .42;
      const x = a.x + ux * u + nx * v, z = a.y + uz * u + nz * v;
      if (distToPath(x, z) > 24.5) continue;
      let hit = false; for (const o of stones) { if (Math.hypot(o[0] - x, o[1] - z) < (o[2] + rad) * .92) { hit = true; break } }
      if (hit) continue;
      stones.push([x, z, rad]); n++;
      B.add(q.k, x, .66, z, s, s * (.5 + r() * .12), s, r() * 6.283, .86 + r() * .2);
    }
  }
  // Disco de tierra en cada esquina interior (redondea el giro, como antes).
  for (let i = 1; i < P.length - 1; i++) {
    const pt = P[i], g = new THREE.CircleGeometry(29, 32); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, texturedMat(pc[1], 90 + i, 'road')); m.position.set(pt.x, .70, pt.y); m.receiveShadow = true; scene.add(m);
  }
  // Borde: piedras alargadas siguiendo el camino + guijarros sueltos, en ambos lados y rodeando las esquinas.
  const thin = ['RockPath_Round_Small_1', 'RockPath_Round_Small_2', 'RockPath_Round_Small_3', 'RockPath_Square_Small_1', 'RockPath_Square_Small_2', 'RockPath_Square_Small_3'], peb = ['Pebble_Round_1', 'Pebble_Round_2', 'Pebble_Round_3', 'Pebble_Square_1', 'Pebble_Square_2', 'Pebble_Square_3'];
  const addEdge = (x, z, yaw) => {
    if (distToPath(x, z) < 27.5) return;
    const s = 7 + r() * 2.2, k = nkPick(thin, r()); B.add(k, x, .22, z, s, s * .9, s * (1.05 + r() * .25), yaw + (r() - .5) * .3, .84 + r() * .2);
    const np = low ? 1 : 2;
    for (let j = 0; j < np; j++) {
      const off = (r() < .5 ? -1 : 1) * (5 + r() * 7), along = (r() - .5) * 12, ps = 6 + r() * 6;
      const px = x + Math.sin(yaw) * along + Math.cos(yaw) * off, pz = z + Math.cos(yaw) * along - Math.sin(yaw) * off;
      if (distToPath(px, pz) < 27) continue;
      B.add(nkPick(peb, r()), px, .12, pz, ps, ps * .9, ps, r() * 6.283, .84 + r() * .22);
    }
  };
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[i], b = P[i + 1], dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), ux = dx / L, uz = dy / L, nx = -uz, nz = ux, yaw = Math.atan2(dx, dy);
    for (const side of [-1, 1]) for (let u = 0; u < L; u += (low ? 20 : 14.5)) {
      const v = side * (29 + r() * 2.5);
      addEdge(a.x + ux * (u + r() * 3) + nx * v, a.y + uz * (u + r() * 3) + nz * v, yaw);
    }
  }
  for (let i = 1; i < P.length - 1; i++) {
    const pt = P[i];
    for (let ang = 0; ang < 6.283; ang += (low ? .38 : .27)) {
      const rr = 30.5 + r() * 2, x = pt.x + Math.cos(ang) * rr, z = pt.y + Math.sin(ang) * rr;
      addEdge(x, z, Math.atan2(-Math.sin(ang), Math.cos(ang)));
    }
  }
  B.flush({ cast: false, receive: !low });
  return stones.length;
}

/* ---------- Bosque: denso en los bordes, claro en el centro ---------- */
function nkBuildForest() {
  const r = NK.r, low = !!S.lowPower, houses = nkHouses(), W = 800, H = 500;
  const depth = low ? 70 : 100, belt = 26, minD = low ? 33 : 29, tries = low ? 1000 : 2200, cell = minD;
  const grid = new Map(), pts = [], gk = (x, z) => Math.floor(x / cell) + ',' + Math.floor(z / cell);
  const weight = e => e < -belt ? 0 : e < 0 ? .5 + .5 * Math.pow(1 + e / belt, 1.5) : e < depth * .65 ? 1 : Math.max(.3, 1 - (e - depth * .65) / (depth * .35) * .7);
  const near = (x, z) => { const gx = Math.floor(x / cell), gz = Math.floor(z / cell); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const l = grid.get((gx + i) + ',' + (gz + j)); if (l) for (const p of l) if (Math.hypot(p[0] - x, p[1] - z) < minD) return true } return false };
  const B = nkBatch(), U = nkBatch();
  for (let t = 0; t < tries; t++) {
    const x = -depth + r() * (W + 2 * depth), z = -depth + r() * (H + 2 * depth);
    const ex = Math.max(-x, 0, x - W), ez = Math.max(-z, 0, z - H), e = (ex > 0 || ez > 0) ? Math.hypot(ex, ez) : -Math.min(x, W - x, z, H - z);
    if (r() > weight(e)) continue;
    if (x > 690 && x < 865 && z > -45 && z < 275) continue;
    if (distToPath(x, z) < 72 || nkRiverDist(x, z) < 38) continue;
    let bad = false; for (const h of houses) if (Math.hypot(x - h[0], z - h[1]) < 58) bad = true;
    if (bad || near(x, z)) continue;
    const a = grid.get(gk(x, z)) || []; a.push([x, z]); grid.set(gk(x, z), a); pts.push([x, z, e]);
  }
  let trees = 0;
  for (const p of pts) {
    const tk = nkTreeKey(r(), r(), low); if (!tk) continue;
    // Los árboles de muchos polígonos salen menos: se reparte por peso.
    const sc = NK_TREE_S[tk.fam], s = sc[0] + r() * sc[1];
    B.add(tk.key, p[0], .22 * s, p[1], s, s * (.92 + r() * .2), s, r() * 6.283, .82 + r() * .3); trees++;
    // Sotobosque pegado a los troncos.
    const q = r();
    if (q < .34) { const a = r() * 6.283, d = 9 + r() * 9, s2 = 6.5 + r() * 4.5; U.add(r() < .6 ? 'Bush_Common' : 'Bush_Common_Flowers', p[0] + Math.cos(a) * d, .22 * s2, p[1] + Math.sin(a) * d, s2, s2 * (.85 + r() * .3), s2, r() * 6.283, .8 + r() * .3) }
    else if (q < .46) { const a = r() * 6.283, d = 8 + r() * 10, s2 = 3 + r() * 2.8; U.add('Rock_Medium_' + (1 + ((r() * 3) | 0)), p[0] + Math.cos(a) * d, .1 * s2, p[1] + Math.sin(a) * d, s2, s2 * .85, s2, r() * 6.283, .85 + r() * .2) }
    else if (q < .56 && p[2] > -10) { const a = r() * 6.283, d = 6 + r() * 12, s2 = .9 + r() * .6; U.add('Fern_1', p[0] + Math.cos(a) * d, .1, p[1] + Math.sin(a) * d, s2, s2, s2, r() * 6.283, .8 + r() * .3) }
    else if (q < .62 && (CURRENT_MAP.id === 'bosque' || CURRENT_MAP.id === 'paso')) { const a = r() * 6.283, d = 7 + r() * 8, s2 = 6 + r() * 4; U.add(r() < .5 ? 'Mushroom_Common' : 'Mushroom_Laetiporus', p[0] + Math.cos(a) * d, .1, p[1] + Math.sin(a) * d, s2, s2, s2, r() * 6.283, null) }
  }
  B.flush({ cast: false, receive: !low });
  U.flush({ cast: false, receive: false });
  return trees;
}

// Árboles sueltos del claro (con balanceo del viento, como los de siempre): pocos y lejos del camino.
function nkLoneTrees(spots) {
  const r = NK.r, low = !!S.lowPower;
  spots.forEach((s, i) => {
    const tk = nkTreeKey(r(), r(), low); if (!tk) return;
    const sc = NK_TREE_S[tk.fam], k = sc[0] + r() * sc[1] * 1.1, g = new THREE.Group();
    for (const p of nkParts(tk.key)) { const m = new THREE.Mesh(p.geo, p.mat); m.castShadow = !low && i % 2 === 0; m.receiveShadow = true; g.add(m) }
    g.position.set(s.x, .22 * k, s.y); g.rotation.y = r() * 6.283; g.scale.setScalar(k); scene.add(g);
    (window.V8Trees = window.V8Trees || []).push({ g, ph: s.x * .013 + s.y * .021, pine: tk.fam === 'pine' });
  });
}

/* ---------- Hierba, tréboles, flores, helechos y plantas ---------- */
function nkBuildGround() {
  const r = NK.r, low = !!S.lowPower, id = CURRENT_MAP.id, lush = id === 'valle' || id === 'bosque', houses = nkHouses();
  const B = nkBatch(), P = PATH_POINTS;
  const N = {
    grass: low ? (lush ? 1000 : 520) : (lush ? 2400 : 1250), clover: lush ? (low ? 180 : 400) : (low ? 50 : 130),
    flower: lush ? (low ? 90 : 300) : 0, fern: low ? 10 : 22, plant: low ? 14 : 30
  };
  const clear = (x, z) => !(x > 718 && z < 245) && nkRiverDist(x, z) > 28 && !houses.some(h => Math.hypot(x - h[0], z - h[1]) < 40);
  const dens = (d, base, k) => base + (1 - base) * Math.exp(-(d - 33) / k);
  const grassKinds = [['Grass_Common_Short', .5, 5.2, 2.8], ['Grass_Common_Tall', .26, 4.6, 2.4], ['Grass_Wispy_Short', .13, 4.4, 2.6], ['Grass_Wispy_Tall', .11, 3.9, 2.2]];
  let gcount = 0;
  for (let t = 0; t < N.grass * 12 && gcount < N.grass; t++) {
    const x = 5 + r() * 790, z = 5 + r() * 490; if (!clear(x, z)) continue;
    const d = distToPath(x, z); if (d < 33) continue; if (r() > dens(d, .24, 42)) continue;
    let a = r(), kd = grassKinds[0]; for (const q of grassKinds) { if (a < q[1]) { kd = q; break } a -= q[1] }
    const s = kd[2] + r() * kd[3];
    B.add(kd[0], x, 0, z, s, s * (.8 + r() * .5), s, r() * 6.283, .8 + r() * .35); gcount++;
  }
  // Franja de hierba pegada al borde del camino.
  let fr = 0; const fringe = low ? 160 : 420;
  for (let i = 0; i < P.length - 1 && fr < fringe; i++) {
    const a = P[i], b = P[i + 1], dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), nx = -dy / L, nz = dx / L;
    for (const side of [-1, 1]) for (let u = 0; u < L && fr < fringe; u += (low ? 12 : 6.5) + r() * 3) {
      const off = 34 + r() * 6, x = a.x + dx * (u / L) + nx * side * off, z = a.y + dy * (u / L) + nz * side * off;
      if (!clear(x, z) || distToPath(x, z) < 32.5) continue;
      const s = 4.8 + r() * 3; B.add(r() < .55 ? 'Grass_Common_Tall' : 'Grass_Common_Short', x, 0, z, s, s * (.85 + r() * .5), s, r() * 6.283, .85 + r() * .3); fr++;
    }
  }
  // Tréboles en manchas.
  let cc = 0;
  for (let t = 0; t < N.clover * 12 && cc < N.clover; t++) {
    const x = 5 + r() * 790, z = 5 + r() * 490; if (!clear(x, z)) continue;
    const d = distToPath(x, z); if (d < 34) continue; if (r() > dens(d, .3, 55)) continue;
    const n = 1 + ((r() * 3) | 0);
    for (let j = 0; j < n && cc < N.clover; j++) { const s = 4.2 + r() * 3, cx = x + (r() - .5) * 14, cz = z + (r() - .5) * 14; if (distToPath(cx, cz) < 33) continue; B.add(r() < .7 ? 'Clover_1' : 'Clover_2', cx, 0, cz, s, s, s, r() * 6.283, .85 + r() * .25); cc++ }
  }
  // Flores en ramilletes alrededor de unos cuantos centros.
  if (N.flower) {
    const cs = [];
    for (let t = 0; t < 500 && cs.length < (low ? 14 : 30); t++) { const x = 20 + r() * 760, z = 20 + r() * 460; if (clear(x, z) && distToPath(x, z) > 44) cs.push([x, z]) }
    const fk = ['Flower_3_Group', 'Flower_4_Group', 'Flower_3_Single', 'Flower_4_Single'];
    let fc = 0;
    for (let t = 0; t < N.flower * 6 && fc < N.flower && cs.length; t++) {
      const c = nkPick(cs, r()), a = r() * 6.283, rad = Math.sqrt(r()) * 26, x = c[0] + Math.cos(a) * rad, z = c[1] + Math.sin(a) * rad;
      if (x < 5 || x > 795 || z < 5 || z > 495 || !clear(x, z) || distToPath(x, z) < 38) continue;
      const k = fk[(r() * 4) | 0], s = 4.4 + r() * 2.8; B.add(k, x, 0, z, s, s * (.85 + r() * .4), s, r() * 6.283, .9 + r() * .2); fc++;
    }
  }
  // Helechos y plantas bajas en el claro.
  for (const [key, n, s0, s1] of [['Fern_1', N.fern, .8, .7], ['Plant_1', N.plant, 5, 3], ['Plant_7', N.plant, 5, 3]]) {
    for (let t = 0, c = 0; t < n * 14 && c < n; t++) {
      const x = 10 + r() * 780, z = 10 + r() * 480; if (!clear(x, z) || distToPath(x, z) < 46) continue;
      const s = s0 + r() * s1; B.add(key, x, .1, z, s, s, s, r() * 6.283, .8 + r() * .3); c++;
    }
  }
  B.flush({ cast: false, receive: false });
  return B.count();
}

/* ---------- Rocas, arbustos y guijarros del campo ---------- */
function nkBuildProps(treeSpots) {
  const r = NK.r, low = !!S.lowPower, id = CURRENT_MAP.id, houses = nkHouses(), B = nkBatch();
  const rocks = ['Rock_Medium_1', 'Rock_Medium_2', 'Rock_Medium_3'];
  const rock = (x, z, s) => B.add(nkPick(rocks, r()), x, .1 * s, z, s, s * (.8 + r() * .35), s, r() * 6.283, .82 + r() * .25);
  const bush = (x, z, s) => B.add(r() < (id === 'valle' ? .45 : .22) ? 'Bush_Common_Flowers' : 'Bush_Common', x, .22 * s, z, s, s * (.85 + r() * .3), s, r() * 6.283, .82 + r() * .3);
  // Grupos de rocas con una grande y varias pequeñas.
  const groups = low ? 7 : 13;
  for (let t = 0, g = 0; t < 400 && g < groups; t++) {
    const x = 25 + r() * 750, z = 25 + r() * 450; if (!nkFree(x, z, 60, houses)) continue;
    const n = 1 + ((r() * 3) | 0); rock(x, z, 4 + r() * 2.8);
    for (let j = 1; j < n + 1; j++) { const a = r() * 6.283, d = 12 + r() * 12; rock(x + Math.cos(a) * d, z + Math.sin(a) * d, 2 + r() * 2) }
    g++;
  }
  // Grupos de arbustos.
  const bushG = low ? 9 : 17;
  for (let t = 0, g = 0; t < 500 && g < bushG; t++) {
    const x = 25 + r() * 750, z = 25 + r() * 450; if (!nkFree(x, z, 56, houses)) continue;
    const n = 2 + ((r() * 3) | 0);
    for (let j = 0; j < n; j++) { const a = r() * 6.283, d = j ? 9 + r() * 13 : 0; bush(x + Math.cos(a) * d, z + Math.sin(a) * d, 7 + r() * 5) }
    g++;
  }
  // Un arbusto o roca junto a cada árbol suelto.
  treeSpots.forEach((s, i) => { const a = r() * 6.283, d = 15 + r() * 8; if (i % 2) bush(s.x + Math.cos(a) * d, s.y + Math.sin(a) * d, 6 + r() * 4); else rock(s.x + Math.cos(a) * d, s.y + Math.sin(a) * d, 3 + r() * 2) });
  // Guijarros dispersos.
  const peb = ['Pebble_Round_1', 'Pebble_Round_2', 'Pebble_Round_3', 'Pebble_Square_1', 'Pebble_Square_2', 'Pebble_Square_3'];
  for (let t = 0, c = 0; t < 900 && c < (low ? 40 : 110); t++) {
    const x = 12 + r() * 776, z = 12 + r() * 476; if (!nkFree(x, z, 44, houses)) continue;
    const s = 5 + r() * 6; B.add(nkPick(peb, r()), x, .1, z, s, s * .9, s, r() * 6.283, .82 + r() * .25); c++;
  }
  // Setas en los mapas oscuros.
  if (id === 'bosque' || id === 'paso') for (let t = 0, c = 0; t < 300 && c < (low ? 8 : 22); t++) {
    const x = 20 + r() * 760, z = 20 + r() * 460; if (!nkFree(x, z, 50, houses)) continue;
    const s = 6 + r() * 4; B.add(r() < .5 ? 'Mushroom_Common' : 'Mushroom_Laetiporus', x, .1, z, s, s, s, r() * 6.283, null); c++;
  }
  // Rocas en la orilla del río del Valle y alrededor de la meta (antes eran dodecaedros).
  if (id === 'valle') for (let i = 0; i < 18; i++) { const t = i / 17, x = 610 + 190 * t, z = 500 - 112 * t + Math.sin(t * 11) * 8, side = i % 2 ? 1 : -1; rock(x + side * 4, z + side * 20, 2.4 + r() * 2.4) }
  for (let i = 0; i < 6; i++) { const s = 16 + i * 11, ang = i * 1.047; rock(742 + Math.cos(ang) * s, 150 + Math.sin(ang) * s, 2.6 + r() * 1.4) }
  B.flush({ cast: !low, receive: !low });
}
