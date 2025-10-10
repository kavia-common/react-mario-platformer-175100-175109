import { GRAVITY, MAX_FALL_SPEED, FRICTION_GROUND, FRICTION_AIR, JUMP_FORCE, COYOTE_TIME, JUMP_BUFFER } from '../../utils/constants';
import { clamp, sign } from '../../utils/helpers';

// PUBLIC_INTERFACE
export function applyHorizontalMovement(entity, dt, moveDir, onGround) {
  /** Applies horizontal acceleration/friction based on input and grounded state. */
  const accFriction = onGround ? FRICTION_GROUND : FRICTION_AIR;
  const targetVx = entity.moveSpeed * moveDir;
  const diff = targetVx - entity.vx;
  const step = clamp(diff, -accFriction * dt, accFriction * dt);
  entity.vx += step;

  // Facing
  if (moveDir !== 0) {
    entity.facing = moveDir > 0 ? 1 : -1;
  } else if (onGround && Math.abs(entity.vx) < 5) {
    entity.vx = 0;
  }
}

// PUBLIC_INTERFACE
export function applyGravity(entity, dt) {
  /** Applies gravity to entity vy clamped by terminal velocity. */
  entity.vy = clamp(entity.vy + GRAVITY * dt, -Infinity, MAX_FALL_SPEED);
}

// PUBLIC_INTERFACE
export function tryJump(entity, input, dt) {
  /**
   * Handle jump using coyote time and jump buffer.
   * entity should track: onGround, coyoteTimer, jumpBufferTimer
   */
  entity.coyoteTimer = Math.max(0, entity.coyoteTimer - dt);
  entity.jumpBufferTimer = Math.max(0, entity.jumpBufferTimer - dt);

  if (input.isJump()) {
    entity.jumpBufferTimer = JUMP_BUFFER;
  }

  const canCoyote = entity.onGround || entity.coyoteTimer > 0;
  if (entity.jumpBufferTimer > 0 && canCoyote) {
    entity.vy = -JUMP_FORCE; // impulse upward
    entity.onGround = false;
    entity.coyoteTimer = 0;
    entity.jumpBufferTimer = 0;
  }
}

// PUBLIC_INTERFACE
export function integrate(entity, dt) {
  /** Integrate position with current velocity. */
  entity.x += entity.vx * dt;
  entity.y += entity.vy * dt;
}

// PUBLIC_INTERFACE
export function beginPhysicsStep(entity) {
  /** Prepare per-step state before applying physics. */
  if (entity.onGround && entity.vy > 0) {
    entity.vy = 0;
  }
  if (!entity.onGround && entity.wasOnGround) {
    // started in air this frame; ensure timers are correct
  }
  entity.wasOnGround = entity.onGround;
  if (!entity.onGround && entity.coyoteTimer === undefined) {
    entity.coyoteTimer = 0;
  }
  if (!entity.onGround && entity.wasGroundedLastFrame) {
    // no-op; placeholder for future
  }
}

// PUBLIC_INTERFACE
export function endPhysicsStep(entity) {
  /** Update coyote timer at the end of step based on ground status. */
  if (entity.onGround) {
    entity.coyoteTimer = COYOTE_TIME;
  }
}
