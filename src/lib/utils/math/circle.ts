import type { Angle, Point } from '$lib/types/math';

export type CircleConstructorProps = {
	c: Point;
	r: number;
	a?: Angle;
};

export class Circle {
	r: number;
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
			x: this.c.x + Math.cos(this.a + radians) * this.r,
			y: this.c.y + Math.sin(this.a + radians) * this.r
		};
	};
}

export const pointAtAngle = (x: number, y: number, r: number, a: number): Point => {
	return {
		x: x + r * Math.cos(a),
		y: y + r * Math.sin(a)
	};
};
