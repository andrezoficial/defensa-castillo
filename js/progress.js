// progress.js — V4.1: estrellas, logros y economía/progresión (coronas y mejoras permanentes).
// Todo se guarda en localStorage (clave SAVE_KEY). El mapa activo se define en config.js (MAPS).

const SAVE_KEY = 'defensa-castillo-save';

// Mejoras permanentes del reino, se compran con coronas 👑 (cada nivel cuesta más que el anterior).
const UPGRADES = {
  gold:  { icon: '✦', name: 'Tesoro real',          max: 5, cost: (l) => 30 + 25 * l, now: (l) => `+${l * 25} oro inicial`,        next: '+25 oro inicial' },
  lives: { icon: '♥', name: 'Murallas reforzadas',  max: 5, cost: (l) => 40 + 30 * l, now: (l) => `+${l * 2} vidas iniciales`,     next: '+2 vidas iniciales' },
  loot:  { icon: '⚔', name: 'Botín de guerra',      max: 5, cost: (l) => 50 + 40 * l, now: (l) => `+${l * 5} % oro por baja`,      next: '+5 % oro por baja' },
  cd:    { icon: '☄', name: 'Maestría arcana',      max: 5, cost: (l) => 50 + 40 * l, now: (l) => `−${l * 6} % enfriamiento`,      next: '−6 % enfriamiento' },
};

const ACH_CROWNS = 5; // coronas que da cada logro

