export const TILE_SIZE = 32;

// Logical world size (in tiles)
export const WORLD_WIDTH = 40;
export const WORLD_HEIGHT = 18;

// Physics
export const FIXED_DT = 1 / 60;
export const GRAVITY = 1800; // px/s^2
export const MAX_FALL_SPEED = 1800; // terminal velocity
export const MOVE_SPEED = 280; // px/s
export const MOVE_AIR_CONTROL = 0.75;
export const JUMP_FORCE = 700; // impulse vy
export const FRICTION_GROUND = 1800; // px/s^2 slowdown
export const FRICTION_AIR = 300; // px/s^2
export const COYOTE_TIME = 0.08; // seconds allowed after leaving ground
export const JUMP_BUFFER = 0.10; // seconds allowed before landing

// Entities
export const ENEMY_SPEED = 80;
export const MARIO_WIDTH = 24;
export const MARIO_HEIGHT = 28;

export const COLORS = {
  sky: '#D6E6FF',
  ground: '#94A3B8',
  platform: '#94A3B8',
  mario: '#2563EB',
  enemy: '#EF4444',
  coin: '#F59E0B',
};

// Controls
export const KEYS = {
  LEFT: ['ArrowLeft', 'a', 'A'],
  RIGHT: ['ArrowRight', 'd', 'D'],
  JUMP: ['ArrowUp', 'w', 'W', ' '],
  PAUSE: ['p', 'P'],
};
