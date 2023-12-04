import { createWebGLProgram } from './compilation'
import type { Buffer, Format, InternalFormat, ShaderToken } from './types'

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
  autoResize?: boolean
}) => {
  const gl = config.canvas.getContext('webgl2')!

  if (!gl) throw 'webgl2 is not supported'

  /* Observe resize-events canvas */
  const resizeObserver = new ResizeObserver(() => {
    if (config.autoResize) {
      config.canvas.width = config.canvas.clientWidth
      config.canvas.height = config.canvas.clientHeight
      gl.viewport(0, 0, config.canvas.width, config.canvas.height)
      render()
    }
  })
  resizeObserver.observe(config.canvas)

  function render() {
    if (!config.canvas || !gl) return

    let extFloat = gl.getExtension('EXT_color_buffer_float')
    let extHalfFloat = gl.getExtension('EXT_color_buffer_half_float')

    // Create a framebuffer
    const framebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)

    // Create a renderbuffer for the red channel
    const redRenderbuffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, redRenderbuffer)
    gl.renderbufferStorage(
      gl.RENDERBUFFER,
      gl.R8,
      config.canvas.width,
      config.canvas.height
    )

    // Attach the red renderbuffer to the framebuffer
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.RENDERBUFFER,
      redRenderbuffer
    )

    // gl.finish()

    // Check if the framebuffer is complete
    const framebufferStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
    if (framebufferStatus !== gl.FRAMEBUFFER_COMPLETE) {
      console.error('Framebuffer is not complete')
    }

    gl.clearColor(1.0, 0.0, 0.0, 1.0) // Clear to black, fully opaque
    gl.clearDepth(1.0) // Clear everything
    gl.enable(gl.DEPTH_TEST) // Enable depth testing
    gl.depthFunc(gl.LEQUAL) // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    if (!config.programs) return

    if (Array.isArray(config.programs)) {
      config.programs.forEach((program) => {
        if (program && typeof program === 'object' && 'render' in program) {
          ;(program as any).render?.()
        }
      })
    } else {
      if (typeof config.programs === 'object' && 'render' in config.programs) {
        ;(config.programs as any).render?.()
      }
    }
  }

  function read(
    results: Buffer,
    config?: {
      width?: number
      height?: number
      internalFormat?: InternalFormat
      format?: Format
      dataType?: 'UNSIGNED_BYTE' | 'UNSIGNED_SHORT' | 'UNSIGNED_INT' | 'FLOAT'
    }
  ) {
    render()

    gl.readPixels(
      0,
      0,
      config?.width || gl.canvas.width,
      config?.height || gl.canvas.height,
      gl[config?.format || 'RGBA'],
      gl[config?.dataType || 'UNSIGNED_BYTE'],
      results
    )

    return results
  }

  return {
    render,
    read,
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
    createWebGLProgram(
      gl,
      config.vertex.source.code,
      config.fragment.source.code
    )

  if (!program) return

  if (config.cacheEnabled) setProgramCache({ ...config, program })

  const render = () => {
    if (!program || !gl) return

    gl.useProgram(program)

    onRenderQueue.forEach((fn) => fn())

    config.onRender?.(gl, program)

    gl.drawArrays(gl[config.mode], 0, config.count)
  }

  config.vertex.bind(gl, program, addToOnRenderQueue)
  config.fragment.bind(gl, program, addToOnRenderQueue)

  return {
    render,
  }
}
