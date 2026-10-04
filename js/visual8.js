// visual8.js — V8.15: pulido visual. Solo añade decoración y efectos; no toca la lógica de juego.
// Hierba y flores instanciadas, sombras de nubes, resplandor y luz de braseros, polvo al caminar,
// sombras suaves y un ligero realce de color. Se engancha a Ambience.init / Ambience.update.
const V8Visual = (() => {
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LOW = !!S.lowPower;
  // Generador propio: no altera la semilla R() del resto del mundo (la decoración sigue igual).
  let seed = 8150;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

  const FLOWERS = {
    valle: [0xffffff, 0xffe27a, 0xff9ec0, 0xb9a8ff],
    paso: [0xd9b8ff, 0xff9ac8, 0x9ad8ff],
    bosque: [0xe8dcc0, 0xd96a5a, 0xc9e87a],
    fortaleza: [0x8a8494, 0xb04a3a, 0x6a6474],
  };
  const DUST = { valle: 0xb8a47c, paso: 0x8f84a0, bosque: 0x8a7a5a, fortaleza: 0x7c7478 };

  let clouds = [], glows = [], lights = [], puffs = [], last = 0, ready = false;
  let glowTex = null;

  function softTexture(size, inner, outer) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d'), h = size / 2, g = x.createRadialGradient(h, h, 0, h, h, h);
    g.addColorStop(0, inner); g.addColorStop(1, outer);
    x.fillStyle = g; x.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  // Distancia mínima de un punto del suelo al camino (para no poner hierba sobre la calzada).
  function pathDist(px, pz) {
    let best = 1e9;
    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
      const a = PATH_POINTS[i], b = PATH_POINTS[i + 1], dx = b.x - a.x, dy = b.y - a.y;
      const L2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (pz - a.y) * dy) / L2));
      best = Math.min(best, Math.hypot(px - (a.x + dx * t), pz - (a.y + dy * t)));
    }
    return best;
  }
  const blocked = (x, z) => pathDist(x, z) < 50 || x > 640 && z > 40 && z < 260 || x < 60 && Math.abs(z - PATH_POINTS[0].y) < 70;

  function scatter(geom, mat, count, place, palette) {
    const mesh = new THREE.InstancedMesh(geom, mat, count), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    const pos = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color();
    let n = 0, tries = 0;
    while (n < count && tries++ < count * 12) {
      const x = 12 + rnd() * 776, z = 12 + rnd() * 476;
      if (blocked(x, z)) continue;
      const s = place(sc);
      e.set(0, rnd() * 6.28, (rnd() - .5) * .25); q.setFromEuler(e);
      pos.set(x, 0.2, z); m.compose(pos, q, sc); mesh.setMatrixAt(n, m);
      palette(col, rnd); mesh.setColorAt(n, col); n++;
    }
    mesh.count = n; mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false; mesh.receiveShadow = false; mesh.castShadow = false;
    scene.add(mesh); return mesh;
  }

  function buildGround() {
    const base = new THREE.Color(CURRENT_MAP.ground), hsl = {};
    base.getHSL(hsl);
    // Mechones de hierba: tres conos finos girados forman una mata.
    const blade = new THREE.ConeGeometry(1.1, 6.5, 4, 1); blade.translate(0, 3.2, 0);
    const tuftMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    scatter(blade, tuftMat, LOW ? 260 : 820,
      s => { const k = .7 + rnd() * 1.5; s.set(k, .7 + rnd() * 1.1, k); return k; },
      (c, r) => c.setHSL(hsl.h + (r() - .5) * .04, Math.min(1, hsl.s * (1.05 + r() * .25)), Math.min(.7, hsl.l * (1.15 + r() * .55))));
    // Flores / setas / brasas apagadas según el mapa.
    const pal = (FLOWERS[CURRENT_MAP.id] || FLOWERS.valle).map(h => new THREE.Color(h));
    const bud = new THREE.SphereGeometry(1.5, 6, 5); bud.translate(0, 5.5, 0);
    scatter(bud, new THREE.MeshLambertMaterial({ color: 0xffffff }), LOW ? 40 : 130,
      s => { const k = .8 + rnd() * .9; s.set(k, k, k); return k; },
      (c, r) => c.copy(pal[Math.floor(r() * pal.length)]));
    // Piedrecillas
    const pebble = new THREE.DodecahedronGeometry(1.8, 0); pebble.translate(0, .8, 0);
    const peb = new THREE.Color(CURRENT_MAP.pathCol[0]);
    scatter(pebble, new THREE.MeshLambertMaterial({ color: 0xffffff }), LOW ? 30 : 90,
      s => { const k = .7 + rnd() * 1.4; s.set(k, k * .7, k); return k; },
      (c, r) => c.copy(peb).offsetHSL(0, 0, .03 + r() * .12));
  }

  function buildClouds() {
    const tex = softTexture(128, 'rgba(0,0,0,0.9)', 'rgba(0,0,0,0)');
    const n = LOW ? 3 : 6;
    for (let i = 0; i < n; i++) {
      const w = 220 + rnd() * 220, d = 120 + rnd() * 110;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: .11, depthWrite: false, fog: false }));
      mesh.rotation.x = -Math.PI / 2; mesh.rotation.z = rnd() * 3;
      mesh.position.set(-300 + rnd() * 1400, 3.4, 20 + rnd() * 460);
      mesh.renderOrder = 2; scene.add(mesh);
      clouds.push({ mesh, v: 5 + rnd() * 7 });
    }
  }

  function buildFire() {
    glowTex = softTexture(64, 'rgba(255,190,90,1)', 'rgba(255,120,30,0)');
    const p0 = PATH_POINTS[0];
    const spots = [[24, p0.y - 42], [24, p0.y + 42], [705, 105], [705, 195]];
    for (const [x, z] of spots) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffa24a, transparent: true, opacity: .8,
        depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      sp.position.set(x, 30, z); sp.scale.setScalar(46); sp.renderOrder = 6; scene.add(sp);
      glows.push({ sp, ph: rnd() * 6 });
    }
    if (!LOW) {
      // Dos luces puntuales (entrada y castillo): se notan sobre todo al caer la noche.
      [[24, 35, p0.y], [705, 35, 150]].forEach(([x, y, z]) => {
        const L = new THREE.PointLight(0xff9a4a, 0.5, 210, 2); L.position.set(x, y, z); scene.add(L);
        lights.push({ L, ph: rnd() * 6 });
      });
    }
  }

  function buildDust() {
    const tex = softTexture(48, 'rgba(255,255,255,.9)', 'rgba(255,255,255,0)');
    const col = new THREE.Color(DUST[CURRENT_MAP.id] || DUST.valle);
    const n = LOW ? 18 : 40;
    for (let i = 0; i < n; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: col.clone(), transparent: true, opacity: 0, depthWrite: false, fog: true }));
      sp.visible = false; sp.renderOrder = 5; scene.add(sp);
      puffs.push({ sp, t: 1, life: 1, s0: 6, s1: 16, base: col.clone() });
    }
  }

  // Viento: los árboles se inclinan apenas, con ráfagas que recorren el mapa.
  function sway(ts) {
    const T = window.V8Trees; if (!T || reduce) return;
    const t = ts / 1000;
    for (let i = 0; i < T.length; i++) {
      const o = T[i], gust = Math.sin(t * .7 + o.ph) * .6 + Math.sin(t * 1.9 + o.ph * 2.3) * .4, a = o.pine ? .012 : .022;
      o.g.rotation.z = gust * a; o.g.rotation.x = Math.cos(t * .8 + o.ph) * a * .6;
    }
  }

  // Chispas al impactar (flecha: doradas, magia: azules, asedio: naranjas).
  const HIT = { pierce: 0xffe9b0, snipe: 0xfff2c8, magic: 0x9fe0ff, siege: 0xffa040 };
  function hit(e, dtype, crit) {
    const now = performance.now();
    if (e._hitT && now - e._hitT < 110) return;
    if (S.fx.length > 220) return;
    e._hitT = now;
    burst(e.x, (e.hb || 20) * .5, e.y, HIT[dtype] || 0xffffff, crit ? 7 : 3, crit ? 60 : 36);
  }

  // Halo aditivo que simula el brillo (bloom) de una explosión; se desvanece rápido.
  function halo(x, z, R, size) {
    if (!glowTex) return;
    const xl = size === 'xl', big = xl || size === 'lg';
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffb060, transparent: true, opacity: .9,
      depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false }));
    sp.position.set(x, 10, z); sp.renderOrder = 8; scene.add(sp);
    const s1 = R * (xl ? 4 : big ? 3.2 : 2.6), life = xl ? 520 : 360, t0 = performance.now();
    (function step() {
      const p = Math.min(1, (performance.now() - t0) / life);
      sp.scale.setScalar(s1 * (.35 + .65 * Math.sin(p * Math.PI / 2)));
      sp.material.opacity = .85 * (1 - p) * (1 - p);
      if (p < 1) requestAnimationFrame(step); else { scene.remove(sp); sp.material.dispose(); }
    })();
  }

  let puffI = 0;
  function emit(x, z, r) {
    const p = puffs[puffI++ % puffs.length];
    p.t = 0; p.life = .55 + rnd() * .35; p.s0 = 4 + r * .35; p.s1 = 14 + r * .9;
    p.sp.position.set(x + (rnd() - .5) * 6, 3 + rnd() * 2, z + (rnd() - .5) * 6);
    p.sp.visible = true;
  }

  function init() {
    if (ready) return; ready = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    buildGround(); buildClouds(); buildFire(); buildDust();
    // Realce de color suave (solo en equipos potentes y calidad no baja).
    try {
      const q = window.Settings && Settings.get ? Settings.get('quality') : 'auto';
      if (!LOW && q !== 'low') renderer.domElement.style.filter = 'contrast(1.05) saturate(1.12)';
    } catch (_) {}
  }

  function update(ts) {
    if (!ready) return;
    sway(ts);
    const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts;
    const sunI = S.sun ? S.sun.intensity : 1;
    const night = Math.max(0, Math.min(1, (1 - sunI) * 1.6)); // 0 de día … ~1 de noche/eclipse
    // sombras de nubes a la deriva (más tenues de noche)
    for (const c of clouds) {
      if (!reduce) { c.mesh.position.x += c.v * dt; if (c.mesh.position.x > 1100) c.mesh.position.x = -320; }
      c.mesh.material.opacity = .12 * (1 - night * .6);
    }
    // resplandor y luz de los braseros
    for (const g of glows) {
      const f = 1 + .14 * Math.sin(ts / 90 + g.ph) + .08 * Math.sin(ts / 47 + g.ph * 2);
      g.sp.scale.setScalar((44 + night * 26) * f); g.sp.material.opacity = .55 + night * .4;
    }
    for (const l of lights) {
      l.L.intensity = (.35 + night * 1.5) * (1 + .18 * Math.sin(ts / 80 + l.ph) + .1 * Math.sin(ts / 41 + l.ph * 2));
    }
    // polvo bajo los enemigos que caminan (solo a ras de suelo)
    const lum = .45 + .55 * Math.min(1, sunI);
    const list = GameState.enemies;
    for (let i = 0; i < list.length; i++) {
      const e = list[i], m = e.mesh;
      if (!m || m.position.y > 6) continue;
      const lx = e._dx, lz = e._dz;
      if (lx === undefined) { e._dx = m.position.x; e._dz = m.position.z; continue; }
      if (Math.hypot(m.position.x - lx, m.position.z - lz) > 10 + e.radius * .25) {
        emit(lx, lz, e.radius || 10); e._dx = m.position.x; e._dz = m.position.z;
      }
    }
    for (const p of puffs) {
      if (!p.sp.visible) continue;
      p.t += dt / p.life;
      if (p.t >= 1) { p.sp.visible = false; continue; }
      p.sp.scale.setScalar(p.s0 + (p.s1 - p.s0) * p.t);
      p.sp.material.opacity = .3 * (1 - p.t) * (1 - p.t);
      p.sp.material.color.copy(p.base).multiplyScalar(lum);
      p.sp.position.y += dt * 6;
    }
  }

  return { init, update, hit, halo };
})();

// Enganche sin modificar engine3d.js: corre justo después de Ambience.init / Ambience.update.
(() => {
  const i0 = Ambience.init, u0 = Ambience.update;
  Ambience.init = function () { i0.apply(this, arguments); try { V8Visual.init(); } catch (e) { console.warn('V8Visual.init', e); } };
  let broken = false;
  Ambience.update = function () { u0.apply(this, arguments); if (broken) return; try { V8Visual.update(arguments[0]); } catch (e) { broken = true; console.warn('V8Visual.update', e); } };
})();

// Halo de brillo en cada explosión (envuelve explosionFx de fx.js sin editarlo).
(() => {
  if (typeof explosionFx !== 'function') return;
  const f0 = explosionFx;
  explosionFx = function (x, z, R, size, fire) {
    f0.apply(this, arguments);
    try { V8Visual.halo(x, z, R, size); } catch (_) {}
  };
})();
