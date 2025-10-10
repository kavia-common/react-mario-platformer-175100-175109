import { KEYS } from '../utils/constants';

// PUBLIC_INTERFACE
export default function Controls() {
  /**
   * Simple on-screen controls for mobile: Left, Jump, Right.
   * Interacts by emulating key presses on currently attached input if exposed by GameCanvas (keys).
   */
  const press = (key) => {
    const canvas = document.querySelector('canvas');
    if (canvas && canvas.parentElement) {
      const input = canvas?.__input || window.__gameInput;
      if (input) input.emulatePress(key);
    }
  };
  const release = (key) => {
    const canvas = document.querySelector('canvas');
    if (canvas && canvas.parentElement) {
      const input = canvas?.__input || window.__gameInput;
      if (input) input.emulateRelease(key);
    }
  };

  const Button = ({ label, keycode }) => (
    <button
      className="button"
      onMouseDown={() => press(keycode)}
      onMouseUp={() => release(keycode)}
      onMouseLeave={() => release(keycode)}
      onTouchStart={(e) => { e.preventDefault(); press(keycode); }}
      onTouchEnd={(e) => { e.preventDefault(); release(keycode); }}
      aria-label={label}
    >
      {label}
    </button>
  );

  return (
    <div className="canvas-controls mobile-only">
      <Button label="◀︎" keycode={KEYS.LEFT[0]} />
      <Button label="⤒" keycode={KEYS.JUMP[0]} />
      <Button label="▶︎" keycode={KEYS.RIGHT[0]} />
    </div>
  );
}
