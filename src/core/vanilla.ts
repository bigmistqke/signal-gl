import { mergeProps } from 'solid-js'
import { createWebGLProgram } from './compilation'
import type {
  Buffer,
  DataType,
  Format,
  InternalFormat,
  ShaderToken,
} from './types'
import { objectsAreEqual } from './utils'

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

/** */
type GLConfig = {
  canvas: HTMLCanvasElement
  programs: ReturnType<typeof createProgram>[]
  autoResize?: boolean
  extensions?: {
    /** default true */
    float?: boolean
    /** default false */
    half_float?: boolean
  }
}

type GLReadConfig = {
  width?: number
  height?: number
  internalFormat?: InternalFormat
  format?: Format
  dataType?: DataType
}

export const createGL = (config: GLConfig) => {
  const gl = config.canvas.getContext('webgl2')!

  const extensions = {
    float: false,
    half_float: false,
  }

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

    gl.clearColor(1.0, 0.0, 0.0, 1.0)
    gl.clearDepth(1.0)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
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

  // default value = true
  if (config?.extensions?.float !== false) {
    gl.getExtension('EXT_color_buffer_float')
  }
  // default value = false
  if (config?.extensions?.half_float) {
    gl.getExtension('EXT_color_buffer_half_float')
  }

  const updateFrameBuffer = ({
    internalFormat,
    width,
    height,
  }: Required<GLReadConfig>) => {
    const framebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)

    // Create a renderbuffer
    const renderBuffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl[internalFormat], width, height)

    // Attach the renderbuffer to the framebuffer
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.RENDERBUFFER,
      renderBuffer
    )

    gl.finish()
  }

  let previousReadConfig: GLReadConfig = {}
  function read(results: Buffer, _config?: GLReadConfig) {
    const config = mergeProps(
      {
        format: 'RGBA',
        dataType: 'UNSIGNED_BYTE',
        internalFormat: 'RGBA8',
        width: gl.canvas.width,
        height: gl.canvas.height,
      } as const,
      _config
    )

    if (!objectsAreEqual(config, previousReadConfig)) {
      previousReadConfig = config!
      updateFrameBuffer(config)
    }

    render()

    gl.readPixels(
      0,
      0,
      config.width,
      config.height,
      gl[config.format],
      gl[config.dataType],
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
