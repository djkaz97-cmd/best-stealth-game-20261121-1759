// Named poses for the four screenshots, so each capture shows a real moment of
// the game at a chosen second: the courier in a shadow, a cone finding him, the
// vault with the Emberglass still on its pedestal, and the alarm at its height.
// `?shot=atrium|gallery|vault|alert` loads one and freezes the simulation; the
// renderer keeps breathing so the lantern glow is alive in the still.

import { TILE } from './config.js';

export const SHOT_PRESETS = {
  atrium: {
    level: 0,
    time: 38.2,
    meter: 0.14,
    player: { tx: 13.55, ty: 14.95, facing: -1.15, sneaking: true, hiding: true },
    guards: [
      { tx: 15.45, ty: 12.45, facing: 1.95, state: 'patrol' },
      { tx: 25.5, ty: 12.45, facing: 1.7, state: 'patrol' },
      { tx: 24.5, ty: 7.45, facing: -1.2, state: 'patrol' },
    ],
    seen: false,
  },
  gallery: {
    level: 1,
    time: 61.4,
    meter: 0.58,
    player: { tx: 11.45, ty: 10.45, facing: 0, sneaking: true, hiding: false },
    guards: [
      { tx: 5.5, ty: 7.45, facing: 0.1, state: 'patrol' },
      { tx: 16.45, ty: 10.45, facing: 3.1, state: 'suspect' },
      { tx: 24.4, ty: 3.45, facing: 1.55, state: 'patrol' },
    ],
    seen: true,
    seer: 1,
    seenCount: 0,
  },
  vault: {
    level: 2,
    time: 84.7,
    meter: 0.26,
    player: { tx: 11.5, ty: 8.45, facing: 0, sneaking: true, hiding: false },
    guards: [
      { tx: 5.45, ty: 3.45, facing: 0.15, state: 'patrol' },
      { tx: 24.5, ty: 12.5, facing: -1.35, state: 'patrol' },
      { tx: 10.5, ty: 16.4, facing: 0, state: 'patrol' },
      { tx: 14.5, ty: 8.45, facing: 1.35, state: 'patrol' },
    ],
    seen: false,
    hasObjective: false,
  },
  alert: {
    level: 1,
    time: 47.9,
    meter: 1,
    alarm: 0.44,
    player: { tx: 9.4, ty: 10.5, facing: 2.6, sneaking: true, hiding: false },
    guards: [
      { tx: 13.5, ty: 10.4, facing: 3.12, state: 'alert' },
      { tx: 20.5, ty: 8.4, facing: 3.8, state: 'suspect' },
      { tx: 23.4, ty: 4.4, facing: 2.55, state: 'suspect' },
    ],
    seen: true,
    seer: 0,
    seenCount: 1,
  },
};

export function applyShot(game, name) {
  const preset = SHOT_PRESETS[name] ?? SHOT_PRESETS.atrium;
  game.loadLevel(preset.level);
  game.state = 'playing';
  game.freeze = true;
  game.time = preset.time ?? 0;
  game.meter = preset.meter ?? 0;
  game.alarm = preset.alarm ?? 0;
  game.hasObjective = Boolean(preset.hasObjective);
  game.seenCount = preset.seenCount ?? 0;
  game.seenNow = Boolean(preset.seen);
  game.player.x = (preset.player.tx + 0.5) * TILE;
  game.player.y = (preset.player.ty + 0.5) * TILE;
  game.player.facing = preset.player.facing ?? 0;
  game.player.sneaking = Boolean(preset.player.sneaking);
  game.player.hiding = Boolean(preset.player.hiding);
  game.player.anim = 1.6;

  preset.guards.forEach((pose, index) => {
    const guard = game.guards[index];
    if (!guard) return;
    guard.x = (pose.tx + 0.5) * TILE;
    guard.y = (pose.ty + 0.5) * TILE;
    guard.facing = pose.facing ?? 0;
    guard.baseFacing = guard.facing;
    guard.state = pose.state ?? 'patrol';
    guard.wait = 99;
    guard.stepClock = 99;
    guard.canSeeNow = Boolean(preset.seen && preset.seer === index);
    guard.anim = index * 0.7 + 1;
    guard.bob = index * 12;
  });
  game.seerGuard = preset.seen ? game.guards[preset.seer ?? 0] : null;
  if (game.hud) {
    game.hud.showScreen(null);
    game.hud.update(game);
  }
  return preset;
}
