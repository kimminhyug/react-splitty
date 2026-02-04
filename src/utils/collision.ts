import type { ModalBounds } from "../types";

/** 두 사각형이 겹치는지 */
export function intersects(a: ModalBounds, b: ModalBounds): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

/** a를 b와 겹치지 않도록 밀어냄. 이동량만 반환 (dx, dy) */
export function resolveCollision(
  a: ModalBounds,
  b: ModalBounds,
): { dx: number; dy: number } {
  if (!intersects(a, b)) return { dx: 0, dy: 0 };
  const overlapLeft = a.x + a.width - b.x;
  const overlapRight = b.x + b.width - a.x;
  const overlapTop = a.y + a.height - b.y;
  const overlapBottom = b.y + b.height - a.y;
  const minX = Math.min(overlapLeft, overlapRight);
  const minY = Math.min(overlapTop, overlapBottom);
  let dx = 0,
    dy = 0;
  if (minX < minY) {
    dx = overlapLeft < overlapRight ? -overlapLeft : overlapRight;
  } else {
    dy = overlapTop < overlapBottom ? -overlapTop : overlapBottom;
  }
  return { dx, dy };
}

/** 여러 bounds와 충돌 해결: id 제외한 나머지와 겹치지 않도록 이동량 누적 */
export function resolveCollisionsWithOthers(
  moving: ModalBounds,
  others: { id: string; bounds: ModalBounds }[],
  excludeId: string,
): { dx: number; dy: number } {
  let totalDx = 0,
    totalDy = 0;
  const current = { ...moving };
  const maxIter = 10;
  for (let iter = 0; iter < maxIter; iter++) {
    let any = false;
    for (const { id, bounds } of others) {
      if (id === excludeId) continue;
      const { dx, dy } = resolveCollision(current, bounds);
      if (dx !== 0 || dy !== 0) {
        current.x += dx;
        current.y += dy;
        totalDx += dx;
        totalDy += dy;
        any = true;
      }
    }
    if (!any) break;
  }
  return { dx: totalDx, dy: totalDy };
}
