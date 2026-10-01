// skills.js — V4.0: habilidades activas, especializaciones de torre y torres aturdidas.

/* ---------- Habilidades activas ---------- */

const skillReady = (id) => S.now >= GameState.skills[id];

function initSkills4() {
  initFx4();
  // Vista previa de la zona de impacto del Meteoro.
  const g = S.skPrev = new THREE.Group();
  g.visible = false;
  g.rng = flat(new THREE.Mesh(geo('Ring', 0.97, 1, 64), tmat(0xff8a30, 0.85)));
  g.fill = flat(new THREE.Mesh(geo('Circle', 1, 48), tmat(0xff8a30, 0.16)));
  g.rng.position.y = g.fill.position.y = 1.9;
  g.add(g.rng, g.fill);
  scene.add(g);
}

function drawSkillPreview(x, y) {
  const id = GameState.selectedSkill;
  if (!id) return;
  const d = SKILL_DEFS[id], pv = S.skPrev;
  pv.visible = true;
  pv.position.set(x, 0, y);
  pv.rng.scale.set(d.radius, d.radius, 1);
  pv.fill.scale.set(d.radius, d.radius, 1);
}

function cancelSkill() {
  GameState.selectedSkill = null;
  if (S.skPrev) S.skPrev.visible = false;
  clearPlacementPreview();
  updateSkillUI();
}

function useSkill(id) {
  if (!canAct()) return;
  const d = SKILL_DEFS[id];
  if (!skillReady(id)) { sfx.deny(); return; }
  if (d.targeted) {
    if (GameState.selectedSkill === id) { cancelSkill(); return; }
    GameState.selectedTower = null;
    syncBuildButtons();
    deselectPlacedTower();
    clearPlacementPreview();
    hideBuildGrid();
    GameState.selectedSkill = id;
    sfx.click();
    updateSkillUI();
    showRewardToast(`${d.icon} Toca el mapa para lanzar ${d.name}`);
    return;
  }
  if (id === 'freeze') castFreeze();
  else if (id === 'fury') castFury();
  updateSkillUI();
}

function castSkillAt(x, y) {
  if (GameState.selectedSkill === 'meteor') castMeteor(x, y);
}

// Meteoro: cae desde el cielo tras un aviso en el suelo; daña (escala con la oleada) y quema.
function castMeteor(x, y) {
  const d = SKILL_DEFS.meteor;
  if (!skillReady('meteor')) { sfx.deny(); return; }
  GameState.skills.meteor = S.now + d.cd * Progress.cdMul();
  cancelSkill();
  sfx.meteorCall();
  const warn = flat(new THREE.Mesh(geo('Ring', 0.9, 1, 48), tmat(0xff5a20, 0.8)));
  warn.position.set(x, 2, y);
  warn.scale.set(d.radius, d.radius, 1);
  scene.add(warn);
  addFx(650, (p) => { warn.material.opacity = 0.35 + 0.4 * Math.abs(Math.sin(p * 14)); }, () => { scene.remove(warn); warn.material.dispose(); });
  const m = new THREE.Group();
  m.add(new THREE.Mesh(geo('Sphere', 9, 12, 10), bmat(0xffa040)));
  m.add(new THREE.Mesh(geo('Sphere', 15, 12, 10), tmat(0xff6a20, 0.35)));
  scene.add(m);
  const sx = x + 120, sy = 380, sz = y - 140;
  let n = 0;
  addFx(650, (p) => {
    const q = p * p;
    m.position.set(sx + (x - sx) * q, sy + (8 - sy) * q, sz + (y - sz) * q);
    m.rotation.y += 0.2;
    if (++n % 2 === 0) {
      spark(m.position.x, m.position.y, m.position.z, 0xff8a30, 380, 2.2);
      smoke(m.position.x, m.position.z, 6);
    }
  }, () => {
    scene.remove(m);
    explosionFx(x, y, d.radius, 'xl', true);
    S.shake = 11;
    flashScreen('#ffb060', 0.28, 400);
    sfx.meteorHit();
    const dmg = d.dmg * (1 + GameState.wave * 0.12);
    GameState.enemies.forEach((en) => {
      if (en.dead) return;
      const dist = Math.hypot(en.x - x, en.y - y);
      if (dist >= d.radius) return;
      const f = dist < d.radius * 0.4 ? 1 : 1 - ((dist - d.radius * 0.4) / (d.radius * 0.6)) * 0.4;
      damageEnemy(en, dmg * f, 'siege');
      if (!en.dead) { en.burnUntil = S.now + BURN_MS; en.burnDps = dmg * 0.25; en.burnT = 500; }
    });
  });
}

