// Boot: build the canvas, the audio engine and the input, attach the HUD, and
// run the fixed-step loop. A `?shot=` query loads one of the screenshot poses and
// freezes play so the frame can be captured; nothing ever touches the network.

import { WORLD_W, WORLD_H } from './config.js';
import { AudioEngine } from './audio.js';
import { Input } from './input.js';
import { Game } from './game.js';
import { Hud } from './hud.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const stage = document.getElementById('stage');
canvas.width = WORLD_W;
canvas.height = WORLD_H;

const audio = new AudioEngine();
const input = new Input(window);
input.firstGesture = () => audio.unlock();

const game = new Game({ canvas, audio, input });
const hud = new Hud(game, audio);
game.attachHud(hud);

// The stage keeps its 1200×720 design size and scales as one piece, HUD included.
function fitStage() {
  const scale = Math.min(window.innerWidth / WORLD_W, window.innerHeight / WORLD_H);
  stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
}
window.addEventListener('resize', fitStage);
fitStage();

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) applyShot(game, shot);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  game.advance(dt);
  window.requestAnimationFrame(frame);
}
window.requestAnimationFrame(frame);

// A small handle for play-testing and for the screenshot poses.
window.__hollowlight = game;
