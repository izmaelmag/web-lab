// Define the corners of a rectangle that covers the entire canvas
// Format: [x1, y1, x2, y2, x3, y3, x4, y4]
const defaultRectanglePositions = [
  // Bottom-left corner
  -1, -1,
  // Bottom-right corner
  1, -1,
  // Top-left corner
  -1, 1,
  // Top-right corner
  1, 1
];

/**
 * Configuration options for setting up a position buffer.
 */
interface PositionBufferOptions {
  /** The attribute name in the shader program. Default is 'a_position'. */
  attributeName?: string;
  /** The number of components per vertex attribute. Default is 2. */
  numComponents?: number;
  /** The data type of each component. Default is gl.FLOAT. */
  type?: number;
  /** Whether the data should be normalized. Default is false. */
  normalize?: boolean;
  /** The stride of the vertex attributes. Default is 0. */
  stride?: number;
  /** The offset in bytes of the first component in the vertex attribute array. Default is 0. */
  offset?: number;
  /** Custom positions for the buffer. Default is a full-screen quad. */
  positions?: number[];
}

/**
 * Sets up a position buffer for a quad in WebGL.
 *
 * @param {WebGLRenderingContext} gl - The WebGL rendering context.
 * @param {WebGLProgram} program - The compiled and linked WebGL program.
 * @param {PositionBufferOptions} [options] - Optional configuration for the buffer setup.
 * @returns {WebGLBuffer | null} The created position buffer.
 * @throws {Error} If buffer creation fails.
 */
export default function setupPositionBuffer(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  options: PositionBufferOptions = {}
): WebGLBuffer | null {
  const {
    attributeName = 'a_position',
    numComponents = 2,
    type = gl.FLOAT,
    normalize = false,
    stride = 0,
    offset = 0,
    positions = defaultRectanglePositions
  } = options;

  // Create and bind the buffer
  const positionBuffer = gl.createBuffer();
  if (!positionBuffer) {
    throw new Error('Failed to create position buffer');
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Fill the buffer with the position data
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Get the attribute location
  const positionAttributeLocation = gl.getAttribLocation(program, attributeName);

  if (positionAttributeLocation === -1) {
    console.warn(`Warning: '${attributeName}' attribute not found in the shader program`);
  }

  // Enable the attribute and specify how to read it
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, numComponents, type, normalize, stride, offset);

  return positionBuffer;
}
