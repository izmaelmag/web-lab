import type { Point } from '$lib/types/math';

export class CirclePoint {
  center: Point;

  constructor({ center }: { center: Point }) {
    this.center = center;
  }
}
