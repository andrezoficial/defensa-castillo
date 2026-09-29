// audio.js
// Efectos de sonido sintetizados con WebAudio (sin archivos externos).
// El navegador solo permite audio tras un gesto del usuario, por eso el
// contexto se crea de forma perezosa en Sound.unlock().

const Sound = (() => {
  let ctx = null;
  let master = null;
  let muted = false;
  const lastPlayed = {};
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { /* sin storage */ }

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  function setMuted(value) {
    muted = !!value;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) { /* sin storage */ }
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.5, ctx.currentTime, 0.03);
  }

  // Evita que muchas torres disparando a la vez saturen el audio.
  function gate(key, ms) {
    const now = performance.now();
    if (lastPlayed[key] && now - lastPlayed[key] < ms) return false;
    lastPlayed[key] = now;
    return true;
  }

  function tone(freq, dur, type = 'sine', vol = 0.2, opts = {}) {
    if (!ctx || muted) return;
    const t = ctx.currentTime + (opts.delay || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noise(dur, vol = 0.15, freq = 1200, opts = {}) {
    if (!ctx || muted) return;
    const t = ctx.currentTime + (opts.delay || 0);
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = opts.type || 'lowpass';
    filter.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t);
  }

  const sfx = {
    click: () => tone(660, 0.05, 'square', 0.05),
    deny: () => { tone(140, 0.14, 'square', 0.12); tone(105, 0.16, 'square', 0.1, { delay: 0.08 }); },
    place: () => { tone(180, 0.14, 'triangle', 0.25); noise(0.1, 0.12, 700); tone(360, 0.09, 'sine', 0.1, { delay: 0.05 }); },
    upgrade: () => { [392, 494, 587].forEach((f, i) => tone(f, 0.16, 'triangle', 0.16, { delay: i * 0.07 })); },
    sell: () => { tone(880, 0.07, 'square', 0.07); tone(1175, 0.12, 'square', 0.07, { delay: 0.06 }); },
    wave: () => { tone(196, 0.4, 'sawtooth', 0.13); tone(294, 0.5, 'sawtooth', 0.1, { delay: 0.18 }); },
    boss: () => { tone(82, 0.7, 'sawtooth', 0.2); tone(110, 0.8, 'sawtooth', 0.14, { delay: 0.25 }); noise(0.5, 0.1, 300); },
    shoot: (type) => {
      if (!gate('shoot-' + type, 70)) return;
      if (type === 'basic') { noise(0.07, 0.07, 3000, { type: 'highpass' }); tone(520, 0.06, 'triangle', 0.05, { slideTo: 300 }); }
      else if (type === 'slow') tone(700, 0.18, 'sine', 0.07, { slideTo: 1200 });
      else { tone(95, 0.2, 'sine', 0.2, { slideTo: 55 }); noise(0.12, 0.06, 500); }
    },
    kill: (isBoss) => {
      if (isBoss) { tone(120, 0.7, 'sawtooth', 0.2, { slideTo: 40 }); noise(0.6, 0.18, 800); return; }
      if (!gate('kill', 50)) return;
      tone(260, 0.1, 'triangle', 0.09, { slideTo: 120 });
    },
    leak: () => { tone(90, 0.35, 'sawtooth', 0.2, { slideTo: 60 }); },
    waveDone: () => { [523, 659, 784].forEach((f, i) => tone(f, 0.18, 'triangle', 0.13, { delay: i * 0.09 })); },
    win: () => { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.28, 'triangle', 0.16, { delay: i * 0.14 })); },
    lose: () => { [330, 247, 196, 147].forEach((f, i) => tone(f, 0.45, 'sawtooth', 0.14, { delay: i * 0.22 })); },
  };

  return { unlock, setMuted, isMuted: () => muted, sfx };
})();

const sfx = Sound.sfx;
