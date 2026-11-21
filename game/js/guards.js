// The watch. Each guard walks a learned route of waypoints, pauses to sweep the
// lantern head, and reacts in five states: patrol, suspect (a noise or a shape),
// alert (the courier is made), search (the last place they were seen) and return
// (back to the route). Reaction is deliberately generous: breaking sight drains
// the suspicion and the watch goes back to its round.

import { GUARD_TUNING, TILE } from './config.js';
import { angleDifference, distance, moveWithCollision, turnToward } from './utils.js';
import { lineOfSight } from './vision.js';

export class Guard {
  constructor(def, index) {
    this.index = index;
    this.name = def.name;
    this.route = def.route.map(([tx, ty]) => ({ x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE }));
    this.speedScale = def.speed ?? 1;
    this.pauseTime = def.pause ?? 1.2;
    this.sweep = def.sweep ?? GUARD_TUNING.pauseSweep;
    this.range = def.range ?? GUARD_TUNING.sightRange;
    this.halfAngle = GUARD_TUNING.halfAngle;
    this.radius = GUARD_TUNING.radius;
    this.x = this.route[0].x;
    this.y = this.route[0].y;
    this.facing = def.facing ?? 0;
    this.baseFacing = this.facing;
    this.waypoint = this.route.length > 1 ? 1 : 0;
    this.direction = 1;
    this.pingpong = def.pingpong !== false;
    this.state = 'patrol';
    this.wait = 0.4 + index * 0.35;
    this.sweepClock = 0;
    this.search = 0;
    this.investigate = null;
    this.lastSeen = null;
    this.sinceSeen = 0;
    this.staring = false;
    this.canSeeNow = false;
    this.playerDistance = Infinity;
    this.moving = false;
    this.anim = 0;
    this.bob = 0;
    this.stepClock = GUARD_TUNING.stepTime * (0.4 + index * 0.23);
    this.footfalls = 0;
    this.alertedOnce = false;
  }

