import type { ShaderToken, Token, UniformSetter } from './types'

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
        dataType[dataType.length - 1] +
        (dataType[0] === 'b' ? 'b' : dataType[0] === 'i' ? 'i' : 'f') +
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
  variables: Token[]
) => {
  const source = [
    ...strings.flatMap((string, index) => {
      const variable = variables[index]
      if (!variable) return string
      return 'name' in variable ? [string, variable.name] : string
    }),
  ].join('')

  const precision = source.match(/precision.*;/)?.[0]
  if (precision) {
    const [pre, after] = source.split(/precision.*;/)
    return [
      pre,
      precision,
      variables.flatMap((variable) => resolveToken(variable)).join('\n'),
      after,
    ].join('\n')
  }
  const version = source.match(/#version.*/)?.[0]
  const [pre, after] = source.split(/#version.*/)
  return [
    version,
    variables.flatMap((variable) => resolveToken(variable)).join('\n'),
    after || pre,
  ].join('\n')
}

/* PROGRAM-CACHE */

const programCache: WeakMap<
  TemplateStringsArray,
  WeakMap<TemplateStringsArray, WebGLProgram>
> = new WeakMap()

const getProgramCache = (config: {
  vertex: ShaderToken
  fragment: ShaderToken
}) => programCache.get(config.vertex.template)?.get(config.fragment.template)

const setProgramCache = (config: {
  vertex: ShaderToken
  fragment: ShaderToken
  program: WebGLProgram
}) => {
  if (!programCache.get(config.vertex.template)) {
    programCache.set(config.vertex.template, new WeakMap())
  }
  if (
    !programCache.get(config.vertex.template)!.get(config.fragment.template)
  ) {
    programCache
      .get(config.vertex.template)!
      .set(config.fragment.template, config.program)
  }
}

/*  */

export const createGL = (config: {
  canvas: HTMLCanvasElement
  programs: ReturnType<typeof createProgram>[]
}) => {
  const gl = config.canvas.getContext('webgl2')

  if (!gl) {
    console.error('webgl2 is not supported')
    return
  }

  /* Observe resize-events canvas */
  const resizeObserver = new ResizeObserver(() => {
    config.canvas.width = config.canvas.clientWidth
    config.canvas.height = config.canvas.clientHeight
    gl.viewport(0, 0, config.canvas.width, config.canvas.height)
  })
  resizeObserver.observe(config.canvas)

  function render() {
    const gl = config.canvas?.getContext('webgl2')
    if (!config.canvas || !gl) return

    gl.clearColor(0.0, 0.0, 0.0, 1.0) // Clear to black, fully opaque
    gl.clearDepth(1.0) // Clear everything
    gl.enable(gl.DEPTH_TEST) // Enable depth testing
    gl.depthFunc(gl.LEQUAL) // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    if (!config.programs) return

    if (Array.isArray(config.programs)) {
      config.programs.forEach((child) => {
        if (child && typeof child === 'object' && 'render' in child) {
          ;(child as any).render?.()
        }
      })
    } else {
      if (typeof config.programs === 'object' && 'render' in config.programs) {
        ;(config.programs as any).render?.()
      }
    }
  }

  return {
    render,
  }
}

export const createProgram = (config: {
  gl: WebGL2RenderingContext
  vertex: ShaderToken
  fragment: ShaderToken
  onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
  mode: 'TRIANGLES' | 'LINES' | 'POINTS'
  cacheEnabled: boolean
}) => {
  const onRenderQueue: (() => void)[] = []
  const addToOnRenderQueue = (fn: () => void) => {
    onRenderQueue.push(fn)
    return () => onRenderQueue.splice(onRenderQueue.indexOf(fn), 1)
  }

  const cachedProgram = config.cacheEnabled && getProgramCache(config)

  const program =
    cachedProgram ||
    createWebGLProgram(config.gl, config.vertex.source, config.fragment.source)

  if (!program) return

  if (config.cacheEnabled) setProgramCache({ ...config, program })

  config.vertex.bind(config.gl, program, addToOnRenderQueue)
  config.fragment.bind(config.gl, program, addToOnRenderQueue)

  return {
    render: () => {
      if (!program || !config.gl) return

      config.gl.useProgram(program)
      onRenderQueue.forEach((fn) => fn())

      config.onRender?.(config.gl, program)

      config.gl.drawArrays(config.gl[config.mode], 0, 6)
    },
  }
}

/* COMPILATION BY WEB-GL */

function createWebGLProgram(
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
