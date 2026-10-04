// music.js — V5.0: música procedural con WebAudio (sin archivos). Tres ambientes: calma, batalla y jefe.
const Music = (() => {
  const MOODS = {
    calm:   { bpm: 72,  prog: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]] },   // La m · Fa · Do · Sol
    battle: { bpm: 104, prog: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59]] },   // La m · Fa · Sol · Mi
    boss:   { bpm: 126, prog: [[50, 53, 57], [58, 62, 65], [55, 58, 62], [57, 61, 64]] },   // Re m · Si♭ · Sol m · La
  };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  let ctx = null, out = null, noiseBuf = null, timer = null, mood = null, step = 0, next = 0;

  // ---- V8.19: música ambiente con archivos (calma = celta, batalla = medieval). El jefe y el respaldo siguen siendo procedurales. ----
  const FILES = { calm: 'assets/audio/music_calm.mp3', battle: 'assets/audio/music_battle.mp3' };
  const LEVEL = { calm: 1.6, battle: 1.5 };
  const tracks = {};
  let fbus = null, pgain = null;
  function ensureFiles() {
    if (fbus) return;
    fbus = ctx.createGain(); fbus.connect(Sound.musicBus());
    for (const k in FILES) {
      const el = new Audio(); el.src = FILES[k]; el.loop = true; el.preload = 'auto';
      const g = ctx.createGain(); g.gain.value = 0;
      try { ctx.createMediaElementSource(el).connect(g); g.connect(fbus); } catch (e) { continue; }
      const t = tracks[k] = { el, g, failed: false, want: false, stopT: null };
      el.addEventListener('error', () => { t.failed = true; applyMood(); });
      // Se "desbloquea" dentro del primer gesto del jugador para poder reanudarla luego sin gesto (móviles).
      const p = el.play(); if (p && p.then) p.then(() => { if (!t.want) el.pause(); }).catch(() => {});
    }
  }
  const fileFor = (m) => { const t = tracks[m]; return t && !t.failed ? t : null; };
  function applyMood() {
    if (!ctx || !pgain) return;
    const now = ctx.currentTime, active = fileFor(mood);
    for (const k in tracks) {
      const t = tracks[k];
      if (t === active) {
        clearTimeout(t.stopT); t.want = true;
        const p = t.el.play(); if (p && p.catch) p.catch(() => {});
        t.g.gain.setTargetAtTime(LEVEL[k], now, 1.2);
      } else if (t.want) {
        t.want = false; t.g.gain.setTargetAtTime(0, now, 0.8);
        t.stopT = setTimeout(() => { if (!t.want) t.el.pause(); }, 3500);
      }
    }
    pgain.gain.setTargetAtTime(active ? 0 : 1, now, active ? 0.6 : 0.8);
  }

  function ensure() {
    if (ctx) return true;
    if (!Sound.unlock()) return false;
    ctx = Sound.ctx();
    out = ctx.createGain();
    pgain = ctx.createGain();
    out.connect(pgain); pgain.connect(Sound.musicBus());
    ensureFiles();
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  function voice(f, t, dur, type, vol, atk = 0.01) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
  }
  function kick(t, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.22);
  }
  function hit(t, vol, freq, dur, type = 'bandpass') {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + dur + 0.02);
  }

  // Un paso = una corchea. 8 pasos = un compás; el acorde cambia cada compás (ciclo de 4).
  function playStep(m, i, t, sd) {
    const M = MOODS[m], bar = Math.floor(i / 8) % 4, s = i % 8, ch = M.prog[bar], root = ch[0];
    if (s === 0) ch.forEach((n, k) => voice(mtof(n - 12), t, sd * 8.5, 'triangle', 0.05 - k * 0.008, sd * 2.5)); // colchón
    if (m === 'calm') {
      if (s === 0) voice(mtof(root - 24), t, sd * 7, 'sine', 0.13, 0.05);
      if (s % 2 === 0) voice(mtof(ch[(s / 2) % 3] + 12), t, sd * 3, 'sine', 0.045);
    } else if (m === 'battle') {
      voice(mtof(root - 24), t, sd * 0.9, 'triangle', s % 2 ? 0.1 : 0.16);
      voice(mtof(ch[[0, 1, 2, 1, 0, 2, 1, 2][s]] + 12), t, sd * 1.4, 'triangle', 0.04);
      if (s === 0 || s === 3 || s === 4) kick(t, 0.4);
      if (s === 2 || s === 6) hit(t, 0.13, 1900, 0.13);
    } else {
      voice(mtof(root - 24), t, sd * 0.85, 'sawtooth', s % 2 ? 0.05 : 0.085);
      voice(mtof(ch[[0, 2, 1, 2, 0, 1, 2, 1][s]] + 12), t, sd * 1.1, 'square', 0.022);
      if (s % 2 === 0) kick(t, 0.5);
      if (s === 2 || s === 6) hit(t, 0.18, 1500, 0.14);
      hit(t, 0.035, 7000, 0.04, 'highpass');
      if (s === 0 && bar % 2 === 1) voice(mtof(root + 1), t, sd * 2, 'sawtooth', 0.025, 0.02); // acorde disonante
    }
  }
  function tick() {
    if (!ctx || !mood || fileFor(mood) || ctx.state !== 'running' || Settings.get('music') <= 0 || Sound.isMuted()) { if (ctx) next = Math.max(next, ctx.currentTime); return; }
    const sd = 60 / MOODS[mood].bpm / 2;
    if (next < ctx.currentTime) next = ctx.currentTime + 0.05;
    while (next < ctx.currentTime + 0.4) { playStep(mood, step++, next, sd); next += sd; }
  }
  function setMood(m) {
    if (!ensure()) return;
    if (m === mood) return;
    mood = m; if (m) step = Math.ceil(step / 8) * 8; // cambia al inicio de un compás
    applyMood();
    if (!timer) timer = setInterval(tick, 120);
  }
  const start = () => { if (!mood) setMood('calm'); };
  const duck = (on) => { if (out) { out.gain.setTargetAtTime(on ? 0.35 : 1, ctx.currentTime, 0.1); if (fbus) fbus.gain.setTargetAtTime(on ? 0.35 : 1, ctx.currentTime, 0.1); } };
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else if (!Sound.isMuted()) ctx.resume();
  });
  return { setMood, start, duck, stop: () => setMood(null) };
})();
