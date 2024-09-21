import type { ControlsData } from '$lib/types/controls';

/**
 * Set uniform values for a WebGL shader program
 * @param {WebGLRenderingContext} gl - The WebGL rendering context
 * @param {WebGLProgram} program - The WebGL program
 * @param {ControlsData} controls - Object containing uniform values
 */
export default function setUniforms(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  controls: ControlsData
): void {
  Object.entries(controls).forEach(([key, value]) => {
    const location = gl.getUniformLocation(program, key);
    if (location !== null) {
      setUniform(gl, location, value);
    }
  });
}

/**
 * Set a single uniform value based on its type
 * @param {WebGLRenderingContext} gl - The WebGL rendering context
 * @param {WebGLUniformLocation} location - The uniform location
 * @param {any} value - The value to set
 */
function setUniform(gl: WebGLRenderingContext, location: WebGLUniformLocation, value: any): void {
  switch (true) {
    case typeof value === 'number':
      gl.uniform1f(location, value);
      break;

    case Array.isArray(value):
      switch (value.length) {
        case 2:
          gl.uniform2fv(location, value);
          break;
        case 3:
          gl.uniform3fv(location, value);
          break;
        case 4:
          gl.uniform4fv(location, value);
          break;
        default:
          console.warn(`Unsupported uniform array length: ${value.length}`);
      }
      break;

    case value instanceof Float32Array:
      gl.uniformMatrix4fv(location, false, value);
      break;

    default:
      console.warn(`Unsupported uniform type for value: ${value}`);
  }
}
