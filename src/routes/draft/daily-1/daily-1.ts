import { P5Sketch, type SketchConstructorProps } from '$lib/modules/sketch/P5Sketch';
import type { ControlsData } from '$lib/types/controls';
import type { Sketch } from 'p5-svelte';
import type { NoiseFunction4D } from 'simplex-noise';
import { createNoise4D } from 'simplex-noise';

/**
 * Parameters for the Daily1 sketch.
 */
export type Params = {
  amplitude: number;
  debug: boolean;
  radius: number;
  wobble: number;
  shadeIntense: number;
};

/**
 * Default parameters and control data.
 */
export const defaultParams: Params & ControlsData = {
  amplitude: 10,
  debug: false,
  radius: 100,
  wobble: 1,
  shadeIntense: 1
};

/**
 * Tick function type for update callbacks.
 */
type TickFunction = (state: {
  currentFrame: number;
  isPlaying: boolean;
  isRecording: boolean;
}) => void;

/**
 * Daily1 sketch extending the P5Sketch base class.
 */
export class Daily1 extends P5Sketch<Params> {
  params: Params;
  isPlaying = true;
  onTick: TickFunction;
  noise4d: NoiseFunction4D;
  img: typeof Image;

  private readonly precision = 360;
  private circleNoises: number[] = new Array(this.precision).fill(0);

  /**
   * Constructs a new Daily1 sketch instance.
   * @param props - Constructor properties including parameters and tick function.
   */
  constructor(
    props: SketchConstructorProps<Params> & {
      onTick: TickFunction;
    }
  ) {
    super(props);
    this.onTick = props.onTick;
    this.params = props.params || defaultParams;
    this.settings = props.settings;
    this.noise4d = createNoise4D();
  }

  /**
   * Sets up the P5 sketch environment.
   * @param p - P5 instance.
   */
  setup: Sketch = (p) => {
    p.createCanvas(this.size.w, this.size.h);
    p.background(0);
    p.frameRate(60);
  };

  /**
   * Updates the noise values for circle points using utility functions.
   * @param offset - Noise offset for variation.
   */
  private updatePointsNoise(offset = 0): void {
    const { p, center, params } = this;
    const noiseLoopX = calculateNoiseLoopX(this.mainAngle);
    const noiseLoopY = calculateNoiseLoopY(this.mainAngle);

    for (let n = 0; n < this.precision; n++) {
      const pointAngle = calculatePointAngle(p, n, this.precision);
      this.circleNoises[n] = this.noise4d(
        offset + center.x + calculateCos(pointAngle) * params.wobble,
        offset + center.y + calculateSin(pointAngle) * params.wobble,
        noiseLoopX,
        noiseLoopY
      );
    }
  }

  /**
   * Draws animated circles based on noise values.
   */
  private drawCircles(): void {
    const { p, center, params } = this;
    this.updatePointsNoise();

    // Draw first shape with shaded intensity
    p.beginShape();
    this.circleNoises.forEach((noiseValue, i) => {
      const angle = calculateAngle(p, i, this.circleNoises.length);
      const radius = calculateRadius(params, noiseValue, true);
      const xOffset = calculateCos(this.mainAngle) * 10;
      const yOffset = calculateSin(this.mainAngle) * 10;

      p.vertex(
        center.x + radius * calculateCos(angle) + xOffset,
        center.y + radius * calculateSin(angle) + yOffset
      );
    });
    p.stroke(255);
    p.fill(255);
    p.endShape(p.CLOSE);

    // Draw second shape with increased noise offset
    this.updatePointsNoise(200);
    p.beginShape();
    this.circleNoises.forEach((noiseValue, i) => {
      const angle = calculateAngle(p, i, this.circleNoises.length);
      const radius = calculateRadius(params, noiseValue, false);

      p.vertex(center.x + radius * calculateCos(angle), center.y + radius * calculateSin(angle));
    });
    p.stroke(255);
    p.strokeWeight(2);
    p.fill(0);
    p.endShape(p.CLOSE);
  }

  /**
   * Calculates the main angle based on progress.
   */
  private get mainAngle(): number {
    return this.progress * Math.PI * 2 - Math.PI / 2;
  }

  /**
   * Main draw loop for the sketch.
   */
  draw = (): void => {
    const { p } = this;

    p.background(0, 0, 0, 30);
    this.drawCircles();
    p.stroke(120);

    if (this.onTick) {
      this.onTick({
        currentFrame: this.currentFrame,
        isPlaying: this.isPlaying,
        isRecording: this.isRecording
      });
    }
  };
}

/**
 * Utility function to calculate noise loop X based on angle.
 * @param angle - The main angle.
 * @returns The calculated noise loop X value.
 */
function calculateNoiseLoopX(angle: number): number {
  return Math.cos(angle);
}

/**
 * Utility function to calculate noise loop Y based on angle.
 * @param angle - The main angle.
 * @returns The calculated noise loop Y value.
 */
function calculateNoiseLoopY(angle: number): number {
  return Math.sin(angle);
}

/**
 * Utility function to calculate the point angle.
 * @param p - P5 instance.
 * @param n - Current index.
 * @param precision - Total number of points.
 * @returns The calculated point angle.
 */
function calculatePointAngle(p: any, n: number, precision: number): number {
  return p.HALF_PI + (n * p.TWO_PI) / precision;
}

/**
 * Utility function to calculate sine of an angle.
 * @param angle - The angle in radians.
 * @returns The sine of the angle.
 */
function calculateSin(angle: number): number {
  return Math.sin(angle);
}

/**
 * Utility function to calculate cosine of an angle.
 * @param angle - The angle in radians.
 * @returns The cosine of the angle.
 */
function calculateCos(angle: number): number {
  return Math.cos(angle);
}

/**
 * Utility function to calculate angle for vertex placement.
 * @param p - P5 instance.
 * @param index - Current index.
 * @param total - Total number of points.
 * @returns The calculated angle.
 */
function calculateAngle(p: any, index: number, total: number): number {
  return (p.TWO_PI * index) / total;
}

/**
 * Utility function to calculate radius based on parameters and noise.
 * @param params - Sketch parameters.
 * @param noiseValue - Noise value for the current point.
 * @param isShaded - Flag indicating if shaded intensity should be applied.
 * @returns The calculated radius.
 */
function calculateRadius(params: Params, noiseValue: number, isShaded: boolean): number {
  return isShaded
    ? params.radius + noiseValue * params.amplitude * params.shadeIntense
    : params.radius + noiseValue * params.amplitude;
}
