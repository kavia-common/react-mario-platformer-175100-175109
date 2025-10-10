import { COLORS } from '../../utils/constants';

// PUBLIC_INTERFACE
export class Coin {
  /** Collectable coin with a subtle vertical bob animation. */
  constructor(x, y, r = 8) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.baseY = y;
    this.t = 0;
    this.collected = false;
  }

  // PUBLIC_INTERFACE
  update(dt) {
    if (this.collected) return;
    this.t += dt;
    this.y = this.baseY + Math.sin(this.t * 4) * 4;
  }

  // PUBLIC_INTERFACE
  collect() {
    this.collected = true;
  }

  // PUBLIC_INTERFACE
  render(ctx) {
    if (this.collected) return;
    ctx.save();
    ctx.fillStyle = COLORS.coin;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // PUBLIC_INTERFACE
  getRect() {
    return { x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 };
  }
}
