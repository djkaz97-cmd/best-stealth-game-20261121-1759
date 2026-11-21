// The player: one hooded courier with a soft step. Walking is quick and loud,
// sneaking is slow and quiet, and a shadow tile is a place the lanterns cannot
// reach unless their bearer is almost on top of you.

import { TUNING } from './config.js';
import { moveWithCollision, turnToward } from './utils.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = TUNING.playerRadius;
    this.facing = -Math.PI / 2;
    this.sneaking = false;
    this.hiding = false;
    this.moving = false;
    this.stepTimer = 0;
    this.steps = 0;
    this.anim = 0;
    this.speed = 0;
  }

  update(dt, game) {
    const input = game.input;
    let ax = 0;
    let ay = 0;
    if (input.isDown('KeyA') || input.isDown('ArrowLeft')) ax -= 1;
    if (input.isDown('KeyD') || input.isDown('ArrowRight')) ax += 1;
    if (input.isDown('KeyW') || input.isDown('ArrowUp')) ay -= 1;
    if (input.isDown('KeyS') || input.isDown('ArrowDown')) ay += 1;

    const held = Math.hypot(ax, ay);
    if (held > 0) {
      ax /= held;
      ay /= held;
    }

    this.sneaking = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
    const topSpeed = this.sneaking ? TUNING.sneakSpeed : TUNING.walkSpeed;
    const k = 1 - Math.exp(-TUNING.playerAccel * dt);
    this.vx += (ax * topSpeed - this.vx) * k;
    this.vy += (ay * topSpeed - this.vy) * k;
    if (Math.hypot(this.vx, this.vy) < 3) {
      this.vx = 0;
      this.vy = 0;
    }

    const beforeX = this.x;
    const beforeY = this.y;
    const moved = moveWithCollision(game.level, this.x, this.y, this.vx * dt, this.vy * dt, this.radius);
    this.x = moved.x;
    this.y = moved.y;
    const travelled = Math.hypot(this.x - beforeX, this.y - beforeY);
    this.speed = dt > 0 ? travelled / dt : 0;
    this.moving = this.speed > 12;

    if (this.moving) {
      this.facing = turnToward(this.facing, Math.atan2(this.vy, this.vx), 9, dt);
      this.anim += dt;
      this.stepTimer += dt;
      const interval = this.sneaking ? TUNING.sneakStepTime : TUNING.walkStepTime;
      if (this.stepTimer >= interval) {
        this.stepTimer -= interval;
        this.steps += 1;
        const noise = this.sneaking ? TUNING.sneakNoise : TUNING.walkNoise;
        game.onPlayerStep(this.x, this.y, noise);
        game.audio.playerStep(this.sneaking ? 0.35 : 1);
      }
    } else {
      this.stepTimer = Math.min(this.stepTimer, 0.18);
    }

    this.hiding = game.level.isShadowAt(this.x, this.y);
  }

  // Where the lanterns see this courier from, and how much it takes to spot
  // them there: shadow is near-total cover until a guard is close.
  visibilityAt(distance, guard) {
    if (this.hiding) {
      return distance <= TUNING.shadowCloseRange ? TUNING.shadowCloseVisibility : 0;
    }
    const closeness = 0.35 + 0.65 * (1 - Math.min(1, distance / guard.range));
    return (this.sneaking ? TUNING.sneakVisibility : 1) * closeness;
  }
}
