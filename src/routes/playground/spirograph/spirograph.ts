import { P5Sketch, type SketchConstructorProps } from '$lib/modules/sketch/P5Sketch';
import type { Graphics, Vector } from 'p5';

type Params = {
	radius: number;
};

export class Spirograph extends P5Sketch<Params> {
	bg: Graphics;
	fg: Graphics;

	constructor(props: SketchConstructorProps<Params>) {
		super(props);

		this.params = props.params;
	}

	// Map progress value on full circle radians of 2𝜋
	private getRad = (fraction = 1) => {
		const { map, TWO_PI } = this.p;
		return map(this.currentFrame, 0, this.totalFrames / fraction, 0, TWO_PI);
	};

	setup = (p) => {
		const {
			size: { w, h }
		} = this;

		this.bg = p.createGraphics(0, 0);
		this.fg = p.createGraphics(w, h);
	};

	draw = () => {
		const {
			p,
			center,
			params,
			size: { w, h }
		} = this;

		let prevPoint: Vector | null = null;

		p.background(255);
		p.image(this.bg, 0, 0, w, h);

		const R = params.radius;

		p.noFill();
		p.stroke(0);
		p.circle(center.x, center.y, R);

		p.noStroke();

		const dot = p.createVector(
			center.x + R * p.cos(p.PI + this.getRad(1)),
			center.y + R * p.sin(p.PI + this.getRad(1))
		);

		p.stroke(255, 0, 0);
		p.line(center.x, center.y, dot.x, dot.y);

		p.noStroke();
		p.fill(255, 0, 0);
		p.circle(dot.x, dot.y, 4);

		this.bg.noStroke();
		this.bg.fill(255, 0, 0);
		this.bg.circle(dot.x, dot.y, 0.5);

		prevPoint = dot;

		if (prevPoint) {
			this.bg.stroke(255, 0, 0);
			this.bg.line(dot.x, dot.y, prevPoint.x, prevPoint.y);
		}
	};
}
