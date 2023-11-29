import p5, { Vector } from 'p5';
import type { Sketch as P5SvelteSketch } from 'p5-svelte';

export type ParametrizedSet = Record<string, string | number | boolean>;

export type SketchSettings = {
	w: number;
	h: number;
	fps: number;
	duration: number;
};

export type SketchConstructorProps<T> = {
	params: T;
};

export class P5Sketch<T> {
	private settings: SketchSettings = {
		w: 520,
		h: 520,
		fps: 60,
		duration: 10
	};

	center: Vector;

	params: T;
	isPlaying = false;
	currentFrame = 0;

	constructor({ params }: SketchConstructorProps<T>) {
		this.params = params;
		this.center = new Vector(this.size.w / 2, this.size.h / 2);
	}

	setParams(newParams: T) {
		this.params = {
			...this.params,
			...newParams
		};
	}

	get size() {
		return {
			w: this.settings.w,
			h: this.settings.h
		};
	}

	get totalFrames() {
		return this.settings.fps * this.settings.duration;
	}

	get progress() {
		return Number((this.currentFrame / this.totalFrames).toFixed(2));
	}

	// Controls rendering frames loop
	tick = () => {
		if (this.isPlaying) {
			this.currentFrame += 1;

			if (this.currentFrame === this.totalFrames) {
				this.currentFrame = 0;
			}
		}
	};

	// Saves drawing sequence
	save: P5SvelteSketch = (p) => {
		p.noLoop();
		this.currentFrame = 0;

		setTimeout(() => {
			p.loop();
			p.saveGif('mySketch', this.totalFrames, {
				delay: 0,
				units: 'frames',
				silent: false
			});
		});
	};

	init: P5SvelteSketch = () => {
		this.isPlaying = true;
	};

	// Runs at the start of frame
	preDraw: P5SvelteSketch = () => {
		// Drawing logic
	};

	// Runs at the end of frame
	postDraw: P5SvelteSketch = () => {
		this.tick();
	};

	// Drawing loop
	draw: P5SvelteSketch = () => {
		// Drawing logic
	};

	// Re-writable settings function
	setup: P5SvelteSketch = (p) => {
		p.createCanvas(this.size.w, this.size.h);
		p.background(255);
	};

	render: P5SvelteSketch = (p) => {
		// Sketch starting operations
		this.init(p);

		// Setup sketch
		p.setup = () => {
			this.setup(p);
		};

		// Start drawing loop
		p.draw = () => {
			this.preDraw(p);
			this.draw(p);
			this.postDraw(p);
		};

		// React on pressed keys
		p.keyPressed = () => {
			// Starts gif saving loop
			if (p.key === 's') this.save(p);
		};
	};
}
