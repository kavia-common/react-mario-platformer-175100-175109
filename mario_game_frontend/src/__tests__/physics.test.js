import { applyGravity, tryJump } from '../game/engine/Physics';
import { MAX_FALL_SPEED, GRAVITY, JUMP_FORCE } from '../utils/constants';

function createEntity() {
  return {
    vx: 0, vy: 0,
    onGround: false,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
  };
}

test('gravity increases vy up to terminal velocity', () => {
  const e = createEntity();
  const dt = 1/60;
  let steps = 600;
  while (steps--) {
    applyGravity(e, dt);
  }
  expect(e.vy).toBeLessThanOrEqual(MAX_FALL_SPEED);
  // After many frames vy should be at terminal speed
  expect(Math.abs(e.vy - MAX_FALL_SPEED)).toBeLessThan(1);
});

test('jump applies upward impulse when buffered and grounded', () => {
  const e = createEntity();
  e.onGround = true;

  const input = { isJump: () => true };
  tryJump(e, input, 1/60);

  expect(e.vy).toBe(-JUMP_FORCE);
});
