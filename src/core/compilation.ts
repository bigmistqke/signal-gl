import type { Token, UniformSetter } from './types'

/* COMPILATION BY SIGNAL-GL */

export const dataTypeToFunctionName = (dataType: string) => {
  switch (dataType) {
    case 'float':
      return 'uniform1f'
    case 'int':
      return 'uniform1i'
    case 'bool':
      return 'uniform1i'
    default:
      return ('uniform' +
        // 1 | 2 | 3 | 4
        dataType[dataType.length - 1] +
        // b | i | f
        (dataType[0] === 'b' || dataType[0] === 'i' ? dataType[0] : 'f') +
        // v
        'v') as UniformSetter
  }
}

const resolveToken = (token: Token) => {
  switch (token.tokenType) {
    case 'shader':
      return token.source
    case 'attribute':
      return `in ${token.dataType} ${token.name};`
    case 'uniform':
      return `uniform ${token.dataType} ${token.name};`
  }
}

export const compileStrings = (
  strings: TemplateStringsArray,
  tokens: Token[]
) => {
  const source = [
    ...strings.flatMap((string, index) => {
      const variable = tokens[index]
      if (!variable || !('name' in variable)) return string
      return [string, variable.name]
    }),
  ].join('')
  const variables = Array.from(
    new Set(tokens.flatMap((token) => resolveToken(token)))
  ).join('\n')

  const precision = source.match(/precision.*;/)?.[0]

  if (precision) {
    const [pre, after] = source.split(/precision.*;/)
    return [pre, precision, variables, after].join('\n')
  }
  const version = source.match(/#version.*/)?.[0]
  const [pre, after] = source.split(/#version.*/)
  return [version, variables, after || pre].join('\n')
}

/* COMPILATION BY WEB-GL */

export function createWebGLProgram(
  gl: WebGLRenderingContext,
  vertex: string,
  fragment: string
) {
  const program = gl.createProgram()

  var vertexShader = createWebGLShader(gl, vertex, gl.VERTEX_SHADER)
  var fragmentShader = createWebGLShader(gl, fragment, gl.FRAGMENT_SHADER)

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

function createWebGLShader(
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
