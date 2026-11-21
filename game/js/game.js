// The night itself: level loading, the fixed-step loop, suspicion and the alarm,
// picking up the Emberglass, the night door, and the four states a run can be in
// (title, playing, paused, win/lose).

import { LEVELS, createLevel } from './level.js';
import { Player } from './player.js';
import { Guard } from './guards.js';
import { Renderer } from './render.js';
import { TUNING, GUARD_TUNING } from './config.js';
import { clamp, distance } from './utils.js';

const STEP = 1 / 120;

export class Game {
  constructor({ canvas, audio, input }) {
    this.canvas = canvas;
    this.audio = audio;
    this.input = input;
    this.hud = null;
    this.renderer = new Renderer(canvas);
    this.state = 'title';
    this.levelIndex = 0;
    this.level = null;
    this.player = null;
    this.guards = [];
    this.time = 0;
    this.totalTime = 0;
    this.meter = 0;
    this.alarm = 0;
    this.seenCount = 0;
    this.hasObjective = false;
    this.effects = [];
    this.anim = 0;
    this.acc = 0;
    this.grace = 0;
    this.spotted = false;
    this.recover = 0;
    this.seenNow = false;
    this.seerGuard = null;
    this.shake = 0;
    this.freeze = false;
    this.heartbeatTimer = 0;
    this.alarmTimer = 0;
    this.best = this.readBest();
    this.loadLevel(0);
    this.state = 'title';
  }

  attachHud(hud) {
    this.hud = hud;
    hud.update(this);
    hud.showScreen('title');
  }

