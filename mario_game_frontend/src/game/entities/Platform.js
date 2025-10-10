import { COLORS } from '../../utils/constants';

// PUBLIC_INTERFACE
export class Platform {
  /** Static solid rectangle platform */
  constructor(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
  }

  // PUBLIC_INTERFACE
  render(ctx) {
    ctx.save();
    ctx.fillStyle = COLORS.platform;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.restore();
  }
}
