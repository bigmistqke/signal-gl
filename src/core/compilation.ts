import type { Token } from './types'

/* COMPILATION BY SIGNAL-GL */

const tokenToString = (token: Token) => {
  switch (token.tokenType) {
    case 'shader':
      return token.source.parts.variables
    case 'attribute':
      return `in ${token.dataType} ${token.name};`
    case 'uniform':
    case 'sampler2D':
      return `uniform ${token.dataType} ${token.name};`
    case 'isampler2D':
      return `uniform highp ${token.dataType} ${token.name};`
  }
}

export const compileStrings = (
  strings: TemplateStringsArray,
  tokens: Token[]
) => {
  const code = [
    ...strings.flatMap((string, index) => {
      const variable = tokens[index]
      if (variable) {
        if (variable.tokenType === 'shader')
          return [string, variable.source.parts.body]
      }
      if (!variable || !('name' in variable)) return string
      return [string, variable.name]
    }),
  ].join('')
  const variables = Array.from(new Set(tokens.flatMap(tokenToString))).join(
    '\n'
  )

  const precision = code.match(/precision.*;/)?.[0]
  if (precision) {
    const [version, body] = code.split(/precision.*;/)
    return {
      code: [version, precision, variables, body].join('\n'),
      parts: {
        version,
        precision,
        variables,
        body,
      },
    }
  }
  const version = code.match(/#version.*/)?.[0]
  const [pre, after] = code.split(/#version.*/)
  const body = after || pre
  return {
    code: [version, variables, body].join('\n'),
    parts: {
      version,
      variables,
      body,
    },
  }
}

/* COMPILATION BY WEB-GL */

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
