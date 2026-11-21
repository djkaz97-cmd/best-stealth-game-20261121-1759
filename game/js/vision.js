// Lantern sight: ray casts across the tile grid, the polygon a cone draws, and
// the line-of-sight test the guards use. Walls, crates and pillars all stop a
// lantern, which is what makes cover mean something.

import { TILE } from './config.js';
import { angleDifference } from './utils.js';

export function castRay(level, x, y, angle, range, step = 5) {
  const dx = Math.cos(angle) * step;
  const dy = Math.sin(angle) * step;
  let px = x;
  let py = y;
  const steps = Math.ceil(range / step);
  for (let i = 1; i <= steps; i += 1) {
    px += dx;
    py += dy;
    if (level.blocksSight(Math.floor(px / TILE), Math.floor(py / TILE))) {
      return { x: px - dx * 0.5, y: py - dy * 0.5, distance: i * step };
    }
  }
  return { x: x + Math.cos(angle) * range, y: y + Math.sin(angle) * range, distance: range };
}

export function lineOfSight(level, x0, y0, x1, y1, step = 5) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return true;
  const steps = Math.ceil(distance / step);
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const px = x0 + dx * t;
    const py = y0 + dy * t;
    if (level.blocksSight(Math.floor(px / TILE), Math.floor(py / TILE))) return false;
  }
  return true;
}

// The outline of a guard's vision cone, already clipped by every wall it meets.
export function conePolygon(level, x, y, facing, halfAngle, range, rays = 34) {
  const points = [{ x, y }];
  for (let i = 0; i <= rays; i += 1) {
    const angle = facing - halfAngle + (halfAngle * 2 * i) / rays;
    const hit = castRay(level, x, y, angle, range);
    points.push({ x: hit.x, y: hit.y });
  }
  return points;
}

export function insideCone(x, y, originX, originY, facing, halfAngle, range) {
  const dx = x - originX;
  const dy = y - originY;
  const distance = Math.hypot(dx, dy);
  if (distance > range) return { inside: false, distance, angle: 0 };
  const angle = Math.atan2(dy, dx);
  return {
    inside: Math.abs(angleDifference(facing, angle)) <= halfAngle,
    distance,
    angle,
  };
}
