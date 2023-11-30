import { createWebGLProgram } from './compilation'
import { ShaderToken } from './types'

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

/* HOOKS */

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
    render()
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
  canvas: HTMLCanvasElement
  vertex: ShaderToken
  fragment: ShaderToken
  onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
  mode: 'TRIANGLES' | 'LINES' | 'POINTS'
  cacheEnabled?: boolean
  count: number
}) => {
  const gl = config.canvas.getContext('webgl2')

  if (!gl) return

  const onRenderQueue: Map<WebGLUniformLocation | number, () => void> =
    new Map()
  const addToOnRenderQueue = (
    location: WebGLUniformLocation | number,
    fn: () => void
  ) => {
    onRenderQueue.set(location, fn)
    return () => onRenderQueue.delete(location)
  }

  const cachedProgram = config.cacheEnabled && getProgramCache(config)

  const program =
    cachedProgram ||
    createWebGLProgram(gl, config.vertex.source, config.fragment.source)

  if (!program) return

  if (config.cacheEnabled) setProgramCache({ ...config, program })

  config.vertex.bind(gl, program, addToOnRenderQueue)
  config.fragment.bind(gl, program, addToOnRenderQueue)

  return {
    render: () => {
      if (!program || !gl) return

      gl.useProgram(program)
      onRenderQueue.forEach((fn) => fn())

      config.onRender?.(gl, program)

      gl.drawArrays(gl[config.mode], 0, config.count)
    },
  }
}
