import { P5Sketch, type SketchConstructorProps } from '$lib/modules/sketch/P5Sketch';
import type { ControlsData } from '$lib/types/controls';
import type { Point } from '$lib/types/math';
import { Circle } from '$lib/utils/math/circle';
import type { Graphics } from 'p5';
import type { Sketch } from 'p5-svelte';

export type Params = {
	radius: number;
	branches: number;
	showConnectors: boolean;
	showCircles: boolean;
};

export const defaultParams: Params & ControlsData = {
	radius: 50,
	branches: 1,
	showConnectors: true,
	showCircles: true
};

type SineLevel = {
	branches: number;
	startAngle: number;
	radius: {
		x: number;
		y: number;
	};
	rotationSpeed: number;
	origin?: Point;
};

type TickFunction = (state: {
	currentFrame: number;
	isPlaying: boolean;
	isRecording: boolean;
}) => void;

export class Spirograph extends P5Sketch<Params> {
	bg: Graphics;
	params: Params;
	isPlaying = true;
	onTick: TickFunction;

	levels: SineLevel[] = [
		{
			branches: 1,
			startAngle: (Math.PI / 2) * -1,
			radius: {
				x: 100,
				y: 100
			},
			rotationSpeed: 1,
			origin: {
				x: this.center.x,
				y: this.center.y
			}
		},
		{
			branches: 2,
			startAngle: 0,
			radius: {
				x: 50,
				y: 50
			},
			rotationSpeed: 2
		},
		{
			branches: 1,
			startAngle: 0,
			radius: {
				x: 30,
				y: 30
			},
			rotationSpeed: 4
		}
	];

	constructor(
		props: SketchConstructorProps<Params> & {
			onTick: TickFunction;
		}
	) {
		super(props);

		this.onTick = props.onTick;
		this.params = props.params || defaultParams;
		this.settings = props.settings;
	}

	setup: Sketch = (p) => {
		p.createCanvas(this.size.w, this.size.h);
		this.bg = p.createGraphics(this.size.w, this.size.h);
	};

	drawLevel = (n = 0, parentAngle = Math.PI / -2, origin = this.center) => {
		this.p.noFill();
		const levelData = this.levels[n];
		const angle = this.progress * Math.PI * 2 * levelData.rotationSpeed + parentAngle;

		const circle = new Circle({
			c: origin,
			r: levelData.radius,
			a: angle
		});

		const angleStep = (Math.PI * 2) / levelData.branches;

		if (this.params.showCircles) {
			this.p.arc(circle.c.x, circle.c.y, circle.r.x * 2, circle.r.y * 2, 0, Math.PI * 2);
		}

		for (let pn = 0; pn < levelData.branches; pn++) {
			const pointAngle = angleStep * pn;

			const point = circle.pointAtAngle(pointAngle);

			if (n === this.levels.length - 1) {
				this.bg.fill(0);
				this.bg.noStroke();
				this.bg.circle(point.x, point.y, 1);
			}

			if (this.levels[n + 1]) {
				this.drawLevel(n + 1, pointAngle + angle, point);
			}

			if (this.params.showConnectors) {
				this.p.stroke(120);
				this.p.line(circle.c.x, circle.c.y, point.x, point.y);
			}
		}
	};

	draw = () => {
		const { p } = this;

		p.background(255);
		p.image(this.bg, 0, 0, this.settings.w, this.settings.h);
		this.drawLevel(0);

		if (this.onTick) {
			this.onTick({
				currentFrame: this.currentFrame,
				isPlaying: this.isPlaying,
				isRecording: this.isRecording
			});
		}
	};

	onLoop = () => {
		// this.bg.clear(255, 255, 255, 255);
	};
}
