import type { Sketch } from 'p5-svelte';

const PX = 4;
const GAP = 2;
const NX = 32;
const NY = 16;
const W = NX * (PX + GAP) - GAP;
const H = NY * (PX + GAP) - GAP;
const BG = [248, 250, 252, 255];
const CELL_DARK = [251, 140, 0, 255];
const CELL_BRIGHT = [0, 0, 0, 255];

const shader = (fragCoord: number[], time: number): number[] => {
	const uv = {
		x: fragCoord[0] / NX,
		y: fragCoord[1] / NY
	};

	const amp = 0.2;
	const freq = 3 * 2 * Math.PI;

	const sine = amp * Math.sin(freq * (uv.x - 0.5) - time * 2);
	const lineWidth = 0.1

	if (Math.abs(uv.y + sine - 0.5) > lineWidth) {
		return CELL_DARK; // BG color
	} else {
		return CELL_BRIGHT; // Sine color
	}
};

const LCD: Sketch = (p5) => {
	const renderPixel = (xi: number, yi: number, rgb = [0, 0, 0]) => {
		// Scale indexed coordinates to the canvas
		const x = xi * (PX + GAP);
		const y = yi * (PX + GAP);

		// Draw pixel as rect
		p5.fill(rgb);
		p5.rect(x, y, PX);
	};

	p5.setup = () => {
		p5.createCanvas(W, H);
		p5.noStroke();
		p5.background(BG);
	};

	p5.draw = () => {
		const TIME = p5.millis() * 0.002;

		for (let xi = 0; xi < NX; xi++) {
			for (let yi = 0; yi < NY; yi++) {
				let rgb = shader([xi, yi], TIME);
				if (isCorner(xi, yi, NX, NY)) rgb = BG;
				renderPixel(xi, yi, rgb);
			}
		}
	};
};

const isCorner = (x: number, y: number, w: number, h: number): boolean => {
	return (x === 0 || x === w - 1) && (y === 0 || y === h - 1);
};

export default LCD;
