// Everything you see is painted here, frame by frame, from the level grid and
// the live game state. The static floor (stone, shadow pools, brass lamps, the
// night door, walls, crates, pillars) is baked once into an offscreen canvas;
// cones, the watch, the courier, the Emberglass and the small effects sit on top.
//
// The art is deliberately flat: solid fills and hard edges compress into small
// screenshots, and cover reads at a glance.

import {
  TILE, COLS, ROWS, WORLD_W, WORLD_H, PALETTE,
  WALL, SHADOW,
} from './config.js';
import { hash2, lerp } from './utils.js';
import { conePolygon } from './vision.js';

const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const SERIF = 'Georgia, "Iowan Old Style", "Times New Roman", serif';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.staticCanvas = document.createElement('canvas');
    this.staticCanvas.width = WORLD_W;
    this.staticCanvas.height = WORLD_H;
    this.level = null;
  }

  setLevel(level) {
    this.level = level;
    this.bake();
  }

  bake() {
    const g = this.staticCanvas.getContext('2d');
    g.clearRect(0, 0, WORLD_W, WORLD_H);
    g.fillStyle = PALETTE.void;
    g.fillRect(0, 0, WORLD_W, WORLD_H);
    this.drawFloor(g);
    this.drawInlay(g);
    this.drawShadowPools(g);
    this.drawLamps(g);
    this.drawExit(g);
    this.drawWalls(g);
    this.drawCrates(g);
    this.drawPillars(g);
  }

  tileIs(x, y, tile) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true;
    return this.level.grid[y][x] === tile;
  }

  drawFloor(g) {
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const px = x * TILE;
        const py = y * TILE;
        const h = hash2(x, y);
        g.fillStyle = h > 0.52 ? PALETTE.floorAlt : PALETTE.floor;
        g.fillRect(px, py, TILE, TILE);
        g.fillStyle = PALETTE.floorLine;
        g.fillRect(px, py, TILE, 1);
        g.fillRect(px, py, 1, TILE);
        if (h > 0.86) {
          g.fillStyle = 'rgba(255, 255, 255, 0.02)';
          g.fillRect(px + 8, py + 12, 10, 2);
        }
        if (h < 0.1) {
          g.fillStyle = 'rgba(0, 0, 0, 0.18)';
          g.fillRect(px + 18, py + 26, 12, 1);
        }
      }
    }
  }

  // A floor's own mosaic, drawn faintly under everything else.
  drawInlay(g) {
    const id = this.level.def.id;
    g.save();
    g.strokeStyle = PALETTE.floorInlay;
    g.lineWidth = 2;
    if (id === 'atrium') {
      const cx = 14.5 * TILE;
      const cy = 8.5 * TILE;
      for (const r of [96, 138, 178]) {
        g.beginPath();
        g.arc(cx, cy, r, 0, Math.PI * 2);
        g.stroke();
      }
      for (let i = 0; i < 16; i += 1) {
        const a = (i / 16) * Math.PI * 2;
        g.beginPath();
        g.moveTo(cx + Math.cos(a) * 140, cy + Math.sin(a) * 140);
        g.lineTo(cx + Math.cos(a) * 176, cy + Math.sin(a) * 176);
        g.stroke();
      }
    } else if (id === 'gallery') {
      g.strokeRect(3 * TILE + 6, 7 * TILE + 12, 23 * TILE - 12, 4 * TILE - 24);
      g.strokeRect(3 * TILE + 14, 7 * TILE + 20, 23 * TILE - 28, 4 * TILE - 40);
      for (let x = 5; x < 26; x += 3) {
        const px = x * TILE;
        g.beginPath();
        g.moveTo(px, 8 * TILE - 6);
        g.lineTo(px + 12, 9 * TILE);
        g.lineTo(px, 10 * TILE + 6);
        g.stroke();
      }
    } else {
      const cx = 15 * TILE;
      const cy = 9 * TILE;
      for (const r of [72, 118, 164, 210]) {
        g.beginPath();
        g.arc(cx, cy, r, 0, Math.PI * 2);
        g.stroke();
      }
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2;
        g.beginPath();
        g.moveTo(cx + Math.cos(a) * 70, cy + Math.sin(a) * 70);
        g.lineTo(cx + Math.cos(a) * 208, cy + Math.sin(a) * 208);
        g.stroke();
      }
    }
    g.restore();
  }

  drawShadowPools(g) {
    // Merge each row's shadow tiles into runs: no seams, and far fewer fills.
    for (let y = 0; y < ROWS; y += 1) {
      let x = 0;
      while (x < COLS) {
        if (this.level.grid[y][x] !== SHADOW) {
          x += 1;
          continue;
        }
        let end = x;
        while (end + 1 < COLS && this.level.grid[y][end + 1] === SHADOW) end += 1;
        g.fillStyle = PALETTE.shadow;
        g.fillRect(x * TILE - 1, y * TILE - 1, (end - x + 1) * TILE + 2, TILE + 2);
        x = end + 1;
      }
    }

    // A soft rim where shadow meets open floor, so the safe pools read at a glance.
    g.strokeStyle = PALETTE.shadowRim;
    g.lineWidth = 1.5;
    for (const tile of this.level.shadows) {
      const px = tile.tx * TILE;
      const py = tile.ty * TILE;
      if (!this.tileIs(tile.tx, tile.ty - 1, SHADOW)) {
        g.beginPath();
        g.moveTo(px, py + 1);
        g.lineTo(px + TILE, py + 1);
        g.stroke();
      }
      if (!this.tileIs(tile.tx, tile.ty + 1, SHADOW)) {
        g.beginPath();
        g.moveTo(px, py + TILE - 1);
        g.lineTo(px + TILE, py + TILE - 1);
        g.stroke();
      }
      if (!this.tileIs(tile.tx - 1, tile.ty, SHADOW)) {
        g.beginPath();
        g.moveTo(px + 1, py);
        g.lineTo(px + 1, py + TILE);
        g.stroke();
      }
      if (!this.tileIs(tile.tx + 1, tile.ty, SHADOW)) {
        g.beginPath();
        g.moveTo(px + TILE - 1, py);
        g.lineTo(px + TILE - 1, py + TILE);
        g.stroke();
      }
      // Cold motes hanging in the dark.
      const h = hash2(tile.tx + 11, tile.ty + 7);
      if (h > 0.45) {
        g.fillStyle = 'rgba(150, 210, 226, 0.12)';
        g.beginPath();
        g.arc(px + 8 + h * 22, py + 10 + hash2(tile.ty, tile.tx) * 20, 1.3, 0, Math.PI * 2);
        g.fill();
      }
    }
  }

  drawLamps(g) {
    for (const lamp of this.level.lamps) {
      const { x, y } = lamp;
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = 'rgba(255, 182, 92, 0.07)';
      g.beginPath();
      g.arc(x, y, 96, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(255, 196, 112, 0.09)';
      g.beginPath();
      g.arc(x, y, 60, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(255, 210, 140, 0.14)';
      g.beginPath();
      g.arc(x, y, 32, 0, Math.PI * 2);
      g.fill();
      g.restore();
      g.fillStyle = '#141a21';
      g.beginPath();
      g.arc(x, y, 9, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#3b2d1d';
      g.beginPath();
      g.arc(x, y, 6, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = PALETTE.amber;
      g.beginPath();
      g.arc(x, y - 1, 2.6, 0, Math.PI * 2);
      g.fill();
    }
  }

  exitFacing() {
    const exit = this.level.exit;
    if (!exit) return 'up';
    if (exit.tx <= 1) return 'right';
    if (exit.tx >= COLS - 2) return 'left';
    if (exit.ty >= ROWS - 2) return 'up';
    return 'down';
  }

  drawExit(g) {
    const exit = this.level.exit;
    if (!exit) return;
    const { x, y } = exit;
    const facing = this.exitFacing();
    if (facing === 'up' || facing === 'down') {
      const dir = facing === 'up' ? -1 : 1;
      // Spill of amber light onto the floor, two flat bands, added to the stone.
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = 'rgba(255, 188, 96, 0.07)';
      g.beginPath();
      g.moveTo(x - 20, y + dir * 12);
      g.lineTo(x + 20, y + dir * 12);
      g.lineTo(x + 46, y + dir * 132);
      g.lineTo(x - 46, y + dir * 132);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(255, 204, 126, 0.09)';
      g.beginPath();
      g.moveTo(x - 18, y + dir * 12);
      g.lineTo(x + 18, y + dir * 12);
      g.lineTo(x + 30, y + dir * 74);
      g.lineTo(x - 30, y + dir * 74);
      g.closePath();
      g.fill();
      g.restore();
      // The door itself, set into the wall.
      g.save();
      g.fillStyle = '#07090d';
      g.fillRect(x - 19, y + dir * 16, 38, dir * 8);
      g.strokeStyle = 'rgba(240, 184, 98, 0.7)';
      g.lineWidth = 2;
      g.strokeRect(x - 19, y + dir * 16, 38, dir * 8);
      g.fillStyle = 'rgba(255, 206, 130, 0.85)';
      g.fillRect(x - 11, y + dir * 17, 6, dir * 3);
      g.fillRect(x - 1, y + dir * 17, 6, dir * 3);
      g.fillRect(x + 9, y + dir * 17, 6, dir * 3);
      g.restore();
    } else {
      const dir = facing === 'right' ? 1 : -1;
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = 'rgba(255, 188, 96, 0.07)';
      g.beginPath();
      g.moveTo(x + dir * 12, y - 20);
      g.lineTo(x + dir * 12, y + 20);
      g.lineTo(x + dir * 132, y + 46);
      g.lineTo(x + dir * 132, y - 46);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(255, 204, 126, 0.09)';
      g.beginPath();
      g.moveTo(x + dir * 12, y - 18);
      g.lineTo(x + dir * 12, y + 18);
      g.lineTo(x + dir * 74, y + 30);
      g.lineTo(x + dir * 74, y - 30);
      g.closePath();
      g.fill();
      g.restore();
      g.save();
      g.fillStyle = '#07090d';
      g.fillRect(x + dir * 16, y - 19, dir * 8, 38);
      g.strokeStyle = 'rgba(240, 184, 98, 0.7)';
      g.lineWidth = 2;
      g.strokeRect(x + dir * 16, y - 19, dir * 8, 38);
      g.fillStyle = 'rgba(255, 206, 130, 0.85)';
      g.fillRect(x + dir * 17, y - 11, dir * 3, 6);
      g.fillRect(x + dir * 17, y - 1, dir * 3, 6);
      g.fillRect(x + dir * 17, y + 9, dir * 3, 6);
      g.restore();
    }
  }

  drawWalls(g) {
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (this.level.grid[y][x] !== WALL) continue;
        const px = x * TILE;
        const py = y * TILE;
        const h = hash2(x + 3, y + 9);
        g.fillStyle = h > 0.5 ? PALETTE.wall : '#262b37';
        g.fillRect(px, py, TILE, TILE);
        if (!this.tileIs(x, y - 1, WALL)) {
          g.fillStyle = PALETTE.wallTop;
          g.fillRect(px, py, TILE, 4);
          g.fillStyle = 'rgba(255, 255, 255, 0.05)';
          g.fillRect(px, py + 4, TILE, 1);
        }
        if (!this.tileIs(x, y + 1, WALL)) {
          g.fillStyle = PALETTE.wallBase;
          g.fillRect(px, py + TILE - 4, TILE, 4);
        }
        if (!this.tileIs(x - 1, y, WALL)) {
          g.fillStyle = 'rgba(0, 0, 0, 0.22)';
          g.fillRect(px, py, 2, TILE);
        }
        if (!this.tileIs(x + 1, y, WALL)) {
          g.fillStyle = 'rgba(0, 0, 0, 0.16)';
          g.fillRect(px + TILE - 2, py, 2, TILE);
        }
        // A brick seam or two per block so long walls are not flat slabs.
        g.fillStyle = 'rgba(0, 0, 0, 0.2)';
        g.fillRect(px + (h > 0.5 ? 10 : 24), py + 12, 12, 1);
        g.fillRect(px + (h > 0.5 ? 22 : 8), py + 26, 10, 1);
      }
    }
  }

  drawCrates(g) {
    for (const crate of this.level.crates) {
      const px = crate.tx * TILE;
      const py = crate.ty * TILE;
      g.fillStyle = 'rgba(0, 0, 0, 0.3)';
      g.fillRect(px + 4, py + 6, TILE - 4, TILE - 4);
      g.fillStyle = PALETTE.crate;
      g.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
      g.fillStyle = PALETTE.crateLight;
      g.fillRect(px + 3, py + 3, TILE - 6, 3);
      g.fillStyle = PALETTE.crateDark;
      g.fillRect(px + 3, py + TILE - 6, TILE - 6, 3);
      g.strokeStyle = 'rgba(30, 21, 13, 0.55)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(px + 6, py + 12);
      g.lineTo(px + TILE - 6, py + 12);
      g.moveTo(px + 6, py + 22);
      g.lineTo(px + TILE - 6, py + 22);
      g.moveTo(px + 6, py + 32);
      g.lineTo(px + TILE - 6, py + 32);
      g.stroke();
      g.strokeStyle = 'rgba(240, 184, 98, 0.16)';
      g.strokeRect(px + 3.5, py + 3.5, TILE - 7, TILE - 7);
    }
  }

  drawPillars(g) {
    for (const pillar of this.level.pillars) {
      const { x, y } = pillar;
      g.fillStyle = 'rgba(0, 0, 0, 0.35)';
      g.beginPath();
      g.ellipse(x + 2, y + 6, 18, 10, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = PALETTE.pillar;
      g.beginPath();
      g.arc(x, y, 18, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = PALETTE.pillarLight;
      g.beginPath();
      g.arc(x - 2, y - 2, 13, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(255, 255, 255, 0.08)';
      g.beginPath();
      g.arc(x - 6, y - 6, 6, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = 'rgba(10, 14, 20, 0.7)';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(x, y, 18, 0, Math.PI * 2);
      g.stroke();
    }
  }

  draw(game) {
    const ctx = this.ctx;
    const level = this.level;
    if (!level) return;
    ctx.save();
    if (game.shake > 0.01) {
      const s = game.shake * 4;
      ctx.translate(Math.sin(game.anim * 73) * s, Math.cos(game.anim * 61) * s * 0.7);
    }
    ctx.drawImage(this.staticCanvas, 0, 0);
    this.drawGoal(ctx, game);

    if (game.seenNow && game.meter > 0.28 && game.seerGuard) {
      const seer = game.seerGuard;
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 150, 110, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 7]);
      ctx.beginPath();
      ctx.moveTo(seer.x, seer.y - 16);
      ctx.lineTo(game.player.x, game.player.y);
      ctx.stroke();
      ctx.restore();
    }

    const cones = [];
    for (const guard of game.guards) {
      cones.push({ guard, points: conePolygon(level, guard.x, guard.y, guard.facing, guard.halfAngle, guard.range, 30) });
    }
    for (const { guard, points } of cones) {
      this.drawCone(ctx, guard, points);
    }
    for (const guard of game.guards) {
      this.drawGuard(ctx, guard, game);
    }
    this.drawPlayer(ctx, game.player, game);
    this.drawEffects(ctx, game);
    this.drawExitPulse(ctx, game);
    this.drawVignette(ctx);
    ctx.restore();
  }

  drawCone(ctx, guard, points) {
    const alert = guard.state === 'alert';
    const searching = guard.state === 'suspect' || guard.state === 'search';
    const rgb = alert ? '255, 96, 84' : searching ? '255, 184, 102' : '255, 202, 122';
    const strength = alert ? 0.2 : 0.15;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.fillStyle = `rgba(${rgb}, ${strength})`;
    ctx.fill();

    // A hotter core inside the cone: closer to the lantern, easier to be seen.
    const core = conePolygon(this.level, guard.x, guard.y, guard.facing, guard.halfAngle * 0.66, guard.range * 0.58, 18);
    ctx.beginPath();
    ctx.moveTo(core[0].x, core[0].y);
    for (let i = 1; i < core.length; i += 1) ctx.lineTo(core[i].x, core[i].y);
    ctx.closePath();
    ctx.fillStyle = `rgba(${rgb}, ${strength * 0.85})`;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = `rgba(${rgb}, ${alert ? 0.5 : 0.36})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = `rgba(${rgb}, 0.5)`;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawGuard(ctx, guard, game) {
    const x = guard.x;
    const y = guard.y;
    const bob = guard.moving ? Math.sin(guard.bob * 0.55) * 1.4 : 0;
    const alert = guard.state === 'alert';
    const suspect = guard.state === 'suspect' || guard.state === 'search';

    ctx.save();
    // Ground shadow.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x, y + 13, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lantern in the off hand, with its little pool of light.
    const handAngle = guard.facing + 1.15;
    const lx = x + Math.cos(handAngle) * 13;
    const ly = y + Math.sin(handAngle) * 13;
    const glow = guard.lanternGlow();
    ctx.fillStyle = `rgba(255, 190, 106, ${0.08 * glow})`;
    ctx.beginPath();
    ctx.arc(lx, ly, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a2118';
    ctx.beginPath();
    ctx.arc(lx, ly, 4.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = alert ? '#ffb08a' : '#ffd48f';
    ctx.beginPath();
    ctx.arc(lx, ly, 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Cloak, shoulders, hat.
    ctx.fillStyle = PALETTE.guardCloak;
    ctx.beginPath();
    ctx.arc(x, y + bob * 0.2, 11.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.guardCloakLight;
    ctx.beginPath();
    ctx.arc(x - 2, y - 1, 8.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1410';
    ctx.beginPath();
    ctx.arc(x, y + bob * 0.15, 7.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.guardSkin;
    ctx.beginPath();
    ctx.arc(x + Math.cos(guard.facing) * 1.6, y + Math.sin(guard.facing) * 1.6, 5.2, 0, Math.PI * 2);
    ctx.fill();

    // Facing notch: which way the lantern looks.
    ctx.fillStyle = PALETTE.amber;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(guard.facing) * 17, y + Math.sin(guard.facing) * 17);
    ctx.lineTo(x + Math.cos(guard.facing + 0.34) * 10, y + Math.sin(guard.facing + 0.34) * 10);
    ctx.lineTo(x + Math.cos(guard.facing - 0.34) * 10, y + Math.sin(guard.facing - 0.34) * 10);
    ctx.closePath();
    ctx.fill();

    if (alert) {
      ctx.strokeStyle = 'rgba(255, 96, 84, 0.38)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.arc(x, y, 23, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (suspect || alert) {
      const badgeY = y - 26 + Math.sin(game.anim * 4 + guard.index) * 1.5;
      ctx.fillStyle = alert ? 'rgba(120, 26, 22, 0.95)' : 'rgba(94, 64, 18, 0.95)';
      ctx.beginPath();
      ctx.arc(x, badgeY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = alert ? '#ff8a7a' : '#ffcb7c';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = alert ? '#ffd9d2' : '#ffe4b8';
      ctx.font = 'bold 11px ' + SANS;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(alert ? '!' : '?', x, badgeY + 0.5);
    }
    ctx.restore();
  }

  drawPlayer(ctx, player, game) {
    const x = player.x;
    const y = player.y;
    const crouch = player.sneaking ? 0.9 : 1;
    const bob = player.moving ? Math.sin(player.anim * 11) * 1.2 : 0;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x, y + 13, 12.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(73, 214, 198, 0.13)';
    ctx.beginPath();
    ctx.arc(x, y, 27, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (player.hiding) {
      ctx.strokeStyle = 'rgba(96, 220, 205, 0.2)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.arc(x, y, 21, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.translate(x, y + bob * 0.3);
    ctx.rotate(player.facing + Math.PI / 2);
    ctx.scale(crouch, crouch);

    // Cloak: a rounded hood shape, teal against the warm watch.
    ctx.fillStyle = player.hiding ? '#3fb3a8' : PALETTE.player;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.quadraticCurveTo(11, -7, 9, 8);
    ctx.quadraticCurveTo(0, 13, -9, 8);
    ctx.quadraticCurveTo(-11, -7, 0, -12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(198, 255, 246, 0.5)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(9, 42, 41, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 1, 6.6, 7.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b2322';
    ctx.beginPath();
    ctx.arc(0, -6.4, 4.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e6f4ea';
    ctx.beginPath();
    ctx.arc(0, -7.6, 2.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (player.hiding) {
      ctx.save();
      ctx.fillStyle = 'rgba(120, 226, 212, 0.75)';
      ctx.beginPath();
      ctx.arc(x + 15, y - 20, 5, -0.4, Math.PI - 0.4);
      ctx.arc(x + 18, y - 22, 4, Math.PI - 0.4, Math.PI * 2 - 0.4, true);
      ctx.fill();
      ctx.restore();
    }

    if (game.hasObjective) {
      const lift = Math.sin(game.anim * 3.1) * 2;
      ctx.save();
      ctx.translate(x, y - 25 + lift);
      ctx.rotate(game.anim * 1.4);
      ctx.fillStyle = '#ffd487';
      ctx.beginPath();
      ctx.moveTo(0, -5.5);
      ctx.lineTo(3.6, 0);
      ctx.lineTo(0, 5.5);
      ctx.lineTo(-3.6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff4d2';
      ctx.fillRect(-1, -2, 2, 4);
      ctx.restore();
    }
  }

  drawGoal(ctx, game) {
    const goal = this.level.goal;
    if (!goal) return;
    const { x, y } = goal;
    const t = game.anim;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#232d36';
    ctx.beginPath();
    ctx.arc(x, y + 4, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#31414c';
    ctx.beginPath();
    ctx.arc(x, y + 2, 13, 0, Math.PI * 2);
    ctx.fill();

    if (!game.hasObjective) {
      const pulse = 1 + Math.sin(t * 2.4) * 0.12;
      ctx.strokeStyle = `rgba(255, 205, 130, ${0.3 + Math.sin(t * 2.4) * 0.1})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y - 12, 24 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255, 186, 92, 0.09)';
      ctx.beginPath();
      ctx.arc(x, y - 12, 34 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 210, 130, 0.12)';
      ctx.beginPath();
      ctx.arc(x, y - 12, 18 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const lift = Math.sin(t * 2.1) * 2.6;
      ctx.save();
      ctx.translate(x, y - 16 + lift);
      ctx.rotate(t * 0.7);
      ctx.fillStyle = '#ffd487';
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 11);
      ctx.lineTo(-7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff4d2';
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(3.6, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(-3.6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = 'rgba(255, 214, 150, 0.8)';
      ctx.font = '600 10px ' + SANS;
      ctx.textAlign = 'center';
      ctx.fillText('E M B E R G L A S S', x, y + 34);
    } else {
      ctx.fillStyle = 'rgba(120, 200, 190, 0.5)';
      ctx.beginPath();
      ctx.arc(x, y + 2, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawExitPulse(ctx, game) {
    if (!game.hasObjective) return;
    const exit = this.level.exit;
    if (!exit) return;
    const pulse = (game.anim * 0.8) % 1;
    ctx.save();
    ctx.strokeStyle = `rgba(120, 226, 212, ${0.35 * (1 - pulse)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(exit.x, exit.y, 18 + pulse * 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawEffects(ctx, game) {
    ctx.save();
    for (const fx of game.effects) {
      const t = 1 - fx.life / fx.maxLife;
      if (fx.type === 'ring') {
        ctx.strokeStyle = `rgba(${fx.color}, ${fx.alpha * (1 - t)})`;
        ctx.lineWidth = fx.width ?? 1.4;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, lerp(fx.r0, fx.r1, t), 0, Math.PI * 2);
        ctx.stroke();
      } else if (fx.type === 'dust') {
        ctx.fillStyle = `rgba(180, 200, 210, ${0.22 * (1 - t)})`;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.r * (1 - t * 0.5), 0, Math.PI * 2);
        ctx.fill();
      } else if (fx.type === 'spark') {
        ctx.fillStyle = `rgba(${fx.color}, ${1 - t})`;
        ctx.fillRect(fx.x + fx.vx * t * 26, fx.y + fx.vy * t * 26 - t * t * 20, 2.2, 2.2);
      }
    }
    ctx.restore();
  }

  drawVignette(ctx) {
    const top = ctx.createLinearGradient(0, 0, 0, 92);
    top.addColorStop(0, 'rgba(3, 5, 9, 0.55)');
    top.addColorStop(1, 'rgba(3, 5, 9, 0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, WORLD_W, 92);
    const bottom = ctx.createLinearGradient(0, WORLD_H - 86, 0, WORLD_H);
    bottom.addColorStop(0, 'rgba(3, 5, 9, 0)');
    bottom.addColorStop(1, 'rgba(3, 5, 9, 0.5)');
    ctx.fillStyle = bottom;
    ctx.fillRect(0, WORLD_H - 86, WORLD_W, 86);
    ctx.fillStyle = 'rgba(3, 5, 9, 0.18)';
    ctx.fillRect(0, 0, 26, WORLD_H);
    ctx.fillRect(WORLD_W - 26, 0, 26, WORLD_H);
  }
}
