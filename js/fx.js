// fx.js — V4.0: efectos de combate (números de daño, explosiones, rayos, estados, muertes).
// Reutiliza los ayudantes de engine3d.js (S, scene, geo, bmat, tmat, flat, addFx, later, burst, ringFx, partPool).

const iceMat = tmat(0xbfeaff, 0.42);
const rnd = (a = 1) => (Math.random() - 0.5) * a;

// Luz puntual única (siempre en la escena, para no recompilar shaders) que parpadea en explosiones.
function initFx4() {
  S.fl = new THREE.PointLight(0xffa040, 0, 300);
  S.fl.position.set(400, 30, 250);
  scene.add(S.fl);
  S.flTok = 0;
  S.scorch = [];
  S.pops = 0;
}

function flashLight(x, z, color, intensity, ms) {
  if (!S.fl) return;
  const tok = ++S.flTok;
  S.fl.position.set(x, 32, z);
  S.fl.color.setHex(color);
  addFx(ms, (p) => { if (tok === S.flTok) S.fl.intensity = intensity * (1 - p); },
    () => { if (tok === S.flTok) S.fl.intensity = 0; });
}

// Destello de pantalla (tiempo real, CSS).
function flashScreen(color, alpha, ms) {
  let d = S.flashEl;
  if (!d) {
    d = S.flashEl = document.createElement('div');
    d.style.cssText = 'position:absolute;inset:0;z-index:4;pointer-events:none;opacity:0';
    host.appendChild(d);
  }
  d.style.transition = 'none';
  d.style.background = color;
  d.style.opacity = alpha;
  void d.offsetWidth;
  d.style.transition = `opacity ${ms}ms ease-out`;
  d.style.opacity = 0;
}

// Chispa estática que se encoge (estelas de proyectiles, brasas, destellos).
function spark(x, y, z, color, ms = 260, sz = 1) {
  if (S.fx.length > 320) return;
  const m = partPool.pop() || new THREE.Mesh(geo('Sphere', 1.6, 6, 6), bmat(color));
  m.material = bmat(color);
  m.position.set(x, y, z);
  m.scale.setScalar(sz);
  scene.add(m);
  addFx(ms, (p) => m.scale.setScalar(Math.max(0.01, sz * (1 - p))), () => { scene.remove(m); partPool.push(m); });
}

// Partícula que sube (espíritus, curación).
function rise(x, y, z, color, ms = 800, h = 50) {
  if (S.fx.length > 320) return;
  const m = partPool.pop() || new THREE.Mesh(geo('Sphere', 1.6, 6, 6), bmat(color));
  m.material = bmat(color);
  m.position.set(x, y, z);
  scene.add(m);
  const sx = rnd(8);
  addFx(ms, (p) => { m.position.set(x + sx * p, y + p * h, z); m.scale.setScalar(Math.max(0.01, 1.3 * (1 - p))); },
    () => { scene.remove(m); partPool.push(m); });
}

// Onda expansiva fina en el suelo.
function waveFx(x, z, color, r, ms, y = 2.2) {
  const m = flat(new THREE.Mesh(geo('Ring', 0.9, 1, 48), tmat(color, 0.75)));
  m.position.set(x, y, z);
  scene.add(m);
  addFx(ms, (p) => { m.scale.setScalar(Math.max(2, r * p)); m.material.opacity = 0.75 * (1 - p); },
    () => { scene.remove(m); m.material.dispose(); });
}

function smoke(x, z, r) {
  if (S.fx.length > 260) return;
  const m = new THREE.Mesh(geo('Sphere', 1, 8, 6), tmat(0x575047, 0.45));
  m.position.set(x, 6, z);
  scene.add(m);
  addFx(800 + Math.random() * 300, (p) => {
    m.scale.setScalar(r * (0.6 + p * 1.4));
    m.position.y = 6 + p * 28;
    m.material.opacity = 0.45 * (1 - p);
  }, () => { scene.remove(m); m.material.dispose(); });
}

// Marca de quemado en el suelo que se desvanece.
function scorch(x, z, r) {
  const m = flat(new THREE.Mesh(geo('Circle', 1, 20), tmat(0x1d140c, 0.5)));
  m.position.set(x, 1.45, z);
  m.scale.set(r, r, 1);
  m.rotation.z = Math.random() * 6.28;
  scene.add(m);
  S.scorch.push(m);
  if (S.scorch.length > 22) { const o = S.scorch.shift(); scene.remove(o); o.material.dispose(); }
  addFx(5000, (p) => { m.material.opacity = 0.5 * (1 - p); },
    () => { scene.remove(m); m.material.dispose(); const i = S.scorch.indexOf(m); if (i >= 0) S.scorch.splice(i, 1); });
}

