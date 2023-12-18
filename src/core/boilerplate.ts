/* 
  COMPILATION BY WEB-GL 
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
