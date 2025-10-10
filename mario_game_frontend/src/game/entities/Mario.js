import { MARIO_WIDTH, MARIO_HEIGHT, MOVE_SPEED, MOVE_AIR_CONTROL, COLORS } from '../../utils/constants';
import { applyGravity, tryJump, integrate, applyHorizontalMovement, beginPhysicsStep, endPhysicsStep } from '../engine/Physics';

// PUBLIC_INTERFACE
export class Mario {
  /** Simple rectangular Mario entity with physics and controls. */
  constructor(spawnX, spawnY, input) {
    this.x = spawnX;
    this.y = spawnY;
    this.w = MARIO_WIDTH;
    this.h = MARIO_HEIGHT;

    this.vx = 0;
    this.vy = 0;

    this.vxPrevDt = 0;
    this.vyPrevDt = 0;

    this.moveSpeed = MOVE_SPEED;
    this.input = input;

    this.onGround = false;
    this.wasOnGround = false;
    this.facing = 1;
    this.alive = true;

    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
  }

  // PUBLIC_INTERFACE
  update(dt) {
    /** Update physics and input for Mario. */
    if (!this.alive) return;

    beginPhysicsStep(this);
    this.vxPrevDt = this.vx * dt;
    this.vyPrevDt = this.vy * dt;

    const moveDir = (this.input.isLeft() ? -1 : 0) + (this.input.isRight() ? 1 : 0);

    applyHorizontalMovement(this, dt, moveDir, this.onGround);
    tryJump(this, this.input, dt);
    applyGravity(this, dt);
    integrate(this, dt);
    endPhysicsStep(this);
  }

  // PUBLIC_INTERFACE
  stomp() {
    /** Called when Mario stomps enemy */
    this.vy = -Math.abs(this.vy) * 0.4 - 320; // small bounce upwards
  }

  // PUBLIC_INTERFACE
  render(ctx) {
    /** Render Mario as rounded rectangle with face indicator */
    ctx.save();
    ctx.fillStyle = COLORS.mario;
    const r = 6;
    roundRect(ctx, this.x, this.y, this.w, this.h, r);
    ctx.fill();

    // Face indicator
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    const eyeX = this.facing > 0 ? this.x + this.w - 8 : this.x + 4;
    ctx.fillRect(eyeX, this.y + 6, 3, 3);
    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
