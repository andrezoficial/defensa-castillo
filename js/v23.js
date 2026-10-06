/* V23 — Sensación de juego comercial
 * Capa de presentación: objetivos, amenazas, transiciones, recompensas y resultados.
 * No sustituye la lógica del combate; observa GameState y se integra con el HUD existente.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const safe = (fn, ...args) => { try { if (typeof fn === 'function') fn(...args); } catch (_) {} };
  let lastWave = -1, lastActive = false, lastLives = -1, lastOver = false, rewardTimer = 0;

  const objectives = (wave) => {
    const boss = wave > 0 && wave % BOSS_WAVE_INTERVAL === 0;
    if (boss) return { text: 'Derrota al jefe y protege la fortaleza', progress: 0 };
    if (!wave) return { text: 'Construye defensas antes de la primera oleada', progress: 0 };
    const step = wave % BOSS_WAVE_INTERVAL || BOSS_WAVE_INTERVAL;
    return { text: `Resiste hasta la oleada ${Math.min(wave + 1, WIN_WAVE)}`, progress: Math.round((step / BOSS_WAVE_INTERVAL) * 100) };
  };

  function toast(icon, title, sub, good = false) {
    const stack = $('v23ToastStack'); if (!stack) return;
    const el = document.createElement('div'); el.className = 'v23-toast' + (good ? ' good' : '');
    el.innerHTML = `<span>${icon}</span><div><b>${title}</b><small>${sub}</small></div>`;
    stack.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3000);
  }

  function transition(title, sub, boss = false) {
    const el = $('v23Transition'); if (!el) return;
    $('v23TransitionTitle').textContent = title;
    $('v23TransitionSub').textContent = sub;
    el.classList.toggle('boss', boss);
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1700);
  }

  function updateMission() {
    const o = objectives(GameState.wave);
    const text = $('v23MissionText'), prog = $('v23MissionProgress');
    if (text) text.textContent = o.text;
    if (prog) prog.textContent = `${o.progress}%`;
  }

  function updateThreats() {
    const live = GameState.enemies.filter(e => !e.dead);
    const count = live.length;
    const box = $('v23Threats');
    if (!box) return;
    $('v23ThreatCount').textContent = count;
    box.classList.toggle('danger', count >= 8 || GameState.lives <= 5);
    const bosses = live.filter(e => e.isBoss).length;
    box.querySelector('b').textContent = bosses ? 'JEFE ACTIVO' : (GameState.spawning ? 'ENEMIGOS ENTRANDO' : 'AMENAZAS');
  }

  function updateResult() {
    const ribbon = $('v23ResultRibbon'), reward = $('v23RewardSummary');
    if (!ribbon || !reward) return;
    const win = GameState.wave >= WIN_WAVE && GameState.lives > 0;
    ribbon.textContent = win ? 'REINO SALVADO' : 'ÚLTIMA LÍNEA ROTA';
    reward.innerHTML = `<div class="v23-reward-row"><span>👑</span><b>+${typeof Progress !== 'undefined' && Progress.data ? Progress.data().crowns || 0 : 0} coronas</b><small>Progreso del reino guardado</small></div>`;
  }

  function tick() {
    if (typeof GameState === 'undefined') return;
    const wave = GameState.wave;
    if (wave !== lastWave) {
      if (wave > 0) {
        const boss = wave % BOSS_WAVE_INTERVAL === 0;
        transition(boss ? 'JEFE ENTRANTE' : `OLEADA ${wave}`, boss ? 'Una amenaza legendaria entra al campo' : 'Las defensas están bajo presión', boss);
        toast(boss ? '♛' : '⚔', boss ? 'Jefe detectado' : `Oleada ${wave}`, boss ? 'Prepara tus habilidades.' : 'Protege el castillo.', false);
      }
      lastWave = wave;
      updateMission();
    }
    const active = !!GameState.waveActive;
    if (active !== lastActive) {
      if (!active && lastActive && wave > 0) {
        const gold = 25 + wave * 3;
        toast('✦', 'OLEADA SUPERADA', `Recompensa de fortaleza: +${gold} oro`, true);
      }
      lastActive = active;
    }
    if (GameState.lives !== lastLives) {
      if (lastLives >= 0 && GameState.lives < lastLives) toast('♥', 'FORTALEZA DAÑADA', `${GameState.lives} vidas restantes`, false);
      lastLives = GameState.lives;
    }
    const over = !!GameState.over;
    if (over && !lastOver) updateResult();
    lastOver = over;
    updateThreats();
    updateMission();
    requestAnimationFrame(tick);
  }

  function bind() {
    document.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b && !b.disabled) safe(window.sfx && window.sfx.click);
    }, { passive: true });
    const start = $('startGameBtn');
    if (start) start.addEventListener('click', () => setTimeout(() => transition('DEFENSA INICIADA', 'Las murallas esperan tu estrategia'), 120));
    updateMission();
    requestAnimationFrame(tick);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();
