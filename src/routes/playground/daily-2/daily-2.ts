import { P5Sketch, type SketchConstructorProps } from '$lib/modules/sketch/P5Sketch';
import type { ControlsData } from '$lib/types/controls';
import type { Graphics, Image } from 'p5';
import type { NoiseFunction4D } from 'simplex-noise';
import { createNoise4D } from 'simplex-noise';

export type Params = {
	gridSize: number;
	noiseScale: number;
	fade: number;
	speed: number;
	darkness: number;
};

export const defaultParams: Params & ControlsData = {
	gridSize: 42,
	noiseScale: 0.04,
	fade: 40,
	speed: 1,
	darkness: -3
};

type TickFunction = (state: {
	currentFrame: number;
	isPlaying: boolean;
	isRecording: boolean;
}) => void;

export class Daily2 extends P5Sketch<Params> {
	params: Params;
	isPlaying = true;
	onTick: TickFunction;
	noise4d: NoiseFunction4D;
	staticNoiseAmount = 4000;
	noiseGrid: number[] = [];
	cellSize = 0;
	fragmentsCount = 10;
	fragments: Image[] = [];

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

	// Returns radians aligned with progress
	get mainAngle() {
		return this.progress * Math.PI * 2 - Math.PI / 2;
	}

	// Returns noise 3rd and 4th dimensions to create a loop on a plane
	get loopNoise() {
		return {
			x: Math.cos(this.mainAngle * this.params.speed),
			y: Math.sin(this.mainAngle * this.params.speed)
		};
	}

	loadFragments = () => {
		for (let n = 0; n < this.fragmentsCount; n++) {
			const image = this.p.loadImage(`/sketch/daily-2/fragments/set1/${n}.png`);
			this.fragments[n] = image;
		}
	};

	setup = async () => {
		this.p.createCanvas(this.size.w, this.size.h);
		this.p.background(255);
		this.p.frameRate(this.settings.fps);
		this.noise4d = createNoise4D();
		this.p.noStroke();
		this.p.noSmooth();
		await this.loadFragments();
	};

	updateNoiseGrid = () => {
		const {
			params: { gridSize, noiseScale },
			loopNoise: { x, y },
			settings: { w },
			noise4d
		} = this;

		this.cellSize = Math.ceil(w / gridSize);

		for (let i = 0; i < gridSize; i++) {
			for (let j = 0; j < gridSize; j++) {
				this.noiseGrid[i + j * gridSize] = noise4d(i * noiseScale, j * noiseScale, x, y);
			}
		}
	};

	drawCells = () => {
		const {
			p,
			cellSize,
			params: { gridSize, darkness }
		} = this;

		for (let i = 0; i < gridSize; i++) {
			for (let j = 0; j < gridSize; j++) {
				const cellNoiseValue = this.noiseGrid[i + j * gridSize];

				const minIndex = p.constrain(darkness, 0, 8)
				const maxIndex = p.constrain(darkness, -8, 0) * -1

				const fragmentIndex = Math.round(p.map(cellNoiseValue, -1, 1, minIndex, 9 - maxIndex));
				const cellX = Math.round(i * cellSize);
				const cellY = Math.round(j * cellSize);

				p.fill(255);
				p.image(this.fragments[fragmentIndex], cellX, cellY, cellSize, cellSize);
				// p.text(fragmentIndex, cellX, cellY);
			}
		}
	};

	draw = () => {
		const {
			p,
			params: { fade }
		} = this;
		p.background(255, 255, 255, fade ? p.constrain(100 - fade, 1, 100) : 255);

		this.updateNoiseGrid();
		this.drawCells();

		if (this.onTick) {
			this.onTick({
				currentFrame: this.currentFrame,
				isPlaying: this.isPlaying,
				isRecording: this.isRecording
			});
		}
	};
}
