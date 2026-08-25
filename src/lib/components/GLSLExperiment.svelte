<script lang="ts">
  import { onMount, onDestroy, untrack } from 'svelte';
  import type { ControlsData } from '$lib/types/controls';
  import setupPositionBuffer from '$lib/utils/glsl/setupPositionBuffer';
  import setUniforms from '$lib/utils/glsl/setUniforms';
  import createProgram from '$lib/utils/glsl/createProgram';

  let {
    controls,
    fragmentShader,
    width = 512,
    height = 512,
    onmount
  }: {
    controls: ControlsData;
    fragmentShader: string;
    width?: number;
    height?: number;
    onmount?: (api: { update: (newControls: ControlsData) => void; destroy: () => void }) => void;
  } = $props();

  let canvas: HTMLCanvasElement;
  let gl: WebGLRenderingContext;
  let program: WebGLProgram;
  let animationFrameId: number;
  let startTime: number;
  let u_time = 0;
  let currentControls = $state<ControlsData>(untrack(() => ({ ...controls })));

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

      onmount?.({ update, destroy });
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

    setUniforms(gl, program, { ...currentControls, u_time });

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    animationFrameId = requestAnimationFrame(render);
  }

  function update(newControls: ControlsData) {
    currentControls = { ...newControls };
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