// Explosión: bola de fuego, onda, escombros, humo, luz y marca en el suelo.
// size: 'sm' (catapulta), 'lg' (bombardera/meteoro), 'xl' (jefe/meteoro).
function explosionFx(x, z, R, size = 'sm', fire = false) {
  const big = size === 'lg' || size === 'xl', xl = size === 'xl';
  const core = new THREE.Mesh(geo('Sphere', 1, 12, 10), tmat(0xffb347, 0.95));
  const core2 = new THREE.Mesh(geo('Sphere', 1, 10, 8), tmat(0xfff2c0, 0.95));
  core.position.set(x, 6, z);
  core2.position.copy(core.position);
  scene.add(core, core2);
  const rr = R * (xl ? 0.75 : big ? 0.6 : 0.45), life = xl ? 520 : 380;
  addFx(life, (p) => {
    const s = Math.max(0.01, rr * Math.sin(Math.min(1, p * 1.4) * Math.PI / 2) * (1 - p * 0.25));
    core.scale.setScalar(s);
    core.position.y = 4 + s * 0.35;
    core2.scale.setScalar(Math.max(0.01, s * 0.55 * (1 - p)));
    core2.position.y = core.position.y;
    core.material.opacity = 0.95 * (1 - p);
    core2.material.opacity = 0.95 * (1 - p);
  }, () => { scene.remove(core, core2); core.material.dispose(); core2.material.dispose(); });
  waveFx(x, z, 0xffc070, R * 1.05, life);
  burst(x, 6, z, 0xffa040, big ? 16 : 9, big ? 90 : 55);
  burst(x, 6, z, 0x3a2a1c, big ? 9 : 5, big ? 65 : 40);
  for (let i = 0, n = xl ? 6 : big ? 4 : 2; i < n; i++) smoke(x + rnd(R * 0.7), z + rnd(R * 0.7), 10 + Math.random() * 10);
  scorch(x, z, R * (xl ? 0.7 : 0.5));
  if (fire || xl) for (let i = 0; i < 7; i++) spark(x + rnd(R * 0.6), 8, z + rnd(R * 0.6), 0xff6a20, 600, 1);
  flashLight(x, z, 0xffa040, xl ? 2.4 : big ? 1.6 : 0.9, xl ? 380 : 260);
}

// Rayo con trazo irregular a través de una lista de puntos (THREE.Vector3).
function lightningFx(pts, color) {
  for (let k = 0; k < 2; k++) {
    const v = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], n = 6;
      for (let j = 0; j <= n; j++) {
        const f = j / n, jit = (j === 0 || j === n) ? 0 : (k ? 5 : 9);
        v.push(a.x + (b.x - a.x) * f + rnd(jit), a.y + (b.y - a.y) * f + rnd(jit * 0.6), a.z + (b.z - a.z) * f + rnd(jit));
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    const m = new THREE.LineBasicMaterial({ color: k ? 0xffffff : color, transparent: true, opacity: 1 });
    const l = new THREE.Line(g, m);
    l.frustumCulled = false;
    scene.add(l);
    addFx(k ? 140 : 200, (p) => { m.opacity = 1 - p; }, () => { scene.remove(l); g.dispose(); m.dispose(); });
  }
  const last = pts[pts.length - 1];
  spark(last.x, last.y, last.z, 0xffffff, 200, 2.2);
}