// Escarcha: congela a todos (los jefes solo se ralentizan).
function castFreeze() {
  const d = SKILL_DEFS.freeze;
  GameState.skills.freeze = S.now + d.cd * Progress.cdMul();
  sfx.freezeAll();
  flashScreen('#bfeaff', 0.3, 500);
  waveFx(400, 250, 0xbfeaff, 560, 700, 3);
  later(120, () => waveFx(400, 250, 0xffffff, 520, 650, 3));
  GameState.enemies.forEach((e) => {
    if (e.dead) return;
    if (e.isBoss) { e.slowF = 0.35; e.slowUntil = Math.max(e.slowUntil, S.now + d.dur); burst(e.x, 30, e.y, 0xbfeaff, 10, 50); }
    else freezeEnemy(e, d.dur);
  });
  showRewardToast('❄ ¡Escarcha!');
}

// Furia Real: las torres disparan más rápido; anillos dorados y borde de pantalla.
function castFury() {
  const d = SKILL_DEFS.fury;
  GameState.skills.fury = S.now + d.cd * Progress.cdMul();
  GameState.furyUntil = S.now + d.dur;
  sfx.fury();
  flashScreen('#ffd45a', 0.22, 450);
  showRewardToast('⚡ ¡Furia Real!');
  for (const t of GameState.towers) {
    const m = flat(new THREE.Mesh(geo('Ring', 0.9, 1, 32), tmat(0xffd45a, 0.6)));
    m.position.set(t.x, 2.5, t.y);
    scene.add(m);
    waveFx(t.x, t.y, 0xffd45a, 60, 500);
    addFx(d.dur, (p) => {
      m.scale.setScalar(24 + 4 * Math.sin(p * d.dur / 90));
      m.material.opacity = (0.35 + 0.25 * Math.sin(p * d.dur / 120)) * (p > 0.85 ? (1 - p) / 0.15 : 1);
    }, () => { scene.remove(m); m.material.dispose(); });
  }
}

function syncSkillButtons() { updateSkillUI(); }

function updateSkillUI() {
  const bar = $('abilityBar');
  if (!bar) return;
  const fury = S.now < GameState.furyUntil;
  bar.querySelectorAll('.skill-btn').forEach((b) => {
    const id = b.dataset.skill, d = SKILL_DEFS[id];
    const left = Math.max(0, GameState.skills[id] - S.now);
    b.classList.toggle('cooling', left > 0);
    b.classList.toggle('ready', left <= 0 && canAct());
    b.classList.toggle('active', (id === 'fury' && fury) || GameState.selectedSkill === id);
    b.style.setProperty('--cd', ((left / d.cd) * 100).toFixed(1) + '%');
    b.querySelector('.skill-time').textContent = left > 0 ? Math.ceil(left / 1000) : '';
  });
  $('gameHost').classList.toggle('fury', fury);
}

/* ---------- Especializaciones de torre ---------- */

const needsSpec = (t) => t.level >= MAX_TOWER_LEVEL && !t.spec;