  readBest() {
    try {
      const raw = window.localStorage.getItem('hollowlight.best.v1');
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  saveBest() {
    try {
      window.localStorage.setItem('hollowlight.best.v1', JSON.stringify(this.best));
    } catch {
      /* a private window has no storage; the game plays the same */
    }
  }

  loadLevel(index) {
    this.levelIndex = clamp(index, 0, LEVELS.length - 1);
    this.level = createLevel(this.levelIndex);
    this.player = new Player(this.level.spawn.x, this.level.spawn.y);
    this.guards = this.level.def.guards.map((def, i) => new Guard(def, i));
    this.time = 0;
    this.meter = 0;
    this.alarm = 0;
    this.seenCount = 0;
    this.hasObjective = false;
    this.effects = [];
    this.grace = 0;
    this.spotted = false;
    this.recover = 0;
    this.seenNow = false;
    this.seerGuard = null;
    this.shake = 0;
    this.heartbeatTimer = 0;
    this.alarmTimer = 0;
    this.renderer.setLevel(this.level);
    if (this.hud) this.hud.update(this);
  }

  startRun() {
    this.loadLevel(0);
    this.totalTime = 0;
    this.state = 'playing';
    if (this.hud) {
      this.hud.showScreen(null);
      this.hud.announce(`Floor I, ${this.level.def.name}. ${this.level.def.tagline}`);
    }
    this.audio.unlock();
  }

  restart() {
    this.loadLevel(this.levelIndex);
    this.state = 'playing';
    if (this.hud) this.hud.showScreen(null);
  }

  nextLevel() {
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.startRun();
      return;
    }
    this.loadLevel(this.levelIndex + 1);
    this.state = 'playing';
    if (this.hud) {
      this.hud.showScreen(null);
      this.hud.announce(`Floor ${this.level.def.numeral}, ${this.level.def.name}.`);
    }
  }

  toTitle() {
    this.loadLevel(0);
    this.state = 'title';
    if (this.hud) this.hud.showScreen('title');
  }

  setPaused(paused) {
    if (paused && this.state === 'playing') {
      this.state = 'paused';
      if (this.hud) this.hud.showScreen('pause');
    } else if (!paused && this.state === 'paused') {
      this.state = 'playing';
      if (this.hud) this.hud.showScreen(null);
    }
  }

  togglePause() {
    if (this.state === 'playing') this.setPaused(true);
    else if (this.state === 'paused') this.setPaused(false);
  }

  // Called once a frame: key edges first, then as many 1/120 s steps as the
  // frame earned, then the effects and the paint.
  advance(dt) {
    this.anim += dt;
    this.handleInput();
    if (this.state === 'playing' && !this.freeze) {
      this.acc = Math.min(this.acc + Math.min(dt, 0.12), 0.25);
      let steps = 0;
      while (this.acc >= STEP && steps < 12 && this.state === 'playing') {
        this.step(STEP);
        this.acc -= STEP;
        steps += 1;
      }
    } else {
      this.acc = 0;
    }
    this.updateEffects(this.freeze ? dt * 0.4 : dt);
    this.renderer.draw(this);
    this.input.endFrame();
  }

  handleInput() {
    const input = this.input;
    if (input.consume('KeyM')) {
      const muted = this.audio.toggleMute();
      if (this.hud && this.hud.el.mute) {
        this.hud.el.mute.textContent = muted ? 'SOUND OFF' : 'SOUND ON';
        this.hud.el.mute.setAttribute('aria-pressed', String(muted));
      }
    }
    if (input.consume('Enter') || input.consume('NumpadEnter')) {
      if (this.state === 'title') this.startRun();
      else if (this.state === 'win') this.nextLevel();
      else if (this.state === 'lose') this.restart();
      else if (this.state === 'paused') this.setPaused(false);
    }
    if (input.consume('Escape')) {
      if (this.state === 'playing' || this.state === 'paused') this.togglePause();
    }
    if (input.consume('KeyR')) {
      if (this.state === 'playing' || this.state === 'paused' || this.state === 'lose') this.restart();
      else if (this.state === 'win') this.nextLevel();
    }
    for (let i = 0; i < LEVELS.length; i += 1) {
      if (input.consume(`Digit${i + 1}`) || input.consume(`Numpad${i + 1}`)) {
        this.loadLevel(i);
        this.state = 'playing';
        if (this.hud) this.hud.showScreen(null);
      }
    }
  }

  step(dt) {
    this.time += dt;
    this.player.update(dt, this);
    for (const guard of this.guards) guard.update(dt, this);
    this.updateDetection(dt);
    this.checkContacts();
    this.checkPrize();
    this.checkWin();
    this.updateAudio(dt);
    this.shake = Math.max(0, this.shake - dt * 2.6);
    if (this.hud) this.hud.update(this);
  }

  updateDetection(dt) {
    const perceived = [];
    for (const guard of this.guards) {
      const look = guard.lookAt(this.player, this.level);
      if (!look.visible) continue;
      const visibility = this.player.visibilityAt(look.distance, guard);
      if (visibility <= 0) continue;
      const rate = TUNING.meterGain * visibility * (guard.state === 'alert' ? 1.3 : 1);
      perceived.push({ guard, rate });
    }
    this.seenNow = perceived.length > 0;
    this.seerGuard = perceived.length > 0 ? perceived[0].guard : null;

    if (this.seenNow) {
      let rate = 0;
      for (const p of perceived) rate = Math.max(rate, p.rate);
      this.meter = Math.min(1, this.meter + rate * dt);
      this.grace = TUNING.meterGrace;
      this.recover = 0;
      if (this.meter > TUNING.meterSuspect) {
        for (const p of perceived) {
          if (p.guard.state === 'patrol' || p.guard.state === 'return') {
            p.guard.enterSuspect(this.player.x, this.player.y, true);
          }
        }
      }
      if (this.meter >= 1 && !this.spotted) this.raiseWatch();
    } else {
      this.grace = Math.max(0, this.grace - dt);
      if (this.grace === 0) this.meter = Math.max(0, this.meter - TUNING.meterDecay * dt);
    }

    const alertSeen = perceived.some((p) => p.guard.state === 'alert');
    if (alertSeen) {
      this.alarm = Math.min(1, this.alarm + dt / TUNING.alarmLimit);
    } else {
      this.alarm = Math.max(0, this.alarm - dt * TUNING.alarmDrain);
    }
    if (this.alarm >= 1) {
      this.fail('alarm');
      return;
    }

    const anyAlert = this.guards.some((g) => g.state === 'alert');
    if (!anyAlert && this.meter < TUNING.spotRecoverMeter) {
      this.recover += dt;
      if (this.recover > TUNING.spotRecoverTime) this.spotted = false;
    }
  }

  // Fully seen: the alarm goes up, the watchers with a line on you hunt, and
  // the ones nearby come to look. The meter can still be walked back down.
  raiseWatch() {
    this.spotted = true;
    this.seenCount += 1;
    this.shake = 1;
    this.audio.suspicion();
    for (const guard of this.guards) {
      if (guard.canSeeNow) guard.enterAlert(this.player.x, this.player.y);
      else if (distance(guard.x, guard.y, this.player.x, this.player.y) < GUARD_TUNING.alertShareRadius) {
        guard.enterSuspect(this.player.x, this.player.y, false);
      }
    }
    if (this.hud) {
      this.hud.flashAlert();
      this.hud.announce('Spotted. Break line of sight and the watch will lose you.');
    }
  }

  checkContacts() {
    for (const guard of this.guards) {
      const d = distance(this.player.x, this.player.y, guard.x, guard.y);
      if (d < TUNING.caughtRadius && (guard.state === 'alert' || guard.canSeeNow)) {
        this.fail('caught');
        return;
      }
      if (d < TUNING.bumpRadius) {
        this.fail('bumped');
        return;
      }
    }
  }

  checkPrize() {
    if (this.hasObjective) return;
    const goal = this.level.goal;
    const d = distance(this.player.x, this.player.y, goal.x, goal.y);
    const wants = this.input.isDown('KeyE');
    if (d < 27 || (wants && d < TUNING.interactRadius)) {
      this.takeObjective();
    }
  }

  takeObjective() {
    if (this.hasObjective) return;
    this.hasObjective = true;
    this.audio.pickup();
    for (let i = 0; i < 14; i += 1) {
      this.effects.push({
        type: 'spark',
        x: this.level.goal.x,
        y: this.level.goal.y - 14,
        vx: Math.cos((i / 14) * Math.PI * 2) * (0.6 + (i % 3) * 0.4),
        vy: Math.sin((i / 14) * Math.PI * 2) * 0.8,
        life: 0.8,
        maxLife: 0.8,
        color: '255, 214, 140',
      });
    }
    if (this.hud) this.hud.announce('The Emberglass is yours. Reach the night door.');
  }

  checkWin() {
    if (this.state !== 'playing' || !this.hasObjective) return;
    const exit = this.level.exit;
    if (distance(this.player.x, this.player.y, exit.x, exit.y) < 28) this.winLevel();
  }

  winLevel() {
    if (this.state !== 'playing') return;
    this.state = 'win';
    this.totalTime += this.time;
    const id = this.level.def.id;
    const previous = this.best[id] ?? 0;
    if (previous === 0 || this.time < previous) {
      this.best[id] = this.time;
      this.saveBest();
    }
    const final = this.levelIndex >= LEVELS.length - 1;
    this.audio.win();
    if (this.hud) {
      this.hud.openWin({
        final,
        numeral: this.level.def.numeral,
        time: final ? this.totalTime : this.time,
        seen: this.seenCount,
        best: this.best[id] ?? 0,
      });
      this.hud.announce(final ? 'The errand is done.' : 'Floor cleared. Dawn is closer.');
    }
  }

  fail(reason) {
    if (this.state !== 'playing') return;
    this.state = 'lose';
    this.alarm = 1;
    this.shake = 1;
    this.audio.lose();
    if (this.hud) {
      this.hud.openLose({ reason, time: this.time, seen: this.seenCount });
      this.hud.announce('The watch has you.');
    }
  }

  onPlayerStep(x, y, radius) {
    this.effects.push({
      type: 'ring',
      x,
      y: y + 6,
      r0: 5,
      r1: Math.max(16, radius * 0.42),
      life: 0.5,
      maxLife: 0.5,
      alpha: 0.16,
      color: '190, 214, 220',
      width: 1,
    });
    this.effects.push({
      type: 'dust',
      x: x + (Math.random() - 0.5) * 12,
      y: y + 10,
      r: 4.5,
      life: 0.42,
      maxLife: 0.42,
    });
    for (const guard of this.guards) guard.hearNoise(x, y, radius);
  }

  onGuardStep(guard) {
    this.audio.guardFootstep(guard, this.player.x, this.player.y);
    this.effects.push({
      type: 'ring',
      x: guard.x,
      y: guard.y + 11,
      r0: 3,
      r1: guard.state === 'alert' ? 26 : 19,
      life: 0.5,
      maxLife: 0.5,
      alpha: guard.state === 'alert' ? 0.2 : 0.1,
      color: '255, 196, 120',
      width: 1,
    });
  }

  updateAudio(dt) {
    const intensity = clamp((this.meter - 0.42) / 0.58, 0, 1);
    if (intensity > 0) {
      this.heartbeatTimer -= dt;
      if (this.heartbeatTimer <= 0) {
        this.heartbeatTimer = 0.95 - intensity * 0.5;
        this.audio.heartbeat(0.4 + intensity * 0.6);
      }
    } else {
      this.heartbeatTimer = 0.2;
    }
    if (this.alarm > 0.02) {
      this.alarmTimer -= dt;
      if (this.alarmTimer <= 0) {
        this.alarmTimer = 0.55;
        this.audio.alarmPulse();
      }
    }
  }

  updateEffects(dt) {
    if (!this.effects.length) return;
    for (const effect of this.effects) effect.life -= dt;
    this.effects = this.effects.filter((effect) => effect.life > 0);
  }
}
