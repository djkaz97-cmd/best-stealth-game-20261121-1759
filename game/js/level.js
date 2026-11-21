// The three floors of the Hollowlight Archive: their tile grids, their watch
// routes and the pieces the rest of the game asks about (walls, cover, shadow,
// the Emberglass pedestal, the night door). Each floor is built from a few
// declarative paint calls so its layout reads like a plan, not a bitmap.

import {
  COLS, ROWS, TILE,
  FLOOR, WALL, SHADOW, CRATE, PILLAR, EXIT, GOAL, LAMP,
  SOLID_TILES, SIGHT_BLOCKING_TILES,
} from './config.js';

function emptyGrid() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(FLOOR));
}

function outline(grid) {
  for (let x = 0; x < COLS; x += 1) {
    grid[0][x] = WALL;
    grid[ROWS - 1][x] = WALL;
  }
  for (let y = 0; y < ROWS; y += 1) {
    grid[y][0] = WALL;
    grid[y][COLS - 1] = WALL;
  }
}

// Paint an inclusive rectangle, leaving the outer wall of the floor alone.
function paintRect(grid, x0, y0, x1, y1, tile) {
  for (let y = Math.max(1, y0); y <= Math.min(ROWS - 2, y1); y += 1) {
    for (let x = Math.max(1, x0); x <= Math.min(COLS - 2, x1); x += 1) {
      grid[y][x] = tile;
    }
  }
}

function put(grid, x, y, tile) {
  if (x > 0 && x < COLS - 1 && y > 0 && y < ROWS - 1) grid[y][x] = tile;
}

// Floor I — The Atrium: a wide hall, a colonnade to weave through, a walled
// alcove for the Emberglass and a long east corridor the night door sits off.
function buildAtrium() {
  const grid = emptyGrid();
  outline(grid);

  // A garden of shadow in the north-west, and the Emberglass alcove north-east.
  paintRect(grid, 2, 1, 6, 4, SHADOW);
  paintRect(grid, 23, 1, 28, 4, WALL);
  paintRect(grid, 24, 2, 27, 3, FLOOR);
  put(grid, 25, 4, FLOOR);
  put(grid, 26, 3, GOAL);
  put(grid, 24, 2, LAMP);

  // The alcove's shadowed doorstep.
  paintRect(grid, 23, 5, 27, 5, SHADOW);

  // A divider between the hall and the east corridor, with two archways.
  paintRect(grid, 22, 6, 22, 15, WALL);
  put(grid, 22, 9, FLOOR);
  put(grid, 22, 13, FLOOR);

  // The colonnade.
  put(grid, 11, 5, PILLAR);
  put(grid, 16, 5, PILLAR);
  put(grid, 11, 9, PILLAR);
  put(grid, 16, 9, PILLAR);

  // Crates: cover that reads at a glance.
  paintRect(grid, 9, 8, 10, 9, CRATE);
  paintRect(grid, 19, 12, 20, 13, CRATE);
  put(grid, 13, 13, CRATE);
  put(grid, 21, 7, CRATE);
  put(grid, 6, 11, CRATE);

  // Shadow pools along the west wall and the south side.
  paintRect(grid, 1, 7, 2, 12, SHADOW);
  paintRect(grid, 13, 15, 17, 16, SHADOW);
  paintRect(grid, 27, 10, 28, 14, SHADOW);

  // Brass lamps.
  put(grid, 15, 3, LAMP);
  put(grid, 9, 7, LAMP);
  put(grid, 18, 8, LAMP);
  put(grid, 4, 10, LAMP);
  put(grid, 24, 8, LAMP);
  put(grid, 26, 13, LAMP);

  put(grid, 1, 14, EXIT);
  return { grid, spawn: [7, 15] };
}

