import type { Graphics } from 'p5';
import type { Sketch } from 'p5-svelte';

function easeOutQuad(x: number): number {
	return 1 - (1 - x);
}

const easeInQuad = (x: number): number => {
	return x * x * x * x * x * x * x * x * x * x * x;
};

const easeInQuint = (x: number): number => {
	return x * x * x * x * x;
};

function easeOutElastic(x: number): number {
	const c4 = (2 * Math.PI) / 3;

	return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

function easeOutExpo(x: number): number {
	return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

export const spirograph: Sketch = (p) => {
	const w = 520;
	const h = 520;
	const fps = 60;
	const duration = 5;
	const totalFrames = fps * duration;

	let bg: Graphics;

	let progress = 0;
	let currentFrame = 0;

	let prevPoint: { x: number; y: number } | null = null;

	const C = {
		x: w / 2,
		y: h / 2
	};

	const getRad = (fraction = 1) => p.map(currentFrame, 0, totalFrames / fraction, 0, p.TWO_PI);
	const getDeg = (fraction = 1) => p.map(currentFrame, 0, totalFrames / fraction, 0, 360);

	p.setup = () => {
		p.createCanvas(w, h);

		bg = p.createGraphics(w, h);
		bg.background(255);
	};

	p.draw = () => {
		// p.background(255);

		// Progress calculations
		currentFrame += 1;
		progress = p.map(currentFrame, 0, totalFrames, 0, 1);

		p.image(bg, 0, 0, w, h);

		let R =
			100 +
			75 * easeOutQuad(p.map(p.sin(getRad(12) ), -1, 1, 0, 1)) +
		 -100 * easeInQuad(p.map(p.sin(getRad(0.4) ), -1, 1, 0, 1));

		// p.noFill();
		// p.stroke(0);
		// p.circle(C.x, C.y, R);

		p.noStroke();

		const dot = {
			x: C.x + R * p.cos(p.PI + getRad(1)),
			y: C.y + R * p.sin(p.PI + getRad(1))
		};

		// bg.stroke(255, 0, 0);
		// bg.line(C.x, C.y, dot.x, dot.y);

		p.noStroke();
		p.fill(255, 0, 0);
		p.circle(dot.x, dot.y, 5);

		bg.noStroke();
		bg.fill(255, 0, 0);
		bg.circle(dot.x, dot.y, 1);

		if (prevPoint) {
			bg.stroke(255, 0, 0);
			bg.line(dot.x, dot.y, prevPoint.x, prevPoint.y);
		}

		prevPoint = dot;
	};

	p.keyPressed = () => {
		if (p.key === 's') {
			progress = 0;
			currentFrame = 0;

			p.saveGif('mySketch', totalFrames, {
				delay: 0,
				units: 'frames',
				silent: false
			});
		}
	};
};
