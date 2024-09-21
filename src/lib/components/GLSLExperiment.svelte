<script lang="ts">
  import { onMount } from 'svelte';
  import type { ControlsData } from '$lib/types/controls';

  export let controls: ControlsData;
  export let fragmentShader: string;

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
    // Initialize WebGL context
    gl = canvas.getContext('webgl')!;
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Create and set up the WebGL program
    program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      console.error('Failed to create WebGL program');
      return;
    }

    // Set up the position buffer
    setupPositionBuffer(gl);

    // Start the render loop
    render();
  });

  // Create a shader of the given type
  function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null!;
    }

    return shader;
  }

  // Create a WebGL program from vertex and fragment shaders
  function createProgram(
    gl: WebGLRenderingContext,
    vertexShaderSource: string,
    fragmentShaderSource: string
  ): WebGLProgram {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
      return null!;
    }

    return program;
  }

  // Set up the position buffer for the rectangle
  function setupPositionBuffer(gl: WebGLRenderingContext) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Define the corners of a rectangle that covers the entire canvas
    const positions = [-1, -1, 1, -1, -1, 1, 1, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
  }

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

  // Set uniform values for the shader
  function setUniforms(gl: WebGLRenderingContext, program: WebGLProgram, controls: ControlsData) {
    Object.entries(controls).forEach(([key, value]) => {
      const location = gl.getUniformLocation(program, key);
      if (location !== null) {
        if (typeof value === 'number') {
          gl.uniform1f(location, value);
        } else if (
          Array.isArray(value) &&
          value.length === 2 &&
          value.every((v) => typeof v === 'number')
        ) {
          gl.uniform2f(location, value[0], value[1]);
        }
        // Add more type checks and uniform setters as needed
      }
    });
  }
</script>

<div class="glsl-experiment">
  <div class="content">
    <canvas bind:this={canvas} width={512} height={512}></canvas>
  </div>
</div>

<style>
  .glsl-experiment {
    display: flex;
  }
  .content {
    flex-grow: 1;
  }
  canvas {
    width: 100%;
    height: auto;
  }
</style>
