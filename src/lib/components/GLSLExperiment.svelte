<script lang="ts">
  import { onMount } from 'svelte';
  import Controls from '$lib/components/Controls/Controls.svelte';
  import type { ControlsData, ControlsConfig } from '$lib/types/controls';

  export let controls: ControlsData;
  export let controlsConfig: ControlsConfig;
  export let fragmentShader: string;

  let canvas: HTMLCanvasElement;
  let gl: WebGLRenderingContext;
  let program: WebGLProgram;

  const vertexShader = `
    attribute vec4 a_position;
    void main() {
      gl_Position = a_position;
    }
  `;

  onMount(() => {
    gl = canvas.getContext('webgl')!;
    program = createProgram(gl, vertexShader, fragmentShader);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    render();
  });

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

  function createProgram(gl: WebGLRenderingContext, vertexShaderSource: string, fragmentShaderSource: string): WebGLProgram {
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

  function render() {
    gl.viewport(0, 0, gl.canvas.width * window.devicePixelRatio, gl.canvas.height * window.devicePixelRatio);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    // Set uniform values based on controls
    Object.entries(controls).forEach(([key, value]) => {
      const location = gl.getUniformLocation(program, key);
      if (location !== null) {
        if (typeof value === 'number') {
          gl.uniform1f(location, value);
        } else if (Array.isArray(value) && value.length === 2 && value.every(v => typeof v === 'number')) {
          gl.uniform2f(location, value[0], value[1]);
        }
        // Add more type checks and uniform setters as needed
      }
    });

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
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
  .sidebar {
    width: 300px;
    padding: 20px;
  }
  .content {
    flex-grow: 1;
  }
  canvas {
    width: 100%;
    height: auto;
  }
</style>
