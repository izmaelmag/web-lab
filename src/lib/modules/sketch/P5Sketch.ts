import type { Point } from '$lib/types/math';
import type { Sketch as P5SvelteSketch, p5 } from 'p5-svelte';

export type ParametrizedSet = Record<string, string | number | boolean>;

export type SketchSettings = {
  w: number;
  h: number;
  fps: number;
  duration: number;
};

export type SketchConstructorProps<T> = {
  params: T;
  settings: SketchSettings;
};

export class P5Sketch<T> {
  settings: SketchSettings = {
    w: 520,
    h: 520,
    fps: 60,
    duration: 10
  };

  p: p5;
  center: Point;
  params: T;
  isPlaying = false;
  currentFrame = 0;
  isRecording = false;

  constructor({ params, settings }: SketchConstructorProps<T>) {
    this.params = params;
    this.settings = settings;
    this.center = {
      x: this.size.w / 2,
      y: this.size.h / 2
    };
  }

  setParams(newParams: T) {
    this.params = {
      ...this.params,
      ...newParams
    };
  }

  setProgress(newProgress: number) {
    const newFrame = Math.round(this.totalFrames * newProgress);
    this.currentFrame = newFrame;
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
    return this.currentFrame / this.totalFrames;
  }

  play = () => {
    this.isPlaying = true;
  };

  pause = () => {
    this.isPlaying = false;
  };

  reset = () => {
    this.isPlaying = false;
    this.currentFrame = 0;
  };

  record = () => {
    this.save();
  };

  setFrame = (frame: number) => {
    this.isPlaying = false;
    this.currentFrame = frame;
    this.draw();
  };

  // Controls rendering frames loop
  tick = () => {
    if (this.isPlaying) {
      this.currentFrame += 1;

      if (this.currentFrame >= this.totalFrames) {
        this.currentFrame = 0;
        this.onLoop();
      }
    }
  };

  onLoop = () => {
    // Runs after full loop
  };

  // Saves drawing sequence
  save = () => {
    this.p.noLoop();
    this.currentFrame = 0;
    this.isRecording = true;
    this.isPlaying = true;

    setTimeout(() => {
      this.p.loop();
      this.p.saveGif('Daily_2', this.totalFrames - 1, {
        delay: 0,
        units: 'frames',
        silent: false
      });
    }, 0);
  };

  init: P5SvelteSketch = (p) => {
    this.p = p;
  };

  // Runs at the start of frame
  preDraw = () => {
    // Drawing logic
  };

  // Runs at the end of frame
  postDraw = () => {
    this.tick();
  };

  // Drawing loop
  draw = () => {
    // Drawing logic
  };

  // Re-writable settings function
  setup: P5SvelteSketch = (p) => {
    p.createCanvas(this.size.w, this.size.h);
    p.background(255);
  };

  preload = () => {
    // Preload content
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
      this.preDraw();
      this.draw();
      this.postDraw();
    };

    // React on pressed keys
    p.keyPressed = () => {
      // Starts gif saving loop
      if (p.key === 's') this.save();
    };
  };
}