const Progress = (() => {
  const blank = () => ({ crowns: 0, upg: { gold: 0, lives: 0, loot: 0, cd: 0 }, stars: {}, ach: {}, stats: { kills: 0, bosses: 0, wins: 0, damage: 0, gold: 0, waves: 0 } });
  let data = blank();
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (raw) data = { ...blank(), ...raw, upg: { ...blank().upg, ...raw.upg }, stats: { ...blank().stats, ...raw.stats } };
  } catch (e) { /* sin guardado o modo privado */ }
  const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* modo privado */ } };

  // Estado de la partida en curso.
  const run = { leaks: 0, clean: false, killCr: 0, won: false, stars: 0, crowns: 0, cDmg: 0, cGold: 0 }; // cDmg/cGold: ya sumados a las estadísticas
  const stars = (id) => data.stars[id] || 0;
  const unlocked = (m) => !m.unlock || stars(m.unlock) >= 1;
  const upgTotal = () => Object.values(data.upg).reduce((a, b) => a + b, 0);

  // ★ por vidas conservadas al ganar: ≥90 % = 3, ≥50 % = 2, el resto = 1.
  const starsFor = (lives, max) => (lives / max >= 0.9 ? 3 : lives / max >= 0.5 ? 2 : 1);

  const ACH = [
    { id: 'hundred',  icon: '🗡', name: 'Centurión',          desc: 'Derrota a 100 enemigos (en total)',        ok: () => data.stats.kills >= 100 },
    { id: 'thousand', icon: '⚔', name: 'Exterminador',       desc: 'Derrota a 1000 enemigos (en total)',       ok: () => data.stats.kills >= 1000 },
    { id: 'boss',     icon: '♛', name: 'Cazajefes',          desc: 'Derrota a un jefe',                        ok: () => data.stats.bosses >= 1 },
    { id: 'clean',    icon: '🛡', name: 'Muralla intacta',    desc: 'Supera la oleada 5 sin que se cuele nadie', ok: () => run.clean },
    { id: 'spec',     icon: '✹', name: 'Maestro armero',     desc: 'Especializa una torre',                    ok: () => GameState.towers.some((t) => t.spec) },
    { id: 'allskills', icon: '☄', name: 'Gran hechicero',    desc: 'Usa las 3 habilidades en una partida',     ok: () => GameState.skills.meteor > 0 && GameState.skills.freeze > 0 && GameState.skills.fury > 0 },
    { id: 'rich',     icon: '💰', name: 'Tesorero',           desc: 'Ten 1000 de oro a la vez',                 ok: () => GameState.gold >= 1000 },
    { id: 'shop',     icon: '👑', name: 'Inversor',           desc: 'Compra tu primera mejora del reino',       ok: () => upgTotal() >= 1 },
    { id: 'win',      icon: '🏰', name: 'Castillo a salvo',   desc: 'Gana una partida',                         ok: () => data.stats.wins >= 1 },
    { id: 'perfect',  icon: '⭐', name: 'Perfecto',           desc: 'Consigue 3 estrellas en un mapa',          ok: () => Object.values(data.stars).some((s) => s >= 3) },
    { id: 'explorer', icon: '🗺', name: 'Explorador',         desc: 'Gana en el Paso del Eclipse',              ok: () => stars('paso') >= 1 },
    { id: 'endless',  icon: '♾', name: 'Sin final',          desc: 'Llega a la oleada 20',                     ok: () => GameState.wave >= 20 },
  ];

  function check() {
    let any = false;
    for (const a of ACH) {
      if (data.ach[a.id] || !a.ok()) continue;
      data.ach[a.id] = 1; data.crowns += ACH_CROWNS; run.crowns += ACH_CROWNS; any = true;
      if (typeof showRewardToast === 'function' && GameState.started) showRewardToast(`🏆 Logro: ${a.name} · +${ACH_CROWNS} 👑`);
      if (typeof sfx !== 'undefined' && GameState.started) sfx.spec();
    }
    if (any) { save(); render(); }
  }

  /* ---------- Ganchos del juego ---------- */
  const goldMul = () => 1 + data.upg.loot * 0.05;
  const cdMul = () => 1 - data.upg.cd * 0.06;

  function applyRun() {
    const g = GameState;
    g.maxLives = INITIAL_LIVES + data.upg.lives * 2;
    g.lives = g.lastLives = g.maxLives;
    g.gold = g.lastGold = INITIAL_GOLD + CURRENT_MAP.gold + data.upg.gold * 25;
    Object.assign(run, { leaks: 0, clean: false, killCr: 0, won: false, stars: 0, crowns: 0, cDmg: 0, cGold: 0 });
  }
  function onKill(e) {
    data.stats.kills++;
    if (e.isBoss) data.stats.bosses++;
  }
  const onLeak = () => { run.leaks++; };
  function onWave(w) {
    data.stats.waves = Math.max(data.stats.waves || 0, w);
    if (w >= 5 && run.leaks === 0) run.clean = true;
    const c = Math.round((2 + (w % BOSS_WAVE_INTERVAL === 0 ? 3 : 0)) * CURRENT_MAP.crown);
    data.crowns += c; run.crowns += c;
    save(); check(); render();
  }
  // Fin de partida (victoria o derrota): paga coronas por bajas y, al ganar, calcula las estrellas.
  function onEnd(win) {
    const g = GameState;
    const kc = Math.floor(g.kills / 20);
    let cr = Math.max(0, kc - run.killCr);
    run.killCr = Math.max(run.killCr, kc);
    if (win && !run.won) {
      run.won = true;
      run.stars = starsFor(g.lives, g.maxLives || INITIAL_LIVES);
      data.stats.wins++;
      if (run.stars > stars(CURRENT_MAP.id)) data.stars[CURRENT_MAP.id] = run.stars;
      cr += Math.round((10 + 5 * run.stars) * CURRENT_MAP.crown);
    }
    // Solo se suma lo que aún no se había contado (ganar, seguir en modo sin fin y luego perder duplicaba el total).
    data.stats.damage += Math.max(0, g.totalDamage - run.cDmg);
    data.stats.gold += Math.max(0, g.goldEarned - run.cGold);
    run.cDmg = g.totalDamage; run.cGold = g.goldEarned;
    data.crowns += cr; run.crowns += cr;
    save(); check(); render();
    return { stars: run.stars, crowns: run.crowns };
  }
  const snapRun = () => ({ leaks: run.leaks, clean: run.clean, killCr: run.killCr, cDmg: run.cDmg, cGold: run.cGold });
  const restoreRun = (r) => { if (r) { run.leaks = r.leaks | 0; run.clean = !!r.clean; run.killCr = r.killCr | 0; run.cDmg = Number(r.cDmg) || 0; run.cGold = Number(r.cGold) || 0; } };
  const tick = () => { if (GameState.started && !GameState.over) check(); };

  /* ---------- Panel «El Reino» ---------- */
  const starTxt = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

  function render() {
    const btn = document.getElementById('realmBtn');
    if (btn) btn.innerHTML = `👑 REINO · ${data.crowns}`;
    const body = document.getElementById('realmBody');
    if (!body) return;
    const maps = Object.values(MAPS).map((m) => {
      const open = unlocked(m), cur = m.id === CURRENT_MAP.id;
      return `<button class="realm-map${cur ? ' current' : ''}${open ? '' : ' locked'}" data-map="${m.id}" ${open ? '' : 'disabled'}>
        <b>🗺 ${m.name}</b><em>${open ? starTxt(stars(m.id)) : '🔒 gana el ' + MAPS[m.unlock].name}</em>
        <small>${m.desc}</small><i>${cur ? 'MAPA ACTUAL' : open ? 'JUGAR AQUÍ' : ''}</i></button>`;
    }).join('');
    const shop = Object.entries(UPGRADES).map(([k, u]) => {
      const l = data.upg[k], maxed = l >= u.max, cost = u.cost(l);
      return `<div class="realm-row"><span class="ri">${u.icon}</span>
        <div><b>${u.name}</b><small>${l ? u.now(l) : 'Sin mejorar'}${maxed ? '' : ' → ' + u.next}</small>
        <u class="pips">${'◆'.repeat(l)}${'◇'.repeat(u.max - l)}</u></div>
        <button class="realm-buy${!maxed && data.crowns < cost ? ' poor' : ''}" data-upg="${k}" ${maxed ? 'disabled' : ''}>${maxed ? 'MÁXIMO' : cost + ' 👑'}</button></div>`;
    }).join('');
    const ach = ACH.map((a) => `<div class="realm-ach${data.ach[a.id] ? ' got' : ''}"><span>${data.ach[a.id] ? a.icon : '🔒'}</span><div><b>${a.name}</b><small>${a.desc}</small></div></div>`).join('');
    const got = ACH.filter((a) => data.ach[a.id]).length;
    body.innerHTML = `<div class="realm-crowns">👑 <b>${data.crowns}</b> coronas <small>· se ganan por oleada, bajas, victorias y logros</small></div>
      <h3>MAPAS</h3><div class="realm-maps">${maps}</div>
      <h3>MEJORAS DEL REINO</h3><div class="realm-shop">${shop}</div>
      <h3>LOGROS <small>${got} / ${ACH.length}</small></h3><div class="realm-achs">${ach}</div>`;
  }

  function init() {
    const panel = document.getElementById('realmPanel');
    document.getElementById('realmBtn').addEventListener('click', () => { render(); panel.classList.add('open'); });
    document.getElementById('closeRealm').addEventListener('click', () => panel.classList.remove('open'));
    panel.addEventListener('click', (ev) => {
      const t = ev.target.closest('button');
      if (!t) return;
      if (t.dataset.map) {
        if (t.dataset.map === CURRENT_MAP.id) return;
        try { localStorage.setItem(MAP_KEY, t.dataset.map); } catch (e) { return; }
        location.reload(); // el mapa se construye al cargar
      } else if (t.dataset.upg) {
        const k = t.dataset.upg, u = UPGRADES[k], l = data.upg[k];
        if (l >= u.max || data.crowns < u.cost(l)) { if (typeof sfx !== 'undefined') sfx.deny(); return; }
        data.crowns -= u.cost(l); data.upg[k]++;
        save(); check(); render();
        if (typeof sfx !== 'undefined') sfx.click();
      }
    });
    const brand = document.querySelector('.brand small');
    if (brand) brand.textContent = CURRENT_MAP.name;
    window.addEventListener('pagehide', save);
    render();
  }

  const dataView = () => data;
  return { snapRun, restoreRun, init, applyRun, onKill, onLeak, onWave, onEnd, tick, goldMul, cdMul, data: dataView };
})();
