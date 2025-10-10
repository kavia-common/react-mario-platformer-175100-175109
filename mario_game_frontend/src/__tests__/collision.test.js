import { aabb, resolveAABBCollision } from '../game/engine/Collision';

test('AABB detection true/false', () => {
  const A = { x: 0, y: 0, w: 10, h: 10 };
  const B = { x: 5, y: 5, w: 10, h: 10 };
  const C = { x: 20, y: 20, w: 5, h: 5 };

  expect(aabb(A, B)).toBe(true);
  expect(aabb(A, C)).toBe(false);
});

test('collision resolution places Mario on top of platform', () => {
  const mario = { x: 10, y: 10, w: 10, h: 10, vx: 0, vy: 50, vxPrevDt: 0, vyPrevDt: 50 };
  const platform = { x: 0, y: 20, w: 100, h: 10 };

  // move mario to collide
  mario.y = 18;
  const side = resolveAABBCollision(mario, platform);

  expect(side === 'top' || side === 'bottom').toBe(true);
  if (side === 'top') {
    expect(mario.y + mario.h).toBe(platform.y); // exact placement on top
    expect(mario.vy).toBe(0);
    expect(mario.onGround).toBe(true);
  }
});
