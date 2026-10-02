// settings.js — V5.0: configuración persistente, pulido móvil (pantalla completa, bloqueo de suspensión, vibración).
const SETTINGS_KEY = 'defensa-castillo-settings';

const Settings = (() => {
  const defs = { music: 0.6, sfx: 0.8, quality: 'auto', shadows: true, dmg: true, shake: true, vibrate: true };
  const v = { ...defs };
  try { Object.assign(v, JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}); } catch (e) { /* sin guardado */ }
  const persist = () => { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(v)); } catch (e) { /* modo privado */ } };
  const get = (k) => v[k];
  const shakeMul = () => (v.shake ? 1 : 0);
  const buzz = (ms) => { if (v.vibrate && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* no soportado */ } } };

  // Calidad y sombras: se aplican cuando el motor 3D ya existe.
  function applyGfx() {
    if (typeof renderer === 'undefined' || !renderer) return;
    const dpr = window.devicePixelRatio || 1;
    S.prMax = v.quality === 'low' ? 1 : v.quality === 'high' ? Math.min(dpr, 2) : Math.min(dpr, S.lowPower ? 1.5 : 2);
    S.pr = S.prMax;
    renderer.setPixelRatio(S.pr);
    if (S.sun) S.sun.castShadow = !!v.shadows;
    fit();
  }
  function set(k, val) {
    v[k] = val; persist();
    if (k === 'music' || k === 'sfx') Sound.applyVolume();
    if (k === 'quality' || k === 'shadows') applyGfx();
  }

  /* ---------- Pantalla completa y suspensión ---------- */
  const canFS = !!(document.documentElement.requestFullscreen);
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) { await document.exitFullscreen(); return; }
      await document.documentElement.requestFullscreen();
    } catch (e) { /* el navegador lo rechazó */ }
  }
  let wake = null;
  async function keepAwake() {
    try { if (navigator.wakeLock && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch (e) { /* sin permiso */ }
  }

  /* ---------- Panel ---------- */
  let pausedByPanel = false;
  const toggle = (k, label, hint) => `<label class="set-row"><span>${label}${hint ? `<small>${hint}</small>` : ''}</span><span class="switch"><input type="checkbox" data-k="${k}" ${v[k] ? 'checked' : ''}><i></i></span></label>`;
  const slider = (k, label) => `<label class="set-row"><span>${label}</span><input type="range" min="0" max="100" value="${Math.round(v[k] * 100)}" data-k="${k}"><b class="set-val">${Math.round(v[k] * 100)}%</b></label>`;

  function render() {
    $('settingsBody').innerHTML =
      slider('music', '🎵 Música') + slider('sfx', '🔊 Efectos') +
      `<label class="set-row"><span>🖥 Calidad gráfica<small>Auto baja sola la resolución si hay lag</small></span><select data-k="quality">
        ${[['auto', 'Automática'], ['low', 'Baja (ahorra batería)'], ['high', 'Alta']].map(([id, n]) => `<option value="${id}" ${v.quality === id ? 'selected' : ''}>${n}</option>`).join('')}</select></label>` +
      toggle('shadows', '🌗 Sombras', 'Desactívalas si va lento') + toggle('dmg', '💥 Números de daño') + toggle('shake', '📳 Sacudida de cámara') +
      (navigator.vibrate ? toggle('vibrate', '📱 Vibración', 'Al colarse un enemigo') : '') +
      (canFS ? `<div class="set-row"><span>⛶ Pantalla completa</span><button class="set-btn" data-act="fs">ACTIVAR / SALIR</button></div>` : '') +
      `<div class="set-row"><span>💾 Partida guardada<small>${Save.has() ? Save.label() : 'No hay ninguna'}</small></span><button class="set-btn danger" data-act="delsave" ${Save.has() ? '' : 'disabled'}>BORRAR</button></div>` +
      `<div class="set-row"><span>👑 Progreso del reino<small>Coronas, mejoras, estrellas y logros</small></span><button class="set-btn danger" data-act="delall">REINICIAR</button></div>`;
  }
  function open() {
    render();
    $('settingsPanel').classList.add('open');
    if (typeof canAct === 'function' && canAct()) { togglePause(); pausedByPanel = true; }
  }
  function close() {
    $('settingsPanel').classList.remove('open');
    if (pausedByPanel) { pausedByPanel = false; if (GameState.paused) togglePause(); }
  }
  function init() {
    const panel = $('settingsPanel');
    ['settingsBtn', 'settingsBtnStart'].forEach((id) => $(id).addEventListener('click', open));
    $('closeSettings').addEventListener('click', close);
    panel.addEventListener('pointerdown', (e) => { if (e.target === panel) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('open')) { e.stopPropagation(); close(); } }, true);
    panel.addEventListener('input', (e) => {
      const t = e.target, k = t.dataset.k;
      if (!k) return;
      if (t.type === 'range') { t.nextElementSibling.textContent = t.value + '%'; set(k, t.value / 100); }
    });
    panel.addEventListener('change', (e) => {
      const t = e.target, k = t.dataset.k;
      if (!k) return;
      if (t.type === 'range') { if (k === 'sfx') sfx.click(); }
      else if (t.type === 'checkbox') set(k, t.checked);
      else if (t.tagName === 'SELECT') set(k, t.value);
    });
    panel.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      if (b.dataset.act === 'fs') toggleFullscreen();
      if (b.dataset.act === 'delsave' && confirm('¿Borrar la partida guardada?')) { Save.clear(); render(); }
      if (b.dataset.act === 'delall' && confirm('Se borrarán coronas, mejoras, estrellas, logros y la partida guardada. ¿Seguro?')) {
        try { [SAVE_KEY, RUN_KEY, BEST_WAVE_KEY].forEach((k) => localStorage.removeItem(k)); } catch (err) { /* modo privado */ }
        location.reload();
      }
    });
    // Móvil: sin menú contextual al mantener pulsado y pantalla siempre encendida mientras se juega.
    if (matchMedia('(pointer:coarse)').matches) document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('visibilitychange', () => { if (!document.hidden && GameState.started) keepAwake(); });
    $('startGameBtn').addEventListener('click', keepAwake);
    $('continueSaveBtn').addEventListener('click', keepAwake);
  }
  return { get, set, init, applyGfx, shakeMul, buzz };
})();
