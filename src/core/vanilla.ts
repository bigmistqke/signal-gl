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
  extensions?: {
    /** default true */
    float?: boolean
    /** default false */
    half_float?: boolean
  }
}

export const createGL = (config: GLConfig) => {
  const ctx = config.canvas.getContext('webgl2')!

  if (!ctx) throw 'webgl2 is not supported'

  const gl = {
    canvas: config.canvas,
    config,
    ctx,
    cache: {
      previousReadConfig: {} as GLReadConfig,
    },
  }

  // default value = true
  if (config?.extensions?.float !== false) {
    ctx.getExtension('EXT_color_buffer_float')
  }
  // default value = false
  if (config?.extensions?.half_float) {
    ctx.getExtension('EXT_color_buffer_half_float')
  }

  return gl
}

export const autosize = (gl: ReturnType<typeof createGL>) => {
  /* Observe resize-events canvas */
  const resizeObserver = new ResizeObserver(() => {
    gl.config.canvas.width = gl.config.canvas.clientWidth
    gl.config.canvas.height = gl.config.canvas.clientHeight
    gl.ctx.viewport(0, 0, gl.config.canvas.width, gl.config.canvas.height)
    render(gl)
  })
  resizeObserver.observe(gl.config.canvas)
}

/**
 * utility-function to render the `GLConfig['programs']` of a `ReturnType<typeof createGL>`
 * @param gl
 * @returns void
 */
export const render = ({ ctx, config }: ReturnType<typeof createGL>) => {
  ctx.clearColor(0.0, 0.0, 0.0, 1.0)
  ctx.clearDepth(1.0)
  ctx.enable(ctx.DEPTH_TEST)
  ctx.depthFunc(ctx.LEQUAL)
  ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT)

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

type GLRenderBufferConfig = {
  internalFormat: InternalFormat
  width: number
  height: number
}
/**
 * utility-function to set renderBuffer of a `ReturnType<typeof createGL>['context']`
 * @param gl
 * @param {GLRenderBufferConfig} config
 * @returns `typeof config.output`
 */
export const renderBuffer = (
  { ctx }: ReturnType<typeof createGL>,
  { internalFormat, width, height }: GLRenderBufferConfig
) => {
  const framebuffer = ctx.createFramebuffer()
  ctx.bindFramebuffer(ctx.FRAMEBUFFER, framebuffer)

  /* Create a renderbuffer */
  const renderBuffer = ctx.createRenderbuffer()
  ctx.bindRenderbuffer(ctx.RENDERBUFFER, renderBuffer)
  ctx.renderbufferStorage(ctx.RENDERBUFFER, ctx[internalFormat], width, height)

  /* Attach the renderbuffer to the framebuffer */
  ctx.framebufferRenderbuffer(
    ctx.FRAMEBUFFER,
    ctx.COLOR_ATTACHMENT0,
    ctx.RENDERBUFFER,
    renderBuffer
  )

  ctx.finish()
}

type GLReadConfig = {
  width?: number
  height?: number
  internalFormat?: InternalFormat
  format?: Format
  dataType?: DataType
  output: Buffer
}

/**
 * utility-function to read the pixel-data of a `ReturnType<typeof createGL>['context']`
 * @param gl
 * @param {GLReadConfig} config
 * @returns `typeof config.output`
 */
export const read = (
  gl: ReturnType<typeof createGL>,
  config?: GLReadConfig
) => {
  const mergedConfig = mergeProps(
    {
      format: 'RGBA',
      dataType: 'UNSIGNED_BYTE',
      internalFormat: 'RGBA8',
      width: gl.canvas.width,
      height: gl.canvas.height,
    } as const,
    config
  )

  if (!objectsAreEqual(mergedConfig, gl.cache.previousReadConfig)) {
    gl.cache.previousReadConfig = mergedConfig!
    renderBuffer(gl, mergedConfig)
  }

  render(gl)

  gl.ctx.readPixels(
    0,
    0,
    mergedConfig.width,
    mergedConfig.height,
    gl.ctx[mergedConfig.format],
    gl.ctx[mergedConfig.dataType],
    mergedConfig.output
  )

  return mergedConfig.output
}

type CreateProgramConfig = {
  canvas: HTMLCanvasElement
  cacheEnabled?: boolean
  count: number
  first?: number
  fragment: ShaderToken
  mode: 'TRIANGLES' | 'LINES' | 'POINTS'
  vertex: ShaderToken
  onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
}

export const createProgram = (config: CreateProgramConfig) => {
  const gl = config.canvas.getContext('webgl2')
  if (!gl) return

  /* create program */
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

  /* bind vertex and fragment */
  const queue: Map<WebGLUniformLocation | number, () => void> = new Map()
  const addToQueue = (
    location: WebGLUniformLocation | number,
    fn: () => void
  ) => (queue.set(location, fn), () => queue.delete(location))

  const render = () => {
    if (!program || !gl) return
    gl.useProgram(program)
    queue.forEach((fn) => fn())
    config.onRender?.(gl, program)
    gl.drawArrays(gl[config.mode], config.first || 0, config.count)
  }

  config.vertex.bind(gl, program, addToQueue, render)
  config.fragment.bind(gl, program, addToQueue, render)

  return {
    config,
    program,
    render,
  }
}
