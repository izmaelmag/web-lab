import { P5Sketch, type SketchConstructorProps } from '$lib/modules/sketch/P5Sketch';
import type { ControlsData } from '$lib/types/controls';
import { Circle, pointAtAngle } from '$lib/utils/math/circle';
import type { Graphics } from 'p5';
import type { Sketch } from 'p5-svelte';

export type Params = {
	radius: number;
	branches: number;
};

export const defaultParams: Params & ControlsData = {
	radius: 50,
	branches: 1
};

export class Spirograph extends P5Sketch<Params> {
	bg: Graphics;
	params: Params;
	circle: Circle;
	isPlaying = true;

	constructor(props: SketchConstructorProps<Params>) {
		super(props);

		this.params = props.params || defaultParams;
		this.settings = props.settings;
	}

	setup: Sketch = (p) => {
		p.createCanvas(this.size.w, this.size.h);

		this.bg = p.createGraphics(this.size.w, this.size.h);

		this.circle = new Circle({
			c: this.center,
			r: this.params.radius,
			a: this.progress * Math.PI * 2
		});
	};

	draw = () => {
		const { p } = this;
		p.background(255);
		p.image(this.bg, 0, 0, this.settings.w, this.settings.h);

		const points = [];

		for (let i = 0; i < this.params.branches; i++) {
			const angle = (Math.PI * 2 * i) / this.params.branches;

			const point = pointAtAngle(
				this.center.x,
				this.center.y,
				this.params.radius,
				angle + this.progress * (Math.PI * 2) - Math.PI / 2
			);

			points.push(point);
		}

		points.forEach((point) => {
			p.stroke(0);
			p.fill(0);
			p.circle(point.x, point.y, 4);

			p.stroke('green');
			p.line(this.center.x, this.center.y, point.x, point.y);
		});
	};

	onLoop = () => {
		this.bg.clear(255, 255, 255, 255);
	};
}