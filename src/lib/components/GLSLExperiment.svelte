<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import type { ControlsData } from '$lib/types/controls';
  import createShader from '$lib/utils/glsl/createShader';
  import setupPositionBuffer from '$lib/utils/glsl/setupPositionBuffer';
  import setUniforms from '$lib/utils/glsl/setUniforms';
  import createProgram from '$lib/utils/glsl/createProgram';

  export let controls: ControlsData;
  export let fragmentShader: string;
  export let width = 512;
  export let height = 512;

  let canvas: HTMLCanvasElement;
  let gl: WebGLRenderingContext;
  let program: WebGLProgram;
  let animationFrameId: number;
  let startTime: number;
  let u_time = 0;

  const dispatch = createEventDispatcher();

  const vertexShader = `
    attribute vec4 a_position;
    void main() {
      gl_Position = a_position;
    }
  `;

  onMount(() => {
    try {
      gl = canvas.getContext('webgl', { preserveDrawingBuffer: true })!;
      if (!gl) throw new Error('WebGL not supported');

      program = createProgram(gl, vertexShader, fragmentShader);
      if (!program) throw new Error('Failed to create WebGL program');

      setupPositionBuffer(gl, program);

      startTime = performance.now();
      requestAnimationFrame(render);

      dispatch('mount', { update, destroy });
    } catch (error) {
      console.error(error);
    }
  });

  function render(now: number) {
    if (!gl || !program) return;

    u_time = (now - startTime) / 1000; // Convert to seconds

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    setUniforms(gl, program, { ...controls, u_time });

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    animationFrameId = requestAnimationFrame(render);
  }

  export function update(newControls: ControlsData) {
    controls = { ...newControls };
  }

  function destroy() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    if (gl) {
      gl.deleteProgram(program);
    }
  }

  onDestroy(destroy);
</script>

<canvas bind:this={canvas} {width} {height}></canvas>

<style>
  canvas {
    width: 100%;
    height: auto;
  }
</style>