function buildSpecDeco(t, sp) {
  if (t.decoG) scene.remove(t.decoG);
  const g = new THREE.Group();
  g.position.set(t.x, 0, t.y);
  const ring = flat(new THREE.Mesh(geo('Ring', 14, 17, 32), tmat(sp.color, 0.55)));
  ring.position.y = 2.4;
  const gem = new THREE.Mesh(geo('Octahedron', 5, 0), bmat(sp.color));
  gem.position.y = t.top + 16;
  g.add(ring, gem);
  scene.add(g);
  t.decoG = g;
  t.gem = gem;
}

function specializeTower(t, id) {
  const sp = SPEC_DEFS[t.type].find((s) => s.id === id);
  if (!sp || !needsSpec(t)) return;
  if (GameState.gold < sp.cost) { sfx.deny(); showRewardToast(`Oro insuficiente · faltan ${sp.cost - GameState.gold} ✦`); return; }
  GameState.gold -= sp.cost;
  t.invested += sp.cost;
  t.spec = id;
  t.specPending = null;
  updateHUD();
  const r = getEffectiveStats(t).range;
  t.range.scale.set(r, r, 1);
  buildSpecDeco(t, sp);
  updateLevelPips(t);
  refreshTowerPanel(t);
  ringFx(t.x, t.y, sp.color, 60, 500);
  waveFx(t.x, t.y, sp.color, 90, 650);
  burst(t.x, t.top, t.y, sp.color, 18, 70);
  flashLight(t.x, t.y, sp.color, 1.2, 320);
  sfx.spec();
  showRewardToast(`${sp.icon} ${sp.name} · ¡especialización!`);
}

/* ---------- Torres aturdidas (Saboteador y pisotón del jefe) ---------- */

function stunTower(t, ms, src) {
  t.stunUntil = Math.max(t.stunUntil || 0, S.now + ms);
  if (!t.stunMark) {
    const g = new THREE.Group();
    g.position.set(t.x, t.top + 6, t.y);
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(geo('Sphere', 2.4, 6, 6), bmat(0xffe24a));
      const a = i * 2.094;
      m.position.set(Math.cos(a) * 11, 0, Math.sin(a) * 11);
      g.add(m);
    }
    scene.add(g);
    t.stunMark = g;
  }
  burst(t.x, t.top, t.y, 0xffe24a, 6, 40);
  sfx.stun();
  if (src) lightningFx([new THREE.Vector3(src.x, 16, src.y), new THREE.Vector3(t.x, t.top, t.y)], 0xb07aff);
  if (!GameState.seen.stun) { GameState.seen.stun = 1; showRewardToast('⚡ ¡Una torre fue desactivada!'); }
}

function clearStun(t) {
  t.stunUntil = 0;
  if (t.stunMark) { scene.remove(t.stunMark); t.stunMark = null; }
}

function disposeTowerExtras(t) {
  if (t.decoG) { scene.remove(t.decoG); t.decoG = null; t.gem = null; }
  clearStun(t);
}

/* ---------- Eventos de la V4.0 ---------- */

function bindV4Events() {
  const bar = $('abilityBar');
  for (const [id, d] of Object.entries(SKILL_DEFS)) {
    const b = document.createElement('button');
    b.className = 'skill-btn';
    b.dataset.skill = id;
    b.title = `${d.name} (${d.key.toUpperCase()}) — ${d.desc}`;
    b.setAttribute('aria-label', d.name);
    b.innerHTML = `<i class="skill-cd"></i><span class="skill-ico">${d.icon}</span><em class="skill-key">${d.key.toUpperCase()}</em><b class="skill-time"></b>`;
    b.addEventListener('click', () => useSkill(id));
    bar.appendChild(b);
  }
  // Elegir especialización: primer toque la describe, el segundo la confirma.
  [0, 1].forEach((i) => $('spec' + i).addEventListener('click', () => {
    const t = GameState.selectedPlacedTower;
    if (!t || !canAct() || !needsSpec(t)) return;
    const sp = SPEC_DEFS[t.type][i];
    if (t.specPending !== sp.id) { t.specPending = sp.id; sfx.click(); refreshTowerPanel(t); return; }
    specializeTower(t, sp.id);
  }));
  updateSkillUI();
}
