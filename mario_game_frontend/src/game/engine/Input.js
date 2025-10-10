import { KEYS } from '../../utils/constants';

// PUBLIC_INTERFACE
export class Input {
  /** Keyboard input handler with basic action mapping. */
  constructor() {
    this._pressed = new Set();
    this._wasPressed = new Set();
    this._queue = [];

    this._onKeyDown = (e) => {
      const key = e.key;
      this._pressed.add(key);
      this._queue.push({ type: 'down', key });
      if (KEYS.PAUSE.includes(key)) e.preventDefault();
    };
    this._onKeyUp = (e) => {
      const key = e.key;
      this._pressed.delete(key);
      this._queue.push({ type: 'up', key });
    };
  }

  // PUBLIC_INTERFACE
  attach() {
    /** Attach DOM event listeners */
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  // PUBLIC_INTERFACE
  detach() {
    /** Detach DOM event listeners */
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }

  // PUBLIC_INTERFACE
  update() {
    /** Advance frame, track edge-triggered keys */
    this._wasPressed = new Set(this._pressed);
    this._queue = [];
  }

  // PUBLIC_INTERFACE
  isLeft() {
    return KEYS.LEFT.some((k) => this._pressed.has(k));
  }
  // PUBLIC_INTERFACE
  isRight() {
    return KEYS.RIGHT.some((k) => this._pressed.has(k));
  }
  // PUBLIC_INTERFACE
  isJump() {
    return KEYS.JUMP.some((k) => this._pressed.has(k));
  }
  // PUBLIC_INTERFACE
  pressedPause() {
    return this._queue.some((e) => e.type === 'down' && KEYS.PAUSE.includes(e.key));
  }

  // PUBLIC_INTERFACE
  emulatePress(key) {
    /** Programmatically press a key (for mobile controls) */
    this._pressed.add(key);
  }
  // PUBLIC_INTERFACE
  emulateRelease(key) {
    /** Programmatically release a key (for mobile controls) */
    this._pressed.delete(key);
  }
}
