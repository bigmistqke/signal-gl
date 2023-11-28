export function createProgram(
  gl: WebGLRenderingContext,
  vertex: string,
  fragment: string
) {
  const program = gl.createProgram()

  var vertexShader = createShader(gl, vertex, gl.VERTEX_SHADER)
  var fragmentShader = createShader(gl, fragment, gl.FRAGMENT_SHADER)

  if (!program || !vertexShader || !fragmentShader) return null

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)

  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('error while creating program', gl.getProgramInfoLog(program))
    return null
  }

  return program
}

function createShader(
  gl: WebGLRenderingContext,
  src: string,
  type:
    | WebGLRenderingContextBase['VERTEX_SHADER']
    | WebGLRenderingContextBase['FRAGMENT_SHADER']
) {
  const shader = gl.createShader(type)

  if (!shader) {
    console.error(`error while creating shader`)
    return null
  }

  gl.shaderSource(shader, src)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      type == gl.VERTEX_SHADER
        ? 'VERTEX'
        : 'FRAGMENT' + ` SHADER:\n ${gl.getShaderInfoLog(shader)}`
    )

    return null
  }

  return shader
}
