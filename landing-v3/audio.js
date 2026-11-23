/* QBasic Gorillas landing: 8-bit sound effects synthesized with the Web Audio API
   (ported from the game's src/audio/soundEffects.ts). No audio files. */
(function () {
  'use strict';
  let ctx = null;
  const volume = 0.5;

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(type, f0, f1, dur, gain, delay = 0, ramp = 'exp') {
    const c = ac(); if (!c) return;
    const now = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, now);
    if (f1) {
      if (ramp === 'exp') osc.frequency.exponentialRampToValueAtTime(f1, now + dur * 0.9);
      else osc.frequency.linearRampToValueAtTime(f1, now + dur * 0.9);
    }
    g.gain.setValueAtTime(volume * gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(g); g.connect(c.destination);
    osc.start(now); osc.stop(now + dur + 0.02);
  }

  function noise(dur, cutoff, gain, curve) {
    const c = ac(); if (!c) return;
    const now = c.currentTime;
    const size = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, size, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / size, curve);
    const src = c.createBufferSource(); src.buffer = buf;
    const filter = c.createBiquadFilter(); filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, now);
    filter.frequency.exponentialRampToValueAtTime(40, now + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(volume * gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(filter); filter.connect(g); g.connect(c.destination);
    src.start(now); src.stop(now + dur);
  }

  const sounds = {
    throw() { tone('sawtooth', 220, 750, 0.2, 0.35); return 220; },
    building() { noise(0.45, 320, 0.5, 2.5); return 450; },
    gorilla() { noise(0.9, 400, 0.85, 1.5); tone('sine', 140, 30, 0.7, 0.75); return 900; },
    sun() { tone('square', 587.33, 0, 0.08, 0.2); tone('square', 880, 1174.66, 0.12, 0.2, 0.08); return 220; },
    victory() {
      const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
      const lens = [0.12, 0.12, 0.12, 0.22, 0.1, 0.4];
      let t = 0;
      notes.forEach((f, i) => { tone('square', f, 0, lens[i], 0.18, t); t += lens[i] * 0.9; });
      return Math.round(t * 1000) + 300;
    }
  };

  /** Plays a sound and returns its approximate duration in ms. */
  function play(name) {
    try { return sounds[name] ? sounds[name]() : 0; } catch { return 0; }
  }

  window.QBG = window.QBG || {};
  window.QBG.audio = { play };
})();
