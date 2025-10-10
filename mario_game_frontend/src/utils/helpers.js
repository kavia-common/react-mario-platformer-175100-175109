 // PUBLIC_INTERFACE
export function clamp(v, min, max) {
  /** Clamp a value between min and max. */
  return Math.max(min, Math.min(max, v));
}

// PUBLIC_INTERFACE
export function sign(v) {
  /** Return -1, 0, or 1 based on v sign. */
  if (v === 0) return 0;
  return v > 0 ? 1 : -1;
}

// PUBLIC_INTERFACE
export function rectIntersect(a, b) {
  /** Axis aligned rectangle overlap check. */
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.h + a.y > b.y
  );
}
