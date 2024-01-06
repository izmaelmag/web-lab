import type p5 from 'p5';
import type { Sketch } from 'p5-svelte';

type Params = {
	frequency?: number;
	amplitude?: number;
	phase?: number;
	width?: number;
	height?: number;
	scale?: number;
};

const defaults: Required<Params> = {
	frequency: 2,
	amplitude: 1,
	phase: 0,
	width: 80,
	height: 80,
	scale: 1
};

const norm = (val: number, scale = 1) => Number(((val % 1) * scale).toFixed(2));

const Sine: (p: Params) => Sketch = (inputParams: Partial<Params>) => (p: p5) => {
	const {
		frequency: fq,
		amplitude: amp,
		phase: ph,
		width: W,
		height: H,
		scale: sc
	} = {
		...defaults,
		...inputParams
	};

	const scale = Math.ceil(amp);
	const safeZone = H * 0.8;
	const sineAmp = ((safeZone / 2) * amp * 1) / scale;
	const midLine = H / 2;
	const normPh = norm(ph, p.TWO_PI);

	// Frames counter
	let frame = 0;

	const drawGrid = () => {
		p.push();
		p.stroke(0, 120, 0);

		for (let n = 0; n <= scale; n++) {
			const dist = safeZone / (scale * 2);
			const y = midLine + dist * n;

			p.line(0, y, W, y);
			p.line(0, H - y, W, H - y);
		}

		p.line(0, midLine, W, midLine);
		p.line(W / 2, 0, W / 2, H);

		p.pop();
	};

	p.setup = () => {
		p.createCanvas(W, H);

		// Initial settings
		p.background(20);
		p.pixelDensity(4);
		p.strokeWeight(0.4);
		p.noFill();
	};

	p.draw = () => {
		p.background(20);

		drawGrid();

		p.beginShape();
		for (let x = 0; x <= W; x += 0.5) {
			// Normalize point's X-coordinate by 2𝜋
			const normRad = p.map(x, 0, W, 0, p.TWO_PI);

			// Form sine wave start and end with the cosine function for the same angle
			const intensity = p.map(Math.cos(normRad), -1, 1, 1, 0);

			const timing = (frame / -60) * p.TWO_PI * fq;

			const ySine = sineAmp * Math.sin(normPh + normRad * fq + timing) * intensity;

			p.vertex(x, midLine + ySine);
		}
		p.strokeCap(p.ROUND);
		p.stroke(0, 255, 0);
		p.endShape();

		frame += 1;
	};
};

export default Sine;
