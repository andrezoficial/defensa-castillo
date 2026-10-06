// tutorial.js — V8.21: tutorial interactivo dentro del juego.
// Guía a la persona paso a paso en una primera oleada real: construir, mejorar, habilidades y consejos.
// No toca la lógica de combate: solo observa GameState (cada 150 ms) y dibuja una tarjeta, marcadores sobre el mapa
// y un resalte en los botones del HUD. Se ofrece una sola vez a quien juega por primera vez y se repite desde «CÓMO JUGAR».
const TUT_KEY = 'defensa-castillo-tutorial';

const Tutorial = (() => {
  const rd = () => { try { return localStorage.getItem(TUT_KEY); } catch (e) { return null; } };
  const wr = (v) => { try { localStorage.setItem(TUT_KEY, v); } catch (e) { /* modo privado */ } };
  const coarse = () => !!(window.matchMedia && matchMedia('(pointer:coarse)').matches);
  const kb = (k) => (coarse() ? '' : ` <kbd>${k}</kbd>`);

  let active = false, idx = -1, pending = false, minimized = false;
  let card = null, offer = null, markEls = [], hlEl = null, raf = 0, timer = 0;
  const plan = {};

  /* ---------- Utilidades de mapa ---------- */
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function pathSamples() {
    const out = [];
    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
      const a = PATH_POINTS[i], b = PATH_POINTS[i + 1], n = Math.max(1, Math.ceil(dist(a, b) / 8));
      for (let k = 0; k < n; k++) out.push({ x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n });
    }
    return out.filter((p) => p.x >= 0 && p.x <= GAME_WIDTH);
  }
  // La casilla que más camino cubre con el alcance dado: curvas y rectas que se pliegan sobre sí mismas.
  function bestSlot(slots, range) {
    const pts = pathSamples();
    let best = null, bs = -1;
    for (const s of slots) {
      let c = 0;
      for (const p of pts) if (dist(s, p) <= range) c++;
      if (c > bs) { bs = c; best = s; }
    }
    return best;
  }
  const freeSlots = () => GameState.buildSlots.filter((s) => !GameState.towers.some((t) => t.x === s.x && t.y === s.y));
  function planArcher() { plan.archer = bestSlot(freeSlots(), TOWER_DEFS.basic.range); }
  function planWizard() {
    const anchor = GameState.towers[0] || plan.archer, free = freeSlots().filter((s) => !anchor || dist(s, anchor) >= BUILD_GRID_SIZE);
    const near = anchor ? free.filter((s) => dist(s, anchor) <= 110) : free;
    plan.wizard = bestSlot(near.length ? near : free, TOWER_DEFS.slow.range);
  }
  function project(x, z, y) {
    const v = new THREE.Vector3(x, y == null ? 6 : y, z).project(cam);
    if (v.z > 1) return null;
    return { x: (v.x * 0.5 + 0.5) * host.clientWidth, y: (-v.y * 0.5 + 0.5) * host.clientHeight };
  }
  const towerOf = (type) => GameState.towers.find((t) => t.type === type) || GameState.towers[0];
  const pathStart = () => {
    const a = PATH_POINTS[0], b = PATH_POINTS[1], d = dist(a, b) || 1;
    return { x: a.x + (b.x - a.x) * 50 / d, y: a.y + (b.y - a.y) * 50 / d };
  };
  const waveEnded = () => GameState.wave >= 1 && !GameState.waveActive && !GameState.spawning;
  const topUp = (need) => {
    if (GameState.gold >= need) return;
    const add = need - GameState.gold;
    GameState.gold = need; updateHUD();
    if (typeof showRewardToast === 'function') showRewardToast(`Refuerzos del reino · +${add} ✦`);
  };

  /* ---------- Pasos ---------- */
  // next: true → botón «Siguiente». done(): avanza sola cuando se cumple. target: selector a resaltar. marks(): marcadores sobre el mapa.
  // enter(): se ejecuta al llegar al paso. skip(): true → el paso se salta.
  const STEPS = [
    { title: '¡Bienvenido, comandante!', next: true,
      text: 'Los enemigos entran por la <b>ENTRADA</b> y siguen el camino hasta tu <b>CASTILLO</b>. Cada uno que llega te cuesta <b>1 vida</b> (un jefe, 5). Sobrevive <b>15 oleadas</b> para ganar. Haremos una oleada de práctica juntos.',
      marks: () => [{ ...pathStart(), label: 'ENTRADA' }, { x: 775, y: 150, label: 'CASTILLO' }] },
    { title: 'Tu panel de mando', next: true, target: '#topbar .stats',
      text: 'Arriba ves tu <b>ORO ✦</b> (sirve para construir y mejorar), tus <b>VIDAS ♥</b> y la <b>OLEADA</b> actual. Ganas oro al derrotar enemigos y al superar cada oleada.' },
    { title: 'Elige una torre', target: '#towerBasic',
      done: () => GameState.selectedTower === 'basic' || GameState.towers.length >= 1,
      text: `Toca <b>ARQUEROS</b> (50 ✦) en la barra de abajo${kb('1')}. Disparan rápido y son baratos: la base de cualquier defensa.` },
    { title: 'Constrúyela junto al camino',
      enter: planArcher,
      target: () => (GameState.selectedTower ? null : '#towerBasic'),
      marks: () => (plan.archer ? [{ ...plan.archer, label: 'AQUÍ' }] : []),
      done: () => GameState.towers.length >= 1,
      text: `Toca la casilla marcada. ${coarse() ? 'En el móvil, <b>arrastra</b> el dedo hasta ella y suelta.' : ''} Las <b>curvas</b> del camino son ideales: los enemigos pasan más tiempo a tu alcance. Si se deselecciona, vuelve a tocar ARQUEROS.` },
    { title: 'Ahora, un hechicero', target: '#towerSlow',
      enter: () => topUp(TOWER_DEFS.slow.cost),
      done: () => GameState.selectedTower === 'slow' || GameState.towers.some((t) => t.type === 'slow'),
      text: `Elige <b>HECHICERO</b> (75 ✦)${kb('2')}. Hace poco daño, pero <b>ralentiza</b> a los enemigos y su magia ignora la armadura: clave contra blindados, espectros y jefes.` },
    { title: 'Colócalo cerca de los arqueros',
      enter: planWizard,
      target: () => (GameState.selectedTower ? null : '#towerSlow'),
      marks: () => (plan.wizard ? [{ ...plan.wizard, label: 'AQUÍ' }] : []),
      done: () => GameState.towers.some((t) => t.type === 'slow'),
      text: 'Los enemigos frenados pasan más rato bajo las flechas. Pon el hechicero cerca de tus arqueros.' },
    { title: 'Toca una torre para gestionarla',
      marks: () => { const t = towerOf('basic'); return t ? [{ x: t.x, y: t.y, label: 'TÓCALA' }] : []; },
      done: () => !!GameState.selectedPlacedTower,
      text: 'Toca tu torre de <b>arqueros</b> para abrir su panel.' },
    { title: 'El panel de torre', next: true, target: '#towerPanel',
      text: 'Aquí ves <b>daño, rango y cadencia</b>. <b>MEJORAR</b> sube de nivel (máx. 3)' + '. <b>VENDER</b> devuelve el 60 % del oro. <b>OBJETIVO</b> decide a quién ataca: el más adelantado, el más fuerte o el más cercano.',
      leave: () => clearSelection() },
    { title: '¡Lanza la primera oleada!', target: '#waveBtn',
      done: () => GameState.wave >= 1,
      text: `Pulsa <b>INICIAR OLEADA 1</b>${kb('Espacio')}. El botón te avisa de lo que viene: cantidad de enemigos, veloces, blindados, especiales y <b>♛ jefe</b>.` },
    { title: 'Usa una habilidad', target: '#abilityBar',
      done: () => GameState.furyUntil > 0 || waveEnded(),
      text: `Tienes 3 poderes con enfriamiento: <b>☄ Meteoro</b>${kb('Z')}, <b>❄ Escarcha</b>${kb('X')} y <b>⚡ Furia Real</b>${kb('C')}. Prueba ahora <b>⚡ Furia Real</b>: todas tus torres disparan un 70 % más rápido durante 7 s.` },
    { title: 'Controla el ritmo', next: true, target: '#speedControls', done: waveEnded,
      text: `<b>»</b> acelera el juego ×2${kb('F')} y <b>Ⅱ</b> pausa${kb('P')}. Con <b>⟲ ⟳ + −</b> giras y acercas la cámara${kb('Q / E')}${coarse() ? '; también puedes pellizcar para hacer zoom' : ' (y la rueda del ratón)'}.` },
    { title: 'Resiste…', skip: waveEnded, done: waveEnded,
      text: 'Cuando caiga el último enemigo ganarás <b>oro de recompensa</b>. Mientras tanto, observa cómo trabajan tus torres.' },
    { title: '¡Oleada superada!',
      skip: () => !GameState.towers.length,
      enter: () => { const t = towerOf('basic'); if (t && t.level < MAX_TOWER_LEVEL) topUp(getUpgradeCost(t.type, t.level)); },
      target: () => (GameState.selectedPlacedTower ? '#upgradeBtn' : null),
      marks: () => { const t = towerOf('basic'); return t && !GameState.selectedPlacedTower ? [{ x: t.x, y: t.y, label: 'MEJÓRALA' }] : []; },
      done: () => GameState.towers.some((t) => t.level >= 2),
      text: `Gastar el oro entre oleadas es la clave. Toca tu torre de arqueros y pulsa <b>MEJORAR</b>${kb('U')} para subirla de nivel.` },
    { title: 'Especializaciones', next: true,
      enter: () => clearSelection(),
      text: 'Al llegar al <b>nivel 3</b>, cada torre elige <b>un camino permanente</b>: Arqueros → <i>Francotirador</i> o <i>Ráfaga</i> · Hechicero → <i>Glacial</i> o <i>Tormenta</i> · Catapulta → <i>Bombardera</i> o <i>Incendiaria</i>. Toca una opción para ver qué hace y otra vez para confirmar.' },
    { title: 'Conoce a tus enemigos', next: true,
      text: '<b>Plaga</b> (oleada 3): rápida y numerosa, la catapulta la barre. <b>Ogro Bruto</b> (4): resiste las flechas, usa magia y catapulta. <b>Saboteador</b> (4): apaga tus torres, ¡elimínalo primero! <b>Chamán</b> (6): cura a los demás. <b>Espectro</b> (8): resiste flechas y asedio, vulnerable a la magia. Verás un aviso la primera vez que salga cada uno.' },
    { title: 'Los jefes', next: true,
      text: 'Cada <b>5 oleadas</b> llega un jefe con fases: se vuelve invulnerable un instante, invoca refuerzos, se enfurece o aturde tus torres. Guarda <b>❄ Escarcha</b> y <b>⚡ Furia Real</b> para esos momentos. Si un jefe llega al castillo, pierdes 5 vidas.' },
    { title: 'Progreso y guardado', next: true,
      text: 'Al ganar recibes <b>★ estrellas</b> según las vidas que conserves y <b>👑 coronas</b> para mejoras permanentes en <b>REINO</b>. La partida se <b>guarda sola</b> al terminar cada oleada: puedes salir y pulsar <b>CONTINUAR</b> cuando quieras.' },
    { title: '¡Entrenamiento completo!', last: true,
      text: () => `Esta partida sigue en marcha: te quedan <b>${Math.max(0, WIN_WAVE - GameState.wave)} oleadas</b> para salvar el reino. Puedes repetir el tutorial desde <b>CÓMO JUGAR</b>. ¡Buena defensa!` },
  ];

  /* ---------- DOM ---------- */
  function build() {
    if (card) return;
    card = document.createElement('div');
    card.id = 'tutCard';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-live', 'polite');
    card.innerHTML =
      '<div class="tut-top"><span class="tut-step"></span><button type="button" class="tut-min" aria-label="Minimizar">–</button></div>' +
      '<h3 class="tut-title"></h3><p class="tut-text"></p>' +
      '<div class="tut-actions"><button type="button" class="tut-quit">Omitir tutorial</button><span class="tut-spacer"></span>' +
      '<button type="button" class="tut-skipstep">Saltar paso ›</button><button type="button" class="tut-next">Siguiente ▸</button></div>';
    host.appendChild(card);
    card.querySelector('.tut-min').addEventListener('click', () => { minimized = !minimized; render(); });
    card.querySelector('.tut-quit').addEventListener('click', () => stop('skipped'));
    card.querySelector('.tut-skipstep').addEventListener('click', () => go(idx + 1));
    card.querySelector('.tut-next').addEventListener('click', () => (STEPS[idx].last ? stop('done') : go(idx + 1)));
    card.addEventListener('pointerdown', (e) => e.stopPropagation());
  }

  function clearHighlights() {
    if (hlEl) { hlEl.classList.remove('tut-hl'); hlEl = null; }
    markEls.forEach((m) => m.remove());
    markEls = [];
  }

  function render() {
    if (!card) return;
    const st = STEPS[idx];
    if (!active || !st || GameState.over) { card.style.display = 'none'; clearHighlights(); return; }
    card.style.display = 'block';
    card.classList.toggle('min', minimized);
    card.querySelector('.tut-min').textContent = minimized ? '+' : '–';
    card.querySelector('.tut-step').textContent = `TUTORIAL · ${idx + 1} / ${STEPS.length}`;
    card.querySelector('.tut-title').textContent = st.title;
    card.querySelector('.tut-text').innerHTML = typeof st.text === 'function' ? st.text() : st.text;
    const action = !st.next && !st.last;
    card.querySelector('.tut-next').style.display = action ? 'none' : '';
    card.querySelector('.tut-next').textContent = st.last ? '¡A DEFENDER! ⚔' : 'Siguiente ▸';
    card.querySelector('.tut-skipstep').style.display = action ? '' : 'none';
    card.querySelector('.tut-quit').style.display = st.last ? 'none' : '';
  }

  // Resalta el botón (o los marcadores del mapa) del paso actual.
  function refreshTargets() {
    const st = STEPS[idx];
    const sel = st && (typeof st.target === 'function' ? st.target() : st.target);
    const el = sel ? document.querySelector(sel) : null;
    const visible = el && el.offsetParent !== null ? el : null;
    if (visible !== hlEl) {
      if (hlEl) hlEl.classList.remove('tut-hl');
      hlEl = visible;
      if (hlEl) hlEl.classList.add('tut-hl');
    }
  }

  function syncMarkers() {
    const st = STEPS[idx];
    const list = active && st && st.marks && !GameState.over ? st.marks() : [];
    while (markEls.length < list.length) {
      const m = document.createElement('div');
      m.className = 'tut-mark';
      m.innerHTML = '<span class="tut-mark-label"></span><i></i>';
      host.appendChild(m); markEls.push(m);
    }
    while (markEls.length > list.length) markEls.pop().remove();
    list.forEach((p, i) => {
      const pos = project(p.x, p.y), m = markEls[i];
      m.style.display = pos ? '' : 'none';
      if (pos) { m.style.left = pos.x + 'px'; m.style.top = pos.y + 'px'; }
      const lab = m.firstChild;
      if (lab.textContent !== p.label) lab.textContent = p.label;
    });
  }

  function loop() {
    if (!active) return;
    syncMarkers();
    raf = requestAnimationFrame(loop);
  }

  /* ---------- Flujo ---------- */
  function go(n) {
    const prev = STEPS[idx];
    if (prev && prev.leave) prev.leave();
    idx = n;
    while (idx < STEPS.length && STEPS[idx].skip && STEPS[idx].skip()) idx++;
    if (idx >= STEPS.length) { stop('done'); return; }
    const st = STEPS[idx];
    if (st.enter) st.enter();
    minimized = false;
    render(); refreshTargets(); syncMarkers();
    if (typeof sfx !== 'undefined' && sfx.click) sfx.click();
  }

  function tick() {
    if (!active) return;
    if (GameState.over) { stop(); return; }
    const st = STEPS[idx];
    if (!st) return;
    if (st.done && st.done()) { go(idx + 1); return; }
    if (!card || card.style.display === 'none') render();
    if (st.text && typeof st.text === 'function') card.querySelector('.tut-text').innerHTML = st.text();
    refreshTargets();
  }

  function begin() {
    build();
    active = true; pending = false; idx = -1;
    clearTimeout(timer);
    go(0);
    clearInterval(tick._iv);
    tick._iv = setInterval(tick, 150);
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function stop(how) {
    active = false;
    if (how) wr(how);
    clearInterval(tick._iv);
    cancelAnimationFrame(raf);
    clearHighlights();
    if (card) card.style.display = 'none';
    if (idx >= 0 && STEPS[idx] && STEPS[idx].leave) STEPS[idx].leave();
    idx = -1;
  }

  /* ---------- Invitación para quien juega por primera vez ---------- */
  function showOffer() {
    if (!offer) {
      offer = document.createElement('div');
      offer.id = 'tutOffer';
      offer.setAttribute('role', 'dialog');
      offer.innerHTML =
        '<div class="tut-offer-card"><div class="tut-offer-crest">🎓</div><h3>¿Primera vez defendiendo el castillo?</h3>' +
        '<p>Te guío en una oleada de práctica: construir, mejorar y usar habilidades. Dura unos 3 minutos y puedes omitirlo cuando quieras.</p>' +
        '<button type="button" class="tut-offer-yes">EMPEZAR TUTORIAL</button><button type="button" class="tut-offer-no">Ya sé jugar</button></div>';
      host.appendChild(offer);
      offer.addEventListener('pointerdown', (e) => e.stopPropagation());
      offer.querySelector('.tut-offer-yes').addEventListener('click', () => { offer.style.display = 'none'; begin(); });
      offer.querySelector('.tut-offer-no').addEventListener('click', () => { offer.style.display = 'none'; wr('skipped'); });
    }
    offer.style.display = 'flex';
  }

  // Lo llama beginGame() al empezar cualquier partida.
  function onBegin() {
    if (pending) { begin(); return; }
    if (rd() || Save.has() || readBestWave() > 0) return; // ya lo vio, o ya ha jugado antes
    showOffer();
  }

  function init() {
    const b = document.getElementById('tutStartBtn');
    if (!b) return;
    b.addEventListener('click', () => {
      if (!GameState.ready || GameState.started) return;
      if (Save.has() && !confirm('El tutorial empieza una partida nueva y reemplazará tu partida guardada al terminar la primera oleada. ¿Continuar?')) return;
      pending = true;
      document.getElementById('howToPanel').classList.remove('open');
      beginGame();
    });
  }

  return { init, onBegin, stop, get active() { return active; } };
})();
