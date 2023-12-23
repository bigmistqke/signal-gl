/* MISC */

export const objectsAreEqual = (
  a?: Record<string, any>,
  b?: Record<string, any>
) => a && b && Object.keys(a).every((key) => b[key] === a[key])

export const castToArray = (value: any) =>
  typeof value === 'object' && Array.isArray(value) ? (value as any[]) : [value]

/* ERRORS */

export function readableError(gl: WebGL2RenderingContext) {
  const error = gl.getError()
  switch (error) {
    case gl.INVALID_ENUM:
      return 'INVALID_ENUM: An unacceptable value has been specified for an enumerated argument.'
    case gl.INVALID_VALUE:
      return 'INVALID_VALUE: A numeric argument is out of range.'
    case gl.INVALID_OPERATION:
      return 'INVALID_OPERATION: The specified operation is not allowed in the current state.'
    case gl.INVALID_FRAMEBUFFER_OPERATION:
      return 'INVALID_FRAMEBUFFER_OPERATION: The framebuffer object is not complete.'
    case gl.OUT_OF_MEMORY:
      return 'OUT_OF_MEMORY: Not enough memory is left to execute the command.'
    case gl.CONTEXT_LOST_WEBGL:
      return 'CONTEXT_LOST_WEBGL: The WebGL context is lost.'
    case gl.NO_ERROR:
      return 'NO ERROR'
    default:
      return 'Unknown WebGL Error: ' + error
  }
}

/*
  WEBGL BOILERPLATE
*/

export function createWebGLProgram(
  gl: WebGLRenderingContext,
  vertex: string,
  fragment: string
) {
  const program = gl.createProgram()

  var vertexShader = createWebGLShader(gl, vertex, 'vertex')
  var fragmentShader = createWebGLShader(gl, fragment, 'fragment')

  if (!program || !vertexShader || !fragmentShader) return null

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)

  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('error while creating program', gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }

  return program
}
function createWebGLShader(
  gl: WebGLRenderingContext,
  src: string,
  type: 'vertex' | 'fragment'
) {
  const shader = gl.createShader(
    type === 'fragment' ? gl.FRAGMENT_SHADER : gl.VERTEX_SHADER
  )

  /* cration shader failed */
  if (!shader) {
    console.error(type, `error while creating shader`)
    return null
  }

  gl.shaderSource(shader, src)
  gl.compileShader(shader)

  /* compilation shader failed */
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(type, gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }

  return shader
}
