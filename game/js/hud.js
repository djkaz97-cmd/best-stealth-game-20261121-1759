// The HUD and the four screens around the game: title, pause, floor cleared and
// caught. It reads the game's state each frame and writes only what changed, so
// the canvas keeps every frame it can.

import { formatClock } from './utils.js';

const DETECT_LABEL = {
  clear: 'UNSEEN',
  hidden: 'HIDDEN IN SHADOW',
  suspect: 'SUSPICIOUS',
  spotted: 'SPOTTED',
};

export class Hud {
  constructor(game, audio) {
    this.game = game;
    this.audio = audio;
    this.stage = document.getElementById('stage');
    this.screens = {
      title: document.getElementById('screen-title'),
      win: document.getElementById('screen-win'),
      lose: document.getElementById('screen-lose'),
      pause: document.getElementById('screen-pause'),
    };
    this.el = {
      floorNum: document.getElementById('floor-num'),
      floorName: document.getElementById('floor-name'),
      detectBar: document.getElementById('detect-bar'),
      detectFill: document.getElementById('detect-fill'),
      detectState: document.getElementById('detect-state'),
      alarmRow: document.getElementById('alarm-row'),
      alarmFill: document.getElementById('alarm-fill'),
      statTime: document.getElementById('stat-time'),
      statSeen: document.getElementById('stat-seen'),
      objItem: document.getElementById('obj-item'),
      objExit: document.getElementById('obj-exit'),
      hint: document.getElementById('hint'),
      status: document.getElementById('status'),
      mute: document.getElementById('btn-mute'),
      winKicker: document.getElementById('win-kicker'),
      winTitle: document.getElementById('win-title'),
      winCopy: document.getElementById('win-copy'),
      winTime: document.getElementById('win-time'),
      winSeen: document.getElementById('win-seen'),
      winBest: document.getElementById('win-best'),
      btnNext: document.getElementById('btn-next'),
      loseTitle: document.getElementById('lose-title'),
      loseCopy: document.getElementById('lose-copy'),
      loseTime: document.getElementById('lose-time'),
      loseSeen: document.getElementById('lose-seen'),
    };
    this.last = {};
    this.hintKey = '';
    this.flashTimer = null;
    this.wire();
  }

  byId(id) {
    return document.getElementById(id);
  }

  wire() {
    const on = (id, handler) => {
      const node = this.byId(id);
      if (node) {
        node.addEventListener('click', () => {
          this.audio.unlock();
          this.audio.click();
          handler();
        });
      }
    };
    on('btn-start', () => this.game.startRun());
    on('btn-next', () => this.game.nextLevel());
    on('btn-replay', () => this.game.restart());
    on('btn-retry', () => this.game.restart());
    on('btn-title', () => this.game.toTitle());
    on('btn-resume', () => this.game.setPaused(false));
    on('btn-pause-title', () => this.game.toTitle());
    on('btn-mute', () => {
      const muted = this.audio.toggleMute();
      this.el.mute.textContent = muted ? 'SOUND OFF' : 'SOUND ON';
      this.el.mute.setAttribute('aria-pressed', String(muted));
    });
  }

  showScreen(name) {
    for (const key of Object.keys(this.screens)) {
      const node = this.screens[key];
      if (node) node.classList.toggle('is-open', key === name);
    }
    this.stage.classList.toggle('is-covered', Boolean(name));
    if (name === 'title') this.game.audio.startDrone();
  }

  setText(element, value) {
    if (!element) return;
    if (element.textContent !== value) element.textContent = value;
  }

