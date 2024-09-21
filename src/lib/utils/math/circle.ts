import type { Angle, Point } from '$lib/types/math';

export type CircleConstructorProps = {
  c: Point;
  r: {
    x: number;
    y: number;
  };
  a?: Angle;
};

export class Circle {
  r: Point;
  c: Point;

  // Relative calculation angle of a circle
  a: Angle;

  constructor({ c, r, a = 0 }: CircleConstructorProps) {
    this.c = c;
    this.r = r;
    this.a = a;
  }

  pointAtAngle = (radians: Angle): Point => {
    return {
      x: this.c.x + Math.cos(this.a + radians) * this.r.x,
      y: this.c.y + Math.sin(this.a + radians) * this.r.y
    };
  };
}

export const pointAtAngle = (x: number, y: number, r: number, a: number): Point => {
  return {
    x: x + r * Math.cos(a),
    y: y + r * Math.sin(a)
  };
};