// Floor II — The Long Gallery: two patrol lanes down a display hall, rooms
// behind each wall, and the Emberglass kept in a guarded east chamber.
function buildGallery() {
  const grid = emptyGrid();
  outline(grid);

  // The gallery's two long walls, each with arches into the rooms behind.
  paintRect(grid, 3, 6, 26, 6, WALL);
  for (const x of [6, 15, 20, 24]) put(grid, x, 6, FLOOR);
  paintRect(grid, 3, 12, 26, 12, WALL);
  for (const x of [5, 17, 25]) put(grid, x, 12, FLOOR);

  // Room dividers north and south.
  paintRect(grid, 11, 1, 11, 5, WALL);
  paintRect(grid, 18, 1, 18, 5, WALL);
  paintRect(grid, 12, 13, 12, 16, WALL);
  paintRect(grid, 21, 13, 21, 16, WALL);

  // The east chamber, walled, with one door onto the gallery.
  paintRect(grid, 22, 1, 22, 5, WALL);
  paintRect(grid, 23, 5, 28, 5, WALL);
  paintRect(grid, 28, 1, 28, 5, WALL);
  put(grid, 24, 5, FLOOR);
  put(grid, 25, 3, GOAL);
  put(grid, 24, 2, LAMP);
  paintRect(grid, 27, 3, 27, 4, SHADOW);

  // Display cases standing in the gallery: the cover of the middle lane.
  paintRect(grid, 8, 8, 10, 9, CRATE);
  paintRect(grid, 19, 8, 21, 9, CRATE);

  // Cases in the rooms behind.
  paintRect(grid, 4, 3, 5, 4, CRATE);
  paintRect(grid, 13, 3, 14, 4, CRATE);
  paintRect(grid, 20, 2, 20, 3, CRATE);
  paintRect(grid, 4, 14, 5, 15, CRATE);
  paintRect(grid, 14, 14, 15, 15, CRATE);
  paintRect(grid, 23, 14, 24, 15, CRATE);

  // Shadow where the lamplight fails.
  paintRect(grid, 1, 7, 2, 11, SHADOW);
  paintRect(grid, 27, 7, 28, 11, SHADOW);
  paintRect(grid, 2, 1, 3, 2, SHADOW);
  paintRect(grid, 16, 1, 17, 2, SHADOW);
  paintRect(grid, 2, 16, 3, 16, SHADOW);
  paintRect(grid, 17, 16, 19, 16, SHADOW);
  paintRect(grid, 25, 16, 27, 16, SHADOW);

  // Lamps down the gallery and in the rooms.
  put(grid, 4, 8, LAMP);
  put(grid, 12, 7, LAMP);
  put(grid, 16, 10, LAMP);
  put(grid, 23, 8, LAMP);
  put(grid, 26, 13, LAMP);
  put(grid, 9, 14, LAMP);
  put(grid, 15, 4, LAMP);

  put(grid, 1, 9, EXIT);
  return { grid, spawn: [3, 16] };
}

// Floor III — The Ember Vault: a four-door chamber at the centre, a ring
// corridor around it, and the watch walking both.
function buildVault() {
  const grid = emptyGrid();
  outline(grid);

  // The vault chamber, one door on each side.
  paintRect(grid, 10, 5, 19, 5, WALL);
  paintRect(grid, 10, 12, 19, 12, WALL);
  paintRect(grid, 10, 5, 10, 12, WALL);
  paintRect(grid, 19, 5, 19, 12, WALL);
  put(grid, 15, 5, FLOOR);
  put(grid, 15, 12, FLOOR);
  put(grid, 10, 8, FLOOR);
  put(grid, 19, 9, FLOOR);

  // The chamber floor: corner pillars and the pedestal.
  put(grid, 11, 6, PILLAR);
  put(grid, 18, 6, PILLAR);
  put(grid, 11, 11, PILLAR);
  put(grid, 18, 11, PILLAR);
  put(grid, 15, 8, GOAL);
  put(grid, 15, 10, LAMP);
  paintRect(grid, 12, 9, 13, 10, SHADOW);

  // Shadow in the four corners of the ring, and cover between them.
  paintRect(grid, 1, 1, 4, 3, SHADOW);
  paintRect(grid, 25, 1, 28, 3, SHADOW);
  paintRect(grid, 1, 14, 4, 16, SHADOW);
  paintRect(grid, 25, 14, 28, 16, SHADOW);

  paintRect(grid, 6, 7, 7, 8, CRATE);
  paintRect(grid, 22, 9, 23, 10, CRATE);
  paintRect(grid, 13, 2, 14, 2, CRATE);
  paintRect(grid, 16, 15, 17, 15, CRATE);

  put(grid, 6, 11, PILLAR);
  put(grid, 23, 5, PILLAR);
  put(grid, 11, 15, PILLAR);
  put(grid, 16, 2, PILLAR);

  // Lamps around the ring; the vault itself is lit from the pedestal.
  put(grid, 3, 8, LAMP);
  put(grid, 26, 8, LAMP);
  put(grid, 14, 1, LAMP);
  put(grid, 8, 4, LAMP);
  put(grid, 21, 4, LAMP);
  put(grid, 8, 13, LAMP);
  put(grid, 21, 13, LAMP);

  put(grid, 15, 16, EXIT);
  return { grid, spawn: [3, 15] };
}

