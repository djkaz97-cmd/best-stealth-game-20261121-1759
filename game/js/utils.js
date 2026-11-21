// Small maths helpers shared by the guards, the player and the renderer.
// All angles are radians, all distances pixels.

export function clamp(value, lo, hi) {
  return value < lo ? lo : value > hi ? hi : value;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function distance(x0, y0, x1, y1) {
  return Math.hypot(x1 - x0, y1 - y0);
}

export function normalizeAngle(angle) {
  let a = angle % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function angleDifference(from, to) {
  return normalizeAngle(to - from);
}

// Frame-rate independent smoothing: moves `current` toward `target` at `rate`
// per second, and never overshoots.
export function approach(current, target, rate, dt) {
  const step = rate * dt;
  if (Math.abs(target - current) <= step) return target;
  return current + Math.sign(target - current) * step;
}

export function turnToward(current, target, rate, dt) {
  return current + clamp(angleDifference(current, target), -rate * dt, rate * dt);
}

// Deterministic per-cell jitter, so the floor's grain never shimmers.
export function hash2(x, y) {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return (h >>> 0) / 4294967296;
}

export function formatClock(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Axis-separated circle movement against the tile grid. Sliding along a wall
// falls out of resolving X and Y apart, which keeps corridors forgiving.
export function moveWithCollision(level, x, y, dx, dy, radius) {
  let nx = x + dx;
  if (!level.circleHitsSolid(nx, y, radius)) x = nx;
  let ny = y + dy;
  if (!level.circleHitsSolid(x, ny, radius)) y = ny;
  return { x, y };
}