  update(game) {
    if (!this.el.floorNum) return;
    this.setText(this.el.floorNum, game.level ? game.level.def.numeral : 'I');
    this.setText(this.el.floorName, game.level ? game.level.def.name : 'The Atrium');

    const meter = game.meter;
    let mood = 'clear';
    if (game.state === 'playing' || game.state === 'paused') {
      if (meter >= 0.999) mood = 'spotted';
      else if (meter > 0.32) mood = 'suspect';
      else if (game.player && game.player.hiding) mood = 'hidden';
    }
    if (this.last.mood !== mood) {
      this.last.mood = mood;
      if (this.el.detectBar) this.el.detectBar.dataset.state = mood;
      if (this.el.detectState) this.el.detectState.textContent = DETECT_LABEL[mood];
      this.stage.dataset.mood = mood;
    }
    const percent = Math.round(Math.min(1, meter) * 100);
    if (this.last.percent !== percent && this.el.detectFill) {
      this.last.percent = percent;
      this.el.detectFill.style.width = `${percent}%`;
    }

    const alarmVisible = game.alarm > 0.01 || meter >= 0.999;
    if (this.last.alarm !== alarmVisible && this.el.alarmRow) {
      this.last.alarm = alarmVisible;
      this.el.alarmRow.classList.toggle('is-on', alarmVisible);
    }
    if (alarmVisible && this.el.alarmFill) {
      this.el.alarmFill.style.width = `${Math.round(game.alarm * 100)}%`;
    }

    this.setText(this.el.statTime, formatClock(game.time));
    this.setText(this.el.statSeen, String(game.seenCount));

    if (this.el.objItem) {
      this.el.objItem.classList.toggle('is-done', game.hasObjective);
      const label = this.el.objItem.querySelector('.obj-text');
      this.setText(label, game.hasObjective ? 'Emberglass taken' : 'Steal the Emberglass');
    }
    if (this.el.objExit) {
      this.el.objExit.classList.toggle('is-live', game.hasObjective);
      this.el.objExit.classList.toggle('is-done', game.state === 'win');
    }

    const hint = this.hintFor(game);
    if (hint.key !== this.hintKey) {
      this.hintKey = hint.key;
      this.setText(this.el.hint, hint.text);
    }
  }

  hintFor(game) {
    if (game.state !== 'playing' || !game.player) {
      return { key: 'idle', text: ' ' };
    }
    const level = game.level;
    if (!game.hasObjective) {
      const nearPrize = Math.hypot(game.player.x - level.goal.x, game.player.y - level.goal.y) < 74;
      if (nearPrize) return { key: 'prize', text: 'Press E to lift the Emberglass.' };
      return { key: `floor-${level.index}`, text: level.def.hint };
    }
    const nearExit = Math.hypot(game.player.x - level.exit.x, game.player.y - level.exit.y) < 100;
    if (nearExit) return { key: 'exit', text: 'The night door is open. Step through it.' };
    return { key: 'carry', text: 'Emberglass in hand — reach the night door unseen.' };
  }

  openWin(data) {
    this.setText(this.el.winKicker, data.final ? 'THE ERRAND IS DONE' : `FLOOR ${data.numeral} CLEARED`);
    this.setText(this.el.winTitle, data.final ? 'THE NIGHT IS YOURS' : 'DAWN BREAKS');
    this.setText(this.el.winCopy, data.final
      ? 'Three floors of watch, one Emberglass, and a courier the lanterns never held.'
      : 'You slip through the night door with the Emberglass, and the watch is none the wiser.');
    this.setText(this.el.winTime, formatClock(data.time));
    this.setText(this.el.winSeen, String(data.seen));
    this.setText(this.el.winBest, data.best > 0 ? formatClock(data.best) : '—');
    this.setText(this.el.btnNext, data.final ? 'Run the night again' : 'Next floor');
    this.showScreen('win');
  }

  openLose(data) {
    const copy = {
      alarm: 'The watch bell rings, the doors seal, and every lantern turns toward you.',
      caught: 'A lantern finds you at arm’s length. There is no polite way out of this.',
      bumped: 'You walk straight into the watch. The night is over.',
    };
    this.setText(this.el.loseTitle, data.reason === 'alarm' ? 'THE ALARM RINGS' : 'CAUGHT');
    this.setText(this.el.loseCopy, copy[data.reason] ?? copy.caught);
    this.setText(this.el.loseTime, formatClock(data.time));
    this.setText(this.el.loseSeen, String(data.seen));
    this.showScreen('lose');
  }

  flashAlert() {
    this.stage.classList.remove('flash-alert');
    void this.stage.offsetWidth;
    this.stage.classList.add('flash-alert');
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.stage.classList.remove('flash-alert'), 480);
  }

  announce(text) {
    if (this.el.status) this.el.status.textContent = text;
  }
}
