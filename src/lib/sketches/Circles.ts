import type { Sketch } from 'p5-svelte';

const Circles: () => Sketch = () => (p5) => {
	const EXPECTED_SIZE = window.innerHeight * 1
	const S = window.innerWidth < EXPECTED_SIZE ? window.innerWidth : EXPECTED_SIZE;
	const C = S / 2;
	const N = 16;
	const SPEED = -0.125;

	const drawCircle = (phase = 0) => {
		const dt = p5.millis() * 0.001 * SPEED;
		const mainSin = p5.sin(dt + phase);
		const mainCos = p5.cos(dt + phase);

		// Calculus
		const center = { x: 0, y: 0 };
		const AMP = C - 4;
		const extremum = { x: center.x + AMP * mainSin, y: center.y };
		const xRad = extremum.x - center.x;
		const yRad = p5.map(mainCos, -1, 1, 0, p5.PI / 2) * AMP;
		const midPoint = { x: center.x + xRad / 2, y: center.y };

		p5.noFill();
		p5.stroke(200, 200, 200, 255);
		p5.ellipse(midPoint.x, midPoint.y, p5.abs(xRad), yRad);
	};

	p5.setup = () => {
		p5.createCanvas(S, S);
		p5.noStroke();
		p5.strokeWeight(0.5);
		p5.angleMode(p5.RADIANS);
	};

	p5.draw = () => {
		p5.clear(255, 255, 255, 255);
		p5.translate(C, C);

		const phaseStep = p5.TWO_PI / N;

		p5.rotate(p5.PI / 2);
		for (let n = 0; n <= N; n++) {
			drawCircle(phaseStep * n);
		}

		p5.rotate(p5.PI / 2);
		for (let n = 0; n <= N; n++) {
			drawCircle(phaseStep * n);
		}
	};
};

export default Circles;