// Each floor's watch: a route of tile waypoints, a walking speed scale, the
// pause at every corner and how far the lantern head sweeps while it waits.
export const LEVELS = [
  {
    id: 'atrium',
    numeral: 'I',
    name: 'The Atrium',
    tagline: 'A lantern-lit hall, and one loose stone in its watch.',
    hint: 'Cross behind the pillars. Hold Shift to muffle your steps.',
    par: 70,
    build: buildAtrium,
    guards: [
      { name: 'Sable', route: [[8, 6], [18, 6], [18, 12], [8, 12]], speed: 1.0, pause: 1.3, sweep: 0.5, pingpong: false },
      { name: 'Wick', route: [[25, 6], [25, 15], [27, 15], [27, 6]], speed: 0.95, pause: 1.5, sweep: 0.35, pingpong: false },
      { name: 'Moth', route: [[24, 7]], speed: 0, pause: 2.4, sweep: 1.05, facing: -Math.PI / 2 },
    ],
  },
  {
    id: 'gallery',
    numeral: 'II',
    name: 'The Long Gallery',
    tagline: 'Two lanes of lanterns between the display cases.',
    hint: 'Let a patrol pass, then walk the lane it just left.',
    par: 95,
    build: buildGallery,
    guards: [
      { name: 'Sable', route: [[4, 7], [12, 7], [22, 7], [26, 7]], speed: 1.0, pause: 1.0, sweep: 0.45 },
      { name: 'Wick', route: [[26, 10], [16, 10], [6, 10], [3, 10]], speed: 0.95, pause: 1.0, sweep: 0.45 },
      { name: 'Moth', route: [[23, 4], [26, 4], [26, 2], [23, 2]], speed: 0.8, pause: 1.4, sweep: 0.4, pingpong: false },
    ],
  },
  {
    id: 'vault',
    numeral: 'III',
    name: 'The Ember Vault',
    tagline: 'Four lanterns walk the ring. The Emberglass waits inside.',
    hint: 'The vault has four doors. Use the one the watch just left.',
    par: 120,
    build: buildVault,
    guards: [
      { name: 'Sable', route: [[5, 3], [14, 3], [24, 3], [24, 8]], speed: 1.0, pause: 1.1, sweep: 0.45 },
      { name: 'Wick', route: [[24, 13], [14, 13], [5, 13], [5, 8]], speed: 1.0, pause: 1.1, sweep: 0.45 },
      { name: 'Moth', route: [[8, 16], [22, 16]], speed: 0.9, pause: 1.5, sweep: 0.6 },
      { name: 'Ash', route: [[12, 7], [18, 7], [18, 10], [12, 10]], speed: 0.85, pause: 0.8, sweep: 0.35, range: 248, pingpong: false },
    ],
  },
];

// A live floor: the grid plus the questions the player, the guards and the
// renderer ask of it (can I stand here, does this block a lantern, is this
// floor shadow, where is the prize).
export class Level {
  constructor(def, index) {
    this.def = def;
    this.index = index;
    const built = def.build();
    this.grid = built.grid;
    this.spawn = { x: (built.spawn[0] + 0.5) * TILE, y: (built.spawn[1] + 0.5) * TILE };
    this.goal = this.firstTile(GOAL);
    this.exit = this.firstTile(EXIT);
    this.lamps = this.allTiles(LAMP);
    this.walls = this.allTiles(WALL);
    this.crates = this.allTiles(CRATE);
    this.pillars = this.allTiles(PILLAR);
    this.shadows = this.allTiles(SHADOW);
  }

  firstTile(tile) {
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (this.grid[y][x] === tile) return { x: (x + 0.5) * TILE, y: (y + 0.5) * TILE, tx: x, ty: y };
      }
    }
    return null;
  }

  allTiles(tile) {
    const found = [];
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (this.grid[y][x] === tile) found.push({ tx: x, ty: y, x: (x + 0.5) * TILE, y: (y + 0.5) * TILE });
      }
    }
    return found;
  }

  tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return WALL;
    return this.grid[ty][tx];
  }

  tileAtPixel(x, y) {
    return this.tileAt(Math.floor(x / TILE), Math.floor(y / TILE));
  }

  isSolid(tx, ty) {
    return SOLID_TILES.includes(this.tileAt(tx, ty));
  }

  blocksSight(tx, ty) {
    return SIGHT_BLOCKING_TILES.includes(this.tileAt(tx, ty));
  }

  isShadowAt(x, y) {
    return this.tileAtPixel(x, y) === SHADOW;
  }

  isExitAt(x, y) {
    return this.tileAtPixel(x, y) === EXIT;
  }

  // A circle against the solid tiles: true when it overlaps any wall, crate or
  // pillar. The closest-point test keeps corners rounded, not boxy.
  circleHitsSolid(x, y, radius) {
    const minX = Math.floor((x - radius) / TILE);
    const maxX = Math.floor((x + radius) / TILE);
    const minY = Math.floor((y - radius) / TILE);
    const maxY = Math.floor((y + radius) / TILE);
    for (let ty = minY; ty <= maxY; ty += 1) {
      for (let tx = minX; tx <= maxX; tx += 1) {
        if (!this.isSolid(tx, ty)) continue;
        const left = tx * TILE;
        const top = ty * TILE;
        const nearestX = Math.max(left, Math.min(x, left + TILE));
        const nearestY = Math.max(top, Math.min(y, top + TILE));
        const dx = x - nearestX;
        const dy = y - nearestY;
        if (dx * dx + dy * dy < radius * radius) return true;
      }
    }
    return false;
  }
}

export function createLevel(index) {
  const safe = Math.max(0, Math.min(LEVELS.length - 1, index));
  return new Level(LEVELS[safe], safe);
}
