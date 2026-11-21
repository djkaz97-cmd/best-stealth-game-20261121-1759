// Sound with no files: every cue is synthesised by the Web Audio API, so the
// game still loads nothing but its own source. The watch's footsteps are panned
// left and right by where they walk, which is how you hear a patrol behind a
// wall before its lantern rounds the corner.

import { clamp } from './utils.js';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
    this.muted = false;
    this.ready = false;
    this.drone = null;
  }

  // Browsers only allow audio after a gesture; main.js calls this on the first key.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.6;
      this.master.connect(this.ctx.destination);
      this.noiseBuffer = this.buildNoise(1.2);
      this.ready = true;
      this.startDrone();
    } catch {
      this.ctx = null;
      this.ready = false;
    }
  }

  buildNoise(seconds) {
    const rate = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, Math.floor(rate * seconds), rate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  startDrone() {
    if (!this.ready || this.drone) return;
    try {
      const ctx = this.ctx;
      const bus = ctx.createGain();
      bus.gain.value = 0.035;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 220;
      filter.connect(bus);
      bus.connect(this.master);
      const a = ctx.createOscillator();
      a.type = 'sine';
      a.frequency.value = 55;
      const b = ctx.createOscillator();
      b.type = 'triangle';
      b.frequency.value = 82.4;
      const bGain = ctx.createGain();
      bGain.gain.value = 0.35;
      a.connect(filter);
      b.connect(bGain).connect(filter);
      a.start();
      b.start();
      this.drone = { a, b, bus };
    } catch {
      this.drone = null;
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.6, this.ctx.currentTime, 0.05);
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  noiseBurst({ freq, q = 0.9, duration = 0.1, volume = 0.08, pan = 0, type = 'bandpass' }) {
    if (!this.ready || this.muted) return;
    try {
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = freq;
      filter.Q.value = q;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      let tail = filter;
      src.connect(filter);
      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        panner.pan.value = clamp(pan, -1, 1);
        filter.connect(panner);
        tail = panner;
      }
      tail.connect(gain);
      gain.connect(this.master);
      src.start(now);
      src.stop(now + duration + 0.03);
    } catch {
      /* a lost audio context never breaks the game */
    }
  }

  tone({ freq, type = 'sine', duration = 0.2, volume = 0.06, pan = 0, slide = null, when = 0 }) {
    if (!this.ready || this.muted) return;
    try {
      const ctx = this.ctx;
      const now = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slide), now + duration);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      let tail = osc;
      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        panner.pan.value = clamp(pan, -1, 1);
        osc.connect(panner);
        tail = panner;
      }
      tail.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + duration + 0.03);
    } catch {
      /* ignore */
    }
  }

  playerStep(intensity = 1) {
    this.noiseBurst({ freq: 210, q: 1.4, duration: 0.08, volume: 0.05 * intensity });
    this.tone({ freq: 74, type: 'sine', duration: 0.07, volume: 0.035 * intensity });
  }

  guardFootstep(guard, playerX, playerY) {
    if (!this.ready) return;
    const dx = guard.x - playerX;
    const distance = Math.hypot(dx, guard.y - playerY);
    if (distance > 800) return;
    const pan = dx / 560;
    const volume = Math.max(0.003, 0.12 * (1 - distance / 840) * (guard.state === 'alert' ? 1.5 : 1));
    this.noiseBurst({ freq: 300 + guard.index * 26, q: 1.1, duration: 0.11, volume, pan });
    this.tone({ freq: 128, type: 'sine', duration: 0.1, volume: volume * 0.7, pan, slide: 78 });
  }

  heartbeat(intensity) {
    this.tone({ freq: 52, type: 'sine', duration: 0.13, volume: 0.06 * intensity, slide: 44 });
    this.tone({ freq: 47, type: 'sine', duration: 0.11, volume: 0.045 * intensity, when: 0.16, slide: 40 });
  }

  suspicion() {
    this.tone({ freq: 392, type: 'triangle', duration: 0.16, volume: 0.03, slide: 311 });
  }

  pickup() {
    this.tone({ freq: 523, type: 'sine', duration: 0.34, volume: 0.06 });
    this.tone({ freq: 659, type: 'sine', duration: 0.34, volume: 0.055, when: 0.09 });
    this.tone({ freq: 880, type: 'sine', duration: 0.5, volume: 0.05, when: 0.18 });
  }

  alarmPulse() {
    this.tone({ freq: 620, type: 'triangle', duration: 0.22, volume: 0.035, slide: 480 });
  }

  win() {
    const notes = [392, 494, 587, 784];
    notes.forEach((freq, i) => this.tone({ freq, type: 'sine', duration: 0.85, volume: 0.06, when: i * 0.11 }));
    this.tone({ freq: 196, type: 'triangle', duration: 1.2, volume: 0.035 });
  }

  lose() {
    this.tone({ freq: 220, type: 'triangle', duration: 0.8, volume: 0.06, slide: 98 });
    this.tone({ freq: 164, type: 'sine', duration: 1.0, volume: 0.05, when: 0.18, slide: 82 });
  }

  click() {
    this.tone({ freq: 540, type: 'square', duration: 0.05, volume: 0.015 });
  }
}
