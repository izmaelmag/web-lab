import type { Graphics } from 'p5';
import type { Sketch } from 'p5-svelte';

export const loop_demo: Sketch = (p) => {
	const w = 520;
	const h = 520;
	const fps = 60;
	const duration = 10;
	const totalFrames = fps * duration;

	let bg: Graphics;

	let progress = 0;
	let currentFrame = 0;

	const getRad = (fraction = 1) => p.map(currentFrame, 0, totalFrames / fraction, 0, p.TWO_PI);
	const getDeg = (fraction = 1) => p.map(currentFrame, 0, totalFrames / fraction, 0, 360);

	p.setup = () => {
		p.createCanvas(w, h);

		bg = p.createGraphics(w, h);
		bg.background(255);
	};

	p.draw = () => {
		currentFrame += 1;
		progress = p.map(currentFrame, 0, totalFrames, 0, 1);

		p.background(255);
		p.text(
			`Prg: ${(progress % 1).toFixed(2)}; Fr: ${currentFrame % totalFrames}; Rad: ${(
				getRad() % p.TWO_PI
			).toFixed(2)}; Deg: ${(getDeg() % 360).toFixed(2)}`,
			4,
			12
		);

		p.arc(54, 54 + 24, 100, 100, 0, getRad(1));
		p.arc(54, 54 + 24 + 100, 100, 100, 0, getRad(2));
		p.arc(54, 54 + 24 + 100 + 100, 100, 100, 0, getRad(3));
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
