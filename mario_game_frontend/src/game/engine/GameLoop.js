import { FIXED_DT } from '../../utils/constants';

// PUBLIC_INTERFACE
export class GameLoop {
  /**
   * Fixed timestep game loop.
   * onUpdate(dt): called at fixed dt (seconds)
   * onRender(alpha): called per frame for rendering. alpha is interpolation factor [0,1]
   */
  constructor({ onUpdate, onRender } = {}) {
    this.onUpdate = onUpdate || (() => {});
    this.onRender = onRender || (() => {});
    this._accumulator = 0;
    this._running = false;
    this._last = 0;
    this._raf = null;
  }

  // PUBLIC_INTERFACE
  start() {
    /** Start the loop */
    if (this._running) return;
    this._running = true;
    this._accumulator = 0;
    this._last = performance.now();
    const loop = (t) => {
      if (!this._running) return;
      const now = t;
      let delta = (now - this._last) / 1000; // seconds
      if (delta > 0.25) delta = 0.25; // avoid spiral of death
      this._last = now;

      this._accumulator += delta;

      while (this._accumulator >= FIXED_DT) {
        this.onUpdate(FIXED_DT);
        this._accumulator -= FIXED_DT;
      }

      const alpha = this._accumulator / FIXED_DT;
      this.onRender(alpha);

      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  // PUBLIC_INTERFACE
  stop() {
    /** Stop the loop */
    if (!this._running) return;
    this._running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
  }
}