  // Is the courier inside the lantern cone with nothing solid between them?
  lookAt(player, level) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    this.playerDistance = dist;
    if (dist > this.range) {
      this.canSeeNow = false;
      return { visible: false, distance: dist, angle: Math.atan2(dy, dx) };
    }
    const angle = Math.atan2(dy, dx);
    const inCone = Math.abs(angleDifference(this.facing, angle)) <= this.halfAngle;
    this.canSeeNow = inCone && lineOfSight(level, this.x, this.y, player.x, player.y);
    return { visible: this.canSeeNow, distance: dist, angle };
  }

  // A footstep, a crate knocked, a door: sounds carry further than sight and
  // pull the nearest idle guard toward them.
  hearNoise(x, y, radius) {
    if (this.state === 'alert' || this.state === 'search') return false;
    const d = distance(this.x, this.y, x, y);
    if (d > radius * 1.25) return false;
    if (this.state === 'suspect') {
      this.investigate = { x, y };
      this.search = Math.max(this.search, 2.2);
      return true;
    }
    this.enterSuspect(x, y, false);
    return true;
  }

  enterSuspect(x, y, staring) {
    if (this.state === 'alert') return;
    this.state = 'suspect';
    this.investigate = { x, y };
    this.staring = staring;
    this.search = staring ? 1.5 : 2.8;
    this.baseFacing = this.facing;
    this.sweepClock = 0;
    this.wait = 0;
  }

  enterAlert(x, y) {
    const fresh = this.state !== 'alert';
    this.state = 'alert';
    this.lastSeen = { x, y };
    this.sinceSeen = 0;
    this.staring = false;
    if (fresh) this.alertedOnce = true;
    return fresh;
  }

  enterSearch() {
    this.state = 'search';
    this.search = GUARD_TUNING.searchTime;
    this.baseFacing = this.facing;
    this.sweepClock = 0;
    this.staring = false;
  }

  enterReturn() {
    this.state = 'return';
    let best = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < this.route.length; i += 1) {
      const d = distance(this.x, this.y, this.route[i].x, this.route[i].y);
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    }
    this.waypoint = best;
    this.staring = false;
  }

  update(dt, game) {
    this.anim += dt;
    this.sweepClock += dt;
    this.moving = false;
    switch (this.state) {
      case 'patrol':
        this.walkPatrol(dt, game);
        break;
      case 'suspect':
        this.walkSuspect(dt, game);
        break;
      case 'alert':
        this.walkAlert(dt, game);
        break;
      case 'search':
        this.search -= dt;
        this.sweepLantern(dt);
        this.tickStep(dt, game, 0.2);
        if (this.search <= 0) this.enterReturn();
        break;
      case 'return':
        this.walkReturn(dt, game);
        break;
      default:
        break;
    }
  }

  walkPatrol(dt, game) {
    if (this.route.length === 1) {
      this.wait -= dt;
      this.sweepLantern(dt);
      this.tickStep(dt, game, 0.18);
      return;
    }
    if (this.wait > 0) {
      this.wait -= dt;
      this.sweepLantern(dt);
      this.tickStep(dt, game, 0.18);
      return;
    }
    const target = this.route[this.waypoint];
    const arrived = this.walkToward(target.x, target.y, GUARD_TUNING.patrolSpeed * this.speedScale, dt, game.level);
    this.tickStep(dt, game, 1);
    if (arrived) {
      this.wait = this.pauseTime;
      this.baseFacing = this.facing;
      this.sweepClock = 0;
      this.advanceWaypoint();
    }
  }

  // Closed routes walk a ring; open routes walk to the end and back, so a sweep
  // never cuts a diagonal through the middle of the floor.
  advanceWaypoint() {
    if (this.route.length <= 1) return;
    if (!this.pingpong) {
      this.waypoint = (this.waypoint + 1) % this.route.length;
      return;
    }
    if (this.waypoint === 0) this.direction = 1;
    else if (this.waypoint === this.route.length - 1) this.direction = -1;
    this.waypoint += this.direction;
    this.waypoint = Math.max(0, Math.min(this.route.length - 1, this.waypoint));
  }

  walkSuspect(dt, game) {
    if (this.staring && this.canSeeNow) {
      const angle = Math.atan2(game.player.y - this.y, game.player.x - this.x);
      this.facing = turnToward(this.facing, angle, GUARD_TUNING.turnRate * 1.5, dt);
      this.tickStep(dt, game, 0.22);
      return;
    }
    this.staring = false;
    if (!this.investigate) {
      this.enterReturn();
      return;
    }
    const d = distance(this.x, this.y, this.investigate.x, this.investigate.y);
    if (d > 8) {
      this.walkToward(this.investigate.x, this.investigate.y, GUARD_TUNING.suspectSpeed * this.speedScale, dt, game.level);
      this.tickStep(dt, game, 0.85);
      return;
    }
    this.baseFacing = this.facing;
    this.search -= dt;
    this.sweepLantern(dt);
    this.tickStep(dt, game, 0.18);
    if (this.search <= 0) this.enterReturn();
  }

  walkAlert(dt, game) {
    if (this.canSeeNow) {
      this.sinceSeen = 0;
      this.lastSeen = { x: game.player.x, y: game.player.y };
    } else {
      this.sinceSeen += dt;
    }
    if (this.sinceSeen > 2.2) {
      this.enterSearch();
      return;
    }
    if (!this.lastSeen) {
      this.enterSearch();
      return;
    }
    const d = distance(this.x, this.y, this.lastSeen.x, this.lastSeen.y);
    if (d > 7) {
      this.walkToward(this.lastSeen.x, this.lastSeen.y, GUARD_TUNING.alertSpeed * this.speedScale, dt, game.level);
      this.tickStep(dt, game, 1.35);
      return;
    }
    this.enterSearch();
  }

  walkReturn(dt, game) {
    const target = this.route[this.waypoint];
    const arrived = this.walkToward(target.x, target.y, GUARD_TUNING.patrolSpeed * this.speedScale, dt, game.level);
    this.tickStep(dt, game, 0.9);
    if (arrived) {
      this.state = 'patrol';
      this.wait = 0.35;
      this.baseFacing = this.facing;
      this.sweepClock = 0;
      this.advanceWaypoint();
    }
  }

  sweepLantern(dt) {
    const swing = Math.sin(this.sweepClock * GUARD_TUNING.pauseSweepRate) * this.sweep;
    this.facing = turnToward(this.facing, this.baseFacing + swing, GUARD_TUNING.turnRate, dt);
  }

  walkToward(targetX, targetY, speed, dt, level) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) return true;
    const angle = Math.atan2(dy, dx);
    this.facing = turnToward(this.facing, angle, GUARD_TUNING.turnRate, dt);
    const step = Math.min(d, speed * dt);
    const moved = moveWithCollision(level, this.x, this.y, Math.cos(this.facing) * step, Math.sin(this.facing) * step, this.radius);
    const travelled = Math.hypot(moved.x - this.x, moved.y - this.y);
    this.x = moved.x;
    this.y = moved.y;
    this.moving = travelled > 0.15;
    if (this.moving) this.bob += travelled;
    return d <= step + 0.5 || travelled < 0.2;
  }

  tickStep(dt, game, pace) {
    this.stepClock -= dt * pace;
    if (this.stepClock > 0) return;
    this.stepClock = GUARD_TUNING.stepTime;
    this.footfalls += 1;
    game.onGuardStep(this);
  }

  lanternGlow() {
    return this.state === 'alert' ? 1.25 : this.state === 'suspect' ? 0.85 : 0.6;
  }
}
