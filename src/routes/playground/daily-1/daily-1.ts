import { P5Sketch, type SketchConstructorProps } from '$lib/modules/sketch/P5Sketch';
import type { ControlsData } from '$lib/types/controls';
import type { Sketch } from 'p5-svelte';
import type { NoiseFunction4D } from 'simplex-noise';
import { createNoise4D } from 'simplex-noise';

export type Params = {
	amplitude: number;
	debug: boolean;
	radius: number;
	wobble: number;
	shadeIntense: number;
};

export const defaultParams: Params & ControlsData = {
	amplitude: 10,
	debug: false,
	radius: 100,
	wobble: 1,
	shadeIntense: 1
};

type TickFunction = (state: { currentFrame: number; isPlaying: boolean }) => void;

export class Daily1 extends P5Sketch<Params> {
	params: Params;
	isPlaying = true;
	onTick: TickFunction;
	noise4d: NoiseFunction4D;
	img: typeof Image;

	precision = 360;
	circleNoises: number[] = new Array(this.precision).fill(0);

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
		p.background(0);
		p.frameRate(60);

		this.img = p.loadImage('https://raw.githubusercontent.com/zeh/prando/HEAD/docs/noise.png');

		this.noise4d = createNoise4D();
	};

	updatePointsNoise = (offset = 0) => {
		const p = this.p;

		const noiseLoopX = Math.cos(this.mainAngle);
		const noiseLoopY = Math.sin(this.mainAngle);

		for (let n = 0; n < this.precision; n++) {
			const pointAngle = p.PI / -2 + (n * p.TWO_PI) / this.precision;

			this.circleNoises[n] = this.noise4d(
				offset + this.center.x + Math.cos(pointAngle) * this.params.wobble,
				offset + this.center.y + Math.sin(pointAngle) * this.params.wobble,
				noiseLoopX,
				noiseLoopY
			);
		}
	};

	drawCircles = () => {
		const p = this.p;
		this.updatePointsNoise();

		p.beginShape();
		this.circleNoises.forEach((noiseValue, i) => {
			const angleStep = p.TWO_PI / this.circleNoises.length;
			const angle = angleStep * i;

			p.vertex(
				this.center.x +
					(this.params.radius + noiseValue * this.params.amplitude * this.params.shadeIntense) *
						p.cos(angle) +
					Math.cos(this.mainAngle) * 10,
				this.center.y +
					(this.params.radius + noiseValue * this.params.amplitude * this.params.shadeIntense) *
						p.sin(angle) +
					Math.sin(this.mainAngle) * 10
			);
		});
		p.stroke(255);
		p.fill(255);
		p.endShape(p.CLOSE);

		this.updatePointsNoise(200);
		p.beginShape();
		this.circleNoises.forEach((noiseValue, i) => {
			const angleStep = p.TWO_PI / this.circleNoises.length;
			const angle = angleStep * i;

			p.vertex(
				this.center.x +
					(this.params.radius * 1 + noiseValue * this.params.amplitude) * p.cos(angle),
				this.center.y + (this.params.radius * 1 + noiseValue * this.params.amplitude) * p.sin(angle)
			);
		});
		p.stroke(255);
		p.strokeWeight(2);
		p.fill(0);
		p.endShape(p.CLOSE);
	};

	get mainAngle() {
		return this.progress * Math.PI * 2 - Math.PI / 2;
	}

	draw = () => {
		const { p } = this;

		p.background(0, 0, 0, 30);

		this.drawCircles();
		
		p.stroke(120);
		if (this.isPlaying) {
			for (let i = 0; i < 4000; i++) {
				const x = Math.random() * this.settings.w;
				const y = Math.random() * this.settings.h;
				p.strokeWeight(1);
				p.point(x, y);
			}
		}

		if (this.onTick) {
			this.onTick({ currentFrame: this.currentFrame, isPlaying: this.isPlaying });
		}
	};
}
