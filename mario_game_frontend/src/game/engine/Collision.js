import { rectIntersect } from '../../utils/helpers';

// PUBLIC_INTERFACE
export function aabb(a, b) {
  /** True if rectangles a and b intersect */
  return rectIntersect(a, b);
}

// PUBLIC_INTERFACE
export function resolveAABBCollision(entity, solid) {
  /**
   * Resolve collision between dynamic entity (with vx, vy) and solid rect {x,y,w,h}
   * Returns side resolved: 'top','bottom','left','right' or null
   */
  const prevX = entity.x - entity.vxPrevDt;
  const prevY = entity.y - entity.vyPrevDt;

  // Current and previous rects
  const e = { x: entity.x, y: entity.y, w: entity.w, h: entity.h };
  const p = { x: prevX, y: prevY, w: entity.w, h: entity.h };

  if (!aabb(e, solid)) return null;

  const dx1 = (p.x + p.w) - solid.x;         // coming from left overlap
  const dx2 = (solid.x + solid.w) - p.x;     // coming from right overlap
  const dy1 = (p.y + p.h) - solid.y;         // coming from top overlap
  const dy2 = (solid.y + solid.h) - p.y;     // coming from bottom overlap

  const resolveLeft = Math.abs(dx1);
  const resolveRight = Math.abs(dx2);
  const resolveTop = Math.abs(dy1);
  const resolveBottom = Math.abs(dy2);

  const minHoriz = Math.min(resolveLeft, resolveRight);
  const minVert = Math.min(resolveTop, resolveBottom);

  // Resolve using smallest penetration axis
  if (minHoriz < minVert) {
    if (resolveLeft < resolveRight) {
      // push left
      entity.x = solid.x - entity.w;
      entity.vx = 0;
      return 'left';
    } else {
      // push right
      entity.x = solid.x + solid.w;
      entity.vx = 0;
      return 'right';
    }
  } else {
    if (resolveTop < resolveBottom) {
      // push up (land on top)
      entity.y = solid.y - entity.h;
      entity.vy = 0;
      entity.onGround = true;
      return 'top';
    } else {
      // push down (hit from below)
      entity.y = solid.y + solid.h;
      entity.vy = 0;
      return 'bottom';
    }
  }
}
