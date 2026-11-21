// Every tunable number of HOLLOWLIGHT in one place: canvas geometry, tile ids,
// the palette the renderer reads, and the feel constants for sneaking, sight
// and suspicion. Kept flat and named so the game's balance can be read at a glance.

export const TILE = 40;
export const COLS = 30;
export const ROWS = 18;
export const WORLD_W = COLS * TILE;
export const WORLD_H = ROWS * TILE;

// Tile ids stored in the level grid.
export const FLOOR = 0;
export const WALL = 1;
export const SHADOW = 2;
export const CRATE = 3;
export const PILLAR = 4;
export const EXIT = 5;
export const GOAL = 6;
export const LAMP = 7;

export const SOLID_TILES = [WALL, CRATE, PILLAR];
export const SIGHT_BLOCKING_TILES = [WALL, CRATE, PILLAR];

export const PALETTE = {
  void: '#090c12',
  floor: '#1a222b',
  floorAlt: '#1e2833',
  floorLine: '#121922',
  floorInlay: 'rgba(240, 184, 98, 0.09)',
  shadow: 'rgba(2, 5, 10, 0.68)',
  shadowRim: 'rgba(96, 164, 182, 0.24)',
  wall: '#2a2f3d',
  wallTop: '#485064',
  wallBase: '#080b10',
  crate: '#55402b',
  crateLight: '#7a5c3b',
  crateDark: '#33251a',
  pillar: '#3a4252',
  pillarLight: '#586377',
  amber: '#f0b862',
  amberDim: 'rgba(240, 184, 98, 0.35)',
  amberGlow: 'rgba(255, 190, 106, 0.09)',
  alarm: '#ff6b5e',
  player: '#49d6c6',
  playerDark: '#123f3d',
  guard: '#c9553f',
  guardCloak: '#8a2f26',
  guardCloakLight: '#a83a2c',
  guardSkin: '#e8d3b0',
  ink: '#0b0f15',
  cream: '#f3e7cf',
};

export const TUNING = {
  playerRadius: 13,
  walkSpeed: 156,
  sneakSpeed: 79,
  playerAccel: 13,
  interactRadius: 44,
  walkNoise: 146,
  sneakNoise: 54,
  walkStepTime: 0.34,
  sneakStepTime: 0.62,
  shadowVisibility: 0.0,
  shadowCloseVisibility: 0.36,
  shadowCloseRange: 152,
  sneakVisibility: 0.68,
  meterGain: 0.94,
  meterDecay: 0.52,
  meterGrace: 0.4,
  meterSuspect: 0.32,
  alarmLimit: 3.3,
  alarmDrain: 0.85,
  caughtRadius: 21,
  bumpRadius: 17,
  spotRecoverMeter: 0.34,
  spotRecoverTime: 2.4,
};

export const GUARD_TUNING = {
  patrolSpeed: 50,
  suspectSpeed: 67,
  alertSpeed: 108,
  turnRate: 5.2,
  sightRange: 286,
  halfAngle: 0.52,
  eyeHeight: 15,
  pauseSweep: 0.5,
  pauseSweepRate: 2.1,
  searchTime: 4.4,
  alertShareRadius: 340,
  stepTime: 0.46,
  radius: 14,
};
