import type p5 from 'p5';
import type { Sketch } from 'p5-svelte';

export type SineProps = {
	frequency?: number;
	amplitude?: number;
	phase?: number;
};

export type Params = {
	sines?: SineProps[];
	width?: number;
	height?: number;
	scale?: number;
	fade?: boolean;
	animated?: boolean;
};

export const defaultSine: Required<SineProps> = { amplitude: 1, frequency: 1, phase: 1 };

export const defaults: Required<Params> = {
	sines: [defaultSine],
	width: 80,
	height: 80,
	scale: 1,
	fade: false,
	animated: false
};

const Sine: (p: Params) => Sketch = (inputParams: Partial<Params>) => (p: p5) => {
	const {
		width: W,
		height: H,
		animated,
		sines,
		fade
	} = {
		...defaults,
		...inputParams
	};

	// Frames counter
	let frame = 0;

	const safeZone = H * 0.75;
	const midLine = H / 2;

	const maxAmp = sines.reduce((sum, { amplitude }) => (sum += amplitude || 0), 0);
	const scale = maxAmp;

	const calcSine = (sine: SineProps = defaultSine, phi = 0) => {
		const { frequency, phase, amplitude } = {
			...defaultSine,
			...sine
		};

		const sinePhase = (phase % 1) * p.TWO_PI;

		const timing = animated ? (frame / -60) * p.TWO_PI * frequency * 0.2 : 0;
		const sineAmp = scale < 1 ? amplitude : amplitude * ((1 / maxAmp) * scale);
		const sineValue = sineAmp * p.sin(sinePhase + Number(phi.toFixed(4)) * frequency + timing);

		return Number(sineValue.toFixed(4));
	};

	const drawGrid = () => {
		p.push();
		p.stroke(0, 120, 0);
		p.line(0, midLine, W, midLine);
		p.line(W / 2, 0, W / 2, H);
		p.pop();
	};

	const drawFade = () => {
		if (frame < 25) {
			p.push();
			p.noStroke();
			p.fill(0, 255 - frame * 25);
			p.rect(0, 0, W, H);
			p.noFill();
			p.pop();
		}
	};

	p.setup = () => {
		p.createCanvas(W, H);

		// Initial settings
		p.background(20);
		p.pixelDensity(2);
		p.strokeWeight(0.5);
		p.strokeJoin(p.ROUND);
		p.frameRate(60);
		p.noFill();
	};

	p.draw = () => {
		p.background(20);

		drawGrid();

		p.beginShape();
		for (let x = 0; x <= W; x += 1) {
			// Normalize point's X-coordinate by 2𝜋
			const phi = p.map(x, 0, W, 0, p.TWO_PI);

			// Form sine wave start and end with the cosine function for the same angle
			const intensity = fade ? p.map(Math.cos(phi), -1, 1, 1, 0) : 1;

			const sinesSum = sines.map((sine) => calcSine(sine, phi)).reduce((sum, val) => sum + val, 0);

			const normSine = maxAmp < 1 ? sinesSum : p.map(sinesSum, -maxAmp, maxAmp, -1, 1);

			const ySine = normSine * intensity;
			const y = midLine + ySine * (safeZone / 2);
			p.vertex(x, y);
			// p.circle(x, y, 1);
		}
		p.stroke(0, 255, 0);
		p.endShape();

		drawFade();

		// p.noLoop();

		frame += 1;
	};
};

export default Sine;
