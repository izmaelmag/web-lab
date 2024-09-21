<script lang="ts">
  import { onMount } from 'svelte';
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

  // Define a simple vertex shader
  const vertexShader = `
    attribute vec4 a_position;
    void main() {
      gl_Position = a_position;
    }
  `;

  onMount(() => {
    try {
      // Initialize WebGL context
      gl = canvas.getContext('webgl')!;
      if (!gl) throw new Error('WebGL not supported');

      // Create and set up the WebGL program
      program = createProgram(gl, vertexShader, fragmentShader);
      if (!program) throw new Error('Failed to create WebGL program');

      // Set up the position buffer
      setupPositionBuffer(gl, program);

      // Start the render loop
      render();
    } catch (error) {
      console.error(error);
      return;
    }
  });

  // Main render function
  function render() {
    // Set the viewport
    gl.viewport(
      0,
      0,
      gl.canvas.width * window.devicePixelRatio,
      gl.canvas.height * window.devicePixelRatio
    );

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Use the program
    gl.useProgram(program);

    // Set uniform values based on controls
    setUniforms(gl, program, controls);

    // Draw the rectangle
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Request the next frame
    requestAnimationFrame(render);
  }
</script>

<canvas bind:this={canvas} width={width} height={height}></canvas>

<style>
  canvas {
    width: 100%;
    height: auto;
  }
</style>
