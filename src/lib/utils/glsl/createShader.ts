/**
 * Create a shader of the given type
 *
 * @param {WebGLRenderingContext} gl - The WebGL context
 * @param {number} type - The type of shader to create
 * @param {string} source - The source code of the shader
 * @returns {WebGLShader} The shader
 */
export default function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader {
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