// Número de daño flotante. Agrupa golpes seguidos al mismo enemigo para no saturar el DOM.
function damageNumber(e, amt, o = {}) {
  if (!Settings.get('dmg')) return;
  if (S.pops > 26 && !o.crit && !o.force) return;
  const now = performance.now();
  e.popAcc = (e.popAcc || 0) + amt;
  if (!o.crit && !o.force && now - (e.popT || 0) < (o.tick ? 450 : 130)) return;
  const v = Math.round(e.popAcc);
  e.popAcc = 0;
  if (v < 1) return;
  e.popT = now;
  const p = new THREE.Vector3(e.x + rnd(14), (e.hb || 40) * 0.9, e.y).project(cam);
  if (p.z > 1) return;
  const d = document.createElement('div');
  d.className = 'dmg-pop' + (o.crit ? ' crit' : '') + (o.tick ? ' burn' : '') + (o.soak ? ' soak' : '');
  d.textContent = o.crit ? `¡${v}!` : v;
  d.style.left = ((p.x * 0.5 + 0.5) * host.clientWidth) + 'px';
  d.style.top = ((-p.y * 0.5 + 0.5) * host.clientHeight) + 'px';
  host.appendChild(d);
  S.pops++;
  d.addEventListener('animationend', () => { d.remove(); S.pops--; });
}

function freezeEnemy(e, ms) {
  e.freezeUntil = Math.max(e.freezeUntil || 0, S.now + ms);
  burst(e.x, 16, e.y, 0xbfeaff, 8, 35);
  sfx.freeze();
}

// Muerte específica de cada tipo de enemigo.
function deathFx(e) {
  const k = e.key;
  burst(e.x, 10, e.y, e.color, k === 'swarm' ? 6 : 14, 45);
  if (k === 'wraith') {
    for (let i = 0; i < 8; i++) rise(e.x + rnd(14), 10 + Math.random() * 10, e.y + rnd(14), 0x9fe0ff, 700 + Math.random() * 400, 55);
  } else if (k === 'healer') {
    waveFx(e.x, e.y, 0x55ff99, 60, 500);
    for (let i = 0; i < 6; i++) rise(e.x + rnd(16), 8, e.y + rnd(16), 0x66ff99, 700, 45);
  } else if (k === 'saboteur') {
    explosionFx(e.x, e.y, 38, 'sm');
  } else if (e.isBoss) {
    S.shake = 14;
    S.slow = 700;
    flashScreen('#fff2c0', 0.5, 500);
    explosionFx(e.x, e.y, 150, 'xl');
    ringFx(e.x, e.y, 0xf4d487, 110, 650);
    burst(e.x, 20, e.y, 0xe7bd5b, 30, 95);
    later(160, () => waveFx(e.x, e.y, 0xffe9a6, 190, 600));
    later(320, () => waveFx(e.x, e.y, 0xffc070, 240, 700));
  }
  if (e.burnUntil > S.now) for (let i = 0; i < 4; i++) spark(e.x + rnd(12), 10, e.y + rnd(12), 0xff7a2a, 500, 1.1);
}

// Aspecto por fotograma: destello al golpear, hielo, quemadura, furia del jefe.
function updateEnemyLook(e, time, dt) {
  let r = 0, g = 0, b = 0;
  if (e.flash > 0) { r = g = b = 0.55 * (e.flash / 90); }
  const frozen = e.freezeUntil > time, slowed = e.slowUntil > time, burning = e.burnUntil > time;
  if (frozen) { r = Math.max(r, 0.2); g = Math.max(g, 0.35); b = Math.max(b, 0.5); }
  else if (slowed) { g = Math.max(g, 0.1); b = Math.max(b, 0.28); }
  if (burning) { r = Math.max(r, 0.4 + 0.15 * Math.sin(time / 60)); g = Math.max(g, 0.12); }
  if (e.enraged) r = Math.max(r, 0.22 + 0.1 * Math.sin(time / 140));
  if (r !== e.er || g !== e.eg || b !== e.eb) {
    e.er = r; e.eg = g; e.eb = b;
    for (const m of e.mats) if (m.emissive) { const b0 = m.userData.eb || (m.userData.eb = m.emissive.clone()); m.emissive.setRGB(Math.min(1, b0.r + r), Math.min(1, b0.g + g), Math.min(1, b0.b + b)); }
  }
  if (frozen && !e.ice) {
    e.ice = new THREE.Mesh(geo('Icosahedron', 1, 0), iceMat);
    e.ice.scale.setScalar(e.radius * 1.25);
    e.ice.position.y = e.radius * 0.9;
    e.mesh.add(e.ice);
  }
  if (e.ice) e.ice.visible = frozen;
  if (burning) {
    e.emT = (e.emT || 0) - dt;
    if (e.emT <= 0) { e.emT = 110; spark(e.x + rnd(e.radius), 14 + Math.random() * 10, e.y + rnd(e.radius), 0xff8a2a, 380, 0.8); }
  }
}
