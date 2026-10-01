// ambience.js — V5.0: ambientación. Cielo y niebla por mapa, ciclo de luz según la oleada,
// luciérnagas/ascuas flotando y braseros con llama.
const Ambience = (() => {
  // Luz por tramo de partida: [sol, hemisferio cielo, hemisferio suelo, fondo/niebla, intensidad sol, intensidad hemisferio]
  const PHASES = {
    valle: [
      [0xffe3b0, 0xcfe8ff, 0x3a4a2a, 0x9fc3d6, 0.85, 0.80],  // alba
      [0xfff6e0, 0xe0f0ff, 0x486a30, 0xa9d0e6, 1.00, 0.90],  // mediodía
      [0xff9a52, 0xffc89a, 0x4a3a2a, 0xd99a6a, 0.80, 0.70],  // ocaso
      [0x7a6ad0, 0x6a62a8, 0x241f3a, 0x2c2748, 0.45, 0.55],  // eclipse
    ],
    paso: [
      [0xd9b8ff, 0xb9a8e0, 0x2c2538, 0x5a4a78, 0.70, 0.65],
      [0xeadcff, 0xcdbdf0, 0x372e48, 0x6e5e90, 0.80, 0.72],
      [0xff8a6a, 0xd99aa8, 0x3a2830, 0x9a5a68, 0.72, 0.62],
      [0x6a5ad0, 0x5a4f9a, 0x1c1830, 0x1f1a38, 0.40, 0.50],
    ],
    bosque: [
      [0xcfe6c4, 0xa8d4b4, 0x1f3a24, 0x3b6a4c, 0.72, 0.68],
      [0xe6f2d0, 0xbfe0bf, 0x284a2c, 0x4a7d5a, 0.82, 0.74],
      [0xffb070, 0xd9b890, 0x2c3a24, 0x7a7a52, 0.70, 0.62],
      [0x8fa8e0, 0x6f86b8, 0x15241c, 0x1b2e28, 0.42, 0.50],
    ],
    fortaleza: [ // noche profunda desde el principio
      [0xb9c7ff, 0x9da9d8, 0x1c2430, 0x20263a, 0.58, 0.58],
      [0xc4d0ff, 0xa8b4e0, 0x222a38, 0x262c44, 0.62, 0.60],
      [0xff9a7a, 0xb08aa8, 0x2a2230, 0x3a2c44, 0.58, 0.54],
      [0x7a6ad0, 0x5a4f9a, 0x14122a, 0x161230, 0.38, 0.46],
    ],
  };
  const phaseOf = (w) => (w >= 15 ? 3 : w >= 10 ? 2 : w >= 5 ? 1 : 0);
  const cur = { sun: new THREE.Color(), sky: new THREE.Color(), gnd: new THREE.Color(), bg: new THREE.Color(), si: 1, hi: 1 };
  const tgt = { sun: new THREE.Color(), sky: new THREE.Color(), gnd: new THREE.Color(), bg: new THREE.Color(), si: 1, hi: 1 };
  const bossTint = new THREE.Color(0xff5a3a);
  let motes = null, mpos = null, mvel = null, flames = [], last = 0;
  const COUNT = S.lowPower ? 45 : 90;

  function setTarget(wave, boss) {
    const p = (PHASES[CURRENT_MAP.id] || PHASES.valle)[phaseOf(wave)];
    tgt.sun.setHex(p[0]); tgt.sky.setHex(p[1]); tgt.gnd.setHex(p[2]); tgt.bg.setHex(p[3]); tgt.si = p[4]; tgt.hi = p[5];
    if (boss) { tgt.sun.lerp(bossTint, 0.35); tgt.bg.lerp(bossTint, 0.12); tgt.si *= 0.9; }
  }
  function setWave(wave, boss, snap) {
    setTarget(wave, boss);
    if (snap) { cur.sun.copy(tgt.sun); cur.sky.copy(tgt.sky); cur.gnd.copy(tgt.gnd); cur.bg.copy(tgt.bg); cur.si = tgt.si; cur.hi = tgt.hi; apply(); }
  }
  function apply() {
    if (S.sun) { S.sun.color.copy(cur.sun); S.sun.intensity = cur.si; }
    if (S.hemi) { S.hemi.color.copy(cur.sky); S.hemi.groundColor.copy(cur.gnd); S.hemi.intensity = cur.hi; }
    scene.background.copy(cur.bg); scene.fog.color.copy(cur.bg);
  }

  function dotTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }
  function addBrazier(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const post = new THREE.Mesh(geo('Cylinder', 2.2, 3, 20, 6), mat(0x3a2a1c)); post.position.y = 10;
    const bowl = new THREE.Mesh(geo('Cylinder', 6, 3.5, 5, 8), mat(0x2a2019)); bowl.position.y = 21;
    const fl = new THREE.Mesh(geo('Cone', 4.2, 11, 7), bmat(0xff8a2a)); fl.position.y = 28;
    const core = new THREE.Mesh(geo('Cone', 2.2, 7, 7), bmat(0xffd878)); core.position.y = 26.5;
    g.add(post, bowl, fl, core); scene.add(g);
    flames.push({ fl, core, ph: Math.random() * 6 });
  }

  function init() {
    // Partículas: luciérnagas (valle) o ascuas violetas (paso)
    const warm = CURRENT_MAP.id === 'valle';
    mpos = new Float32Array(COUNT * 3); mvel = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      mpos.set([R() * 840 - 20, 4 + R() * 50, R() * 520 - 10], i * 3);
      mvel.set([(R() - 0.5) * 6, warm ? (R() - 0.5) * 3 : 5 + R() * 7, (R() - 0.5) * 6], i * 3);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(mpos, 3));
    motes = new THREE.Points(geom, new THREE.PointsMaterial({
      map: dotTexture(), color: warm ? 0xdfff7a : 0xc79bff, size: warm ? 7 : 6, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    motes.frustumCulled = false; scene.add(motes);
    // Braseros en la entrada del camino y junto al castillo
    const p0 = PATH_POINTS[0];
    addBrazier(24, p0.y - 42); addBrazier(24, p0.y + 42); addBrazier(705, 105); addBrazier(705, 195);
    setWave(GameState.wave, false, true);
  }

  function update(ts) {
    if (!motes) return;
    const dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
    // ciclo de luz: transición suave hacia el objetivo
    const k = Math.min(1, dt * 0.8);
    cur.sun.lerp(tgt.sun, k); cur.sky.lerp(tgt.sky, k); cur.gnd.lerp(tgt.gnd, k); cur.bg.lerp(tgt.bg, k);
    cur.si += (tgt.si - cur.si) * k; cur.hi += (tgt.hi - cur.hi) * k;
    apply();
    // partículas a la deriva
    const rising = CURRENT_MAP.id !== 'valle';
    for (let i = 0; i < COUNT; i++) {
      const j = i * 3;
      mpos[j] += (mvel[j] + Math.sin(ts / 900 + i) * 4) * dt;
      mpos[j + 1] += mvel[j + 1] * dt + (rising ? 0 : Math.sin(ts / 700 + i * 2) * 0.12);
      mpos[j + 2] += (mvel[j + 2] + Math.cos(ts / 1100 + i) * 4) * dt;
      if (mpos[j + 1] > 70) mpos[j + 1] = 3;
      if (mpos[j + 1] < 3) mpos[j + 1] = 60;
      if (mpos[j] < -30) mpos[j] = 830; else if (mpos[j] > 830) mpos[j] = -30;
      if (mpos[j + 2] < -20) mpos[j + 2] = 520; else if (mpos[j + 2] > 520) mpos[j + 2] = -20;
    }
    motes.geometry.attributes.position.needsUpdate = true;
    motes.material.opacity = (rising ? 0.7 : 0.55) + 0.3 * Math.sin(ts / 600);
    // llamas de los braseros
    for (const f of flames) {
      const s = 1 + 0.18 * Math.sin(ts / 90 + f.ph) + 0.1 * Math.sin(ts / 53 + f.ph * 2);
      f.fl.scale.set(1, s, 1); f.core.scale.set(1, 1 / s + 0.1, 1);
    }
  }
  return { init, update, setWave };
})();
