import { ENEMY_SPEED, COLORS } from '../../utils/constants';

// PUBLIC_INTERFACE
export class Enemy {
  /** Simple patrolling enemy that reverses at bounds and can be stomped. */
  constructor(x, y, w = 24, h = 24, leftBound = x - 60, rightBound = x + 60) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.leftBound = Math.min(leftBound, rightBound);
    this.rightBound = Math.max(leftBound, rightBound);
    this.vx = ENEMY_SPEED;
    this.alive = true;
  }

  // PUBLIC_INTERFACE
  update(dt) {
    if (!this.alive) return;
    this.x += this.vx * dt;
    if (this.x < this.leftBound) {
      this.x = this.leftBound;
      this.vx *= -1;
    }
    if (this.x + this.w > this.rightBound) {
      this.x = this.rightBound - this.w;
      this.vx *= -1;
    }
  }

  // PUBLIC_INTERFACE
  kill() {
    this.alive = false;
  }

  // PUBLIC_INTERFACE
  render(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.fillStyle = COLORS.enemy;
    ctx.beginPath();
    ctx.roundRect?.(this.x, this.y, this.w, this.h, 6);
    if (!ctx.roundRect) {
      ctx.fillRect(this.x, this.y, this.w, this.h);
    } else {
      ctx.fill();
    }
    ctx.restore();
  }
}
