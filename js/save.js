// save.js — V5.0: guardado automático de la partida (al terminar cada oleada) y «Continuar».
const RUN_KEY = 'defensa-castillo-run';

const Save = (() => {
  const read = () => { try { const s = JSON.parse(localStorage.getItem(RUN_KEY)); return s && s.v === 1 ? s : null; } catch (e) { return null; } };
  const has = () => !!read();
  const mapName = (s) => (MAPS[s.map] || MAPS.valle).name;
  const label = () => { const s = read(); return s ? `${mapName(s)} · oleada ${s.wave} · ${s.towers.length} torres` : ''; };

  function write() {
    const g = GameState;
    if (!g.started || g.over || g.waveActive) return; // solo entre oleadas, con el campo en calma
    const snap = {
      v: 1, map: CURRENT_MAP.id, wave: g.wave, gold: g.gold, lives: g.lives, maxLives: g.maxLives || INITIAL_LIVES, kills: g.kills, totalDamage: g.totalDamage, goldEarned: g.goldEarned,
      continued: !!g.continued, seen: g.seen, run: Progress.snapRun(),
      towers: g.towers.map((t) => ({ type: t.type, x: t.x, y: t.y, level: t.level, spec: t.spec || null, mode: t.mode, invested: t.invested })),
    };
    try { localStorage.setItem(RUN_KEY, JSON.stringify(snap)); } catch (e) { return; }
    const chip = $('saveChip');
    chip.classList.remove('show'); void chip.offsetWidth; chip.classList.add('show');
  }
  function clear() { try { localStorage.removeItem(RUN_KEY); } catch (e) { /* modo privado */ } refreshButton(); }

  function restoreTower(r) {
    const m = towerModel(r.type);
    m.g.position.set(r.x, 0, r.y); scene.add(m.g);
    const rg = flat(new THREE.Mesh(geo('Ring', 0.97, 1, 64), tmat(0x9fe3ff, 0.5)));
    rg.position.set(r.x, 1.8, r.y); rg.visible = false; scene.add(rg);
    const t = { x: r.x, y: r.y, type: r.type, mode: TARGET_MODES.includes(r.mode) ? r.mode : 'first', lastShot: 0, visual: m.g, range: rg, level: r.level, invested: r.invested, top: m.top, fig: m.fig };
    GameState.towers.push(t);
    if (r.spec) { t.spec = r.spec; buildSpecDeco(t, specOf(t)); }
    const R = getEffectiveStats(t).range; rg.scale.set(R, R, 1);
    updateLevelPips(t); applyScale(t);
  }

  function resume() {
    const s = read();
    if (!s || !GameState.ready || GameState.started) return;
    if (s.map !== CURRENT_MAP.id) { // el mapa se construye al cargar: cambia y recarga
      try { localStorage.setItem(MAP_KEY, s.map); sessionStorage.setItem('dc-autocontinue', '1'); } catch (e) { return; }
      location.reload(); return;
    }
    beginGame();
    const g = GameState, num = (n, d) => (Number.isFinite(n) ? n : d);
    g.wave = Math.max(0, Math.floor(num(s.wave, 0)));
    g.maxLives = Math.max(1, num(s.maxLives, INITIAL_LIVES));
    g.lives = g.lastLives = Math.min(g.maxLives, Math.max(1, num(s.lives, g.maxLives)));
    g.gold = g.lastGold = Math.max(0, num(s.gold, 0));
    g.kills = Math.max(0, num(s.kills, 0));
    g.totalDamage = Math.max(0, num(s.totalDamage, 0));
    g.goldEarned = Math.max(0, num(s.goldEarned, 0));
    g.continued = !!s.continued;
    g.seen = s.seen && typeof s.seen === 'object' ? s.seen : {};
    for (const r of s.towers || []) {
      const ok = TOWER_DEFS[r.type] && r.level >= 1 && r.level <= MAX_TOWER_LEVEL && g.buildSlots.some((sl) => sl.x === r.x && sl.y === r.y) &&
        (!r.spec || (SPEC_DEFS[r.type] || []).some((sp) => sp.id === r.spec)) && !isCellOccupied(r.x, r.y);
      if (ok) restoreTower(r);
    }
    Progress.restoreRun(s.run);
    Ambience.setWave(g.wave, false, true);
    updateHUD();
    showRewardToast(`💾 Partida restaurada · oleada ${g.wave}`);
  }

  function refreshButton() {
    const b = $('continueSaveBtn'), s = read();
    b.hidden = !s;
    if (s) $('continueSaveLabel').innerHTML = `CONTINUAR · OLEADA ${s.wave}<small>${mapName(s)}</small>`;
  }
  function init() {
    $('continueSaveBtn').addEventListener('click', resume);
    refreshButton();
    document.addEventListener('visibilitychange', () => { if (document.hidden) write(); });
    window.addEventListener('pagehide', write);
    let auto = false;
    try { auto = sessionStorage.getItem('dc-autocontinue') === '1'; sessionStorage.removeItem('dc-autocontinue'); } catch (e) { /* sin storage */ }
    if (auto) { const iv = setInterval(() => { if (GameState.ready) { clearInterval(iv); resume(); } }, 150); }
  }
  return { write, clear, has, label, init, resume };
})();
