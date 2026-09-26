/**
 * A sketch is a pen with its frame loop pulled out. The originals were all
 * written against a bare `requestAnimationFrame` and count time in frames, so
 * `tick()` is one original frame at 60 Hz: the runner drives it on a fixed
 * step, which keeps drift, decay and trail wash identical on 120 Hz screens.
 */
export interface Sketch {
  /** Stage size in CSS px. Called before the first frame and on every resize. */
  resize(width: number, height: number, dpr: number): void;
  /** Advance one original frame and draw it. */
  tick(): void;
  /** Redraw the current state without advancing (after a resize while paused). */
  render(): void;
  /** Back to frame zero. */
  reset(): void;
  /** A meaningful static frame for reduced motion. */
  still(): void;
  destroy?(): void;
}

export interface Runner {
  setPlaying(playing: boolean): void;
  /** Reset the sketch; shows the still frame when not playing. */
  restart(): void;
  /** Redraw now if the loop is parked (e.g. the sketch's content changed). */
  refresh(): void;
  destroy(): void;
}

export const FRAME = 1000 / 60;
const MAX_STEPS = 4;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Runs `sketch` inside `host` while it is wanted (`playing`), on screen and the
 * tab is visible. Everything it attaches is released by `destroy()`.
 */
export function runSketch(host: HTMLElement, sketch: Sketch, playing: boolean): Runner {
  let raf = 0;
  let last = 0;
  let lag = 0;
  let width = 0;
  let height = 0;
  let onScreen = false;
  let pageVisible = document.visibilityState === 'visible';
  // Whether the canvas currently shows the reduced-motion still.
  let showingStill = false;

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    lag += Math.min(now - (last || now), 250);
    last = now;

    let steps = 0;
    while (lag >= FRAME && steps < MAX_STEPS) {
      sketch.tick();
      lag -= FRAME;
      steps++;
    }
    if (steps === MAX_STEPS) lag = 0;
    if (steps) showingStill = false;
  };

  const sync = () => {
    const run = playing && onScreen && pageVisible && width > 0 && height > 0;
    if (run && !raf) {
      last = 0;
      lag = FRAME; // draw on the very first frame
      raf = requestAnimationFrame(frame);
    } else if (!run && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const redraw = () => {
    if (raf || !width || !height) return;
    if (showingStill) sketch.still();
    else sketch.render();
  };

  const measure = () => {
    const w = Math.round(host.clientWidth);
    const h = Math.round(host.clientHeight);
    if (w === width && h === height) return;
    width = w;
    height = h;
    if (!w || !h) return sync();
    sketch.resize(w, h, Math.min(window.devicePixelRatio || 1, 2));
    redraw();
    sync();
  };

  const onVisibility = () => {
    pageVisible = document.visibilityState === 'visible';
    sync();
  };

  measure();
  if (!playing) {
    sketch.still();
    showingStill = true;
  }

  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(host);

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      onScreen = entries[entries.length - 1].isIntersecting;
      sync();
    },
    { rootMargin: '120px 0px' }
  );
  intersectionObserver.observe(host);

  document.addEventListener('visibilitychange', onVisibility);

  return {
    setPlaying(next) {
      playing = next;
      sync();
    },
    restart() {
      sketch.reset();
      lag = FRAME;
      if (!playing) {
        sketch.still();
        showingStill = true;
      }
    },
    refresh: redraw,
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      sketch.destroy?.();
    }
  };
}

/** Sizes a canvas's backing store for the stage and resets its transform to CSS px. */
export function fitCanvas(canvas: HTMLCanvasElement, width: number, height: number, dpr: number) {
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas is not available');
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return context;
}
