import { mergeProps } from 'solid-js'

import { bindBufferToken } from './bindings'
import { createWebGLProgram } from './compilation'
import { buffer, glsl } from './template'
import type {
  Buffer,
  DataType,
  Format,
  InternalFormat,
  RenderMode,
  ShaderToken,
} from './types'
import { objectsAreEqual } from './utils'

/* 
  CREATE_STACK-HOOK 
*/
type StackConfig = {
  canvas: HTMLCanvasElement
  programs: ReturnType<typeof createProgram>[]
  extensions?: {
    /** default true */
    float?: boolean
    /** default false */
    half_float?: boolean
  }
}
export type StackToken = StackConfig & {
  ctx: WebGL2RenderingContext
  render: () => StackToken
}
/**
 * Returns `ComposerToken`.
 * @param config `ComposerConfig`
 * @returns `ComposerToken`
 */
export const createStack = (config: StackConfig): StackToken => {
  const ctx = config.canvas.getContext('webgl2')!
  if (!ctx) throw 'webgl2 is not supported'

  // TODO: should these extensions be effectful?
  // default value = true
  if (config?.extensions?.float !== false) {
    ctx.getExtension('EXT_color_buffer_float')
  }
  // default value = false
  if (config?.extensions?.half_float) {
    ctx.getExtension('EXT_color_buffer_half_float')
  }

  const render = () => {
    clear(token).programs.forEach((program) => program.render())
    return token
  }

  const token = mergeProps({ ctx, render }, config)

  return token
}

/* 
  CREATE_PROGRAM-HOOK
*/

const IS_PROGRAM = Symbol('is-program')

interface CreateProgramConfigBase {
  canvas: HTMLCanvasElement
  cacheEnabled?: boolean
  first?: number
  fragment: ShaderToken
  mode: RenderMode
  offset?: number
  onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
  vertex: ShaderToken
}

interface CreateArrayProgramConfig extends CreateProgramConfigBase {
  count: number
}

interface CreateElementsProgramConfig extends CreateProgramConfigBase {
  indices: number[] | Uint16Array
}

export type CreateProgramConfig =
  | CreateArrayProgramConfig
  | CreateElementsProgramConfig

export type ProgramToken = CreateProgramConfig & {
  ctx: WebGL2RenderingContext
  program: WebGLProgram
  render: () => ProgramToken
  buffer?: WebGLBuffer
  onResize?: () => void
  [IS_PROGRAM]: true
}
/**
 * Returns `ProgramToken`. Manages `WebGLProgram` of given vertex- and fragment- `glsl` shaders.
 * @param config
 * @returns
 */
export const createProgram = (config: CreateProgramConfig): ProgramToken => {
  const ctx = config.canvas.getContext('webgl2')

  if (!ctx) throw 'webgl2 is not supported'

  /* create program */
  const cachedProgram = config.cacheEnabled && getProgramCache(config)
  const program =
    cachedProgram ||
    createWebGLProgram(
      ctx,
      config.vertex.source.code,
      config.fragment.source.code
    )
  if (!program) throw `error while building program`
  if (config.cacheEnabled) setProgramCache({ ...config, program })

  /* Map of all uniforms/attributes in this program. Gets added to during bind-stage with `addToQueue`. */
  const updateQueue: Map<WebGLUniformLocation | number, () => void> = new Map()
  const addToUpdateQueue = (
    location: WebGLUniformLocation | number,
    fn: () => void
  ) => (updateQueue.set(location, fn), () => updateQueue.delete(location))

  /* render-function */
  const render = () => {
    ctx.useProgram(program)
    /* iterate through all uniforms/attributes and update them. */
    updateQueue.forEach((update) => update())
    config.onRender?.(ctx, program)
    if ('indices' in config && config.indices) {
      ctx.drawElements(
        ctx[config.mode],
        config.indices.length,
        ctx.UNSIGNED_SHORT,
        config.offset || 0
      )
    } else if ('count' in config) {
      ctx.drawArrays(ctx[config.mode], config.first || 0, config.count)
    } else {
      console.error('neither indices nor count defined')
    }
    return token
  }

  /* BINDINGS */

  // bind all uniforms/attributes to the program and add to `updateQueue`
  config.vertex.bind({ gl: ctx, program, onRender: addToUpdateQueue, render })
  config.fragment.bind({ gl: ctx, program, onRender: addToUpdateQueue, render })
  // if indices are defined, bind them to the program
  if ('indices' in config && config.indices) {
    const a_indices = buffer(
      Array.isArray(config.indices)
        ? new Uint16Array(config.indices)
        : config.indices,
      {
        target: 'ELEMENT_ARRAY_BUFFER',
      }
    )
    bindBufferToken({
      token: a_indices,
      gl: ctx,
      onRender: addToUpdateQueue,
      effect: glsl.effect,
      render,
    })
  }

  const token: ProgramToken = {
    ...config,
    program,
    ctx,
    render,
    [IS_PROGRAM]: true,
  }
  return token
}

/* Manages program-cache of `createProgram` */
const programCache: WeakMap<
  TemplateStringsArray,
  WeakMap<TemplateStringsArray, WebGLProgram>
> = new WeakMap()
const getProgramCache = (config: {
  vertex: ShaderToken
  fragment: ShaderToken
}) => programCache.get(config.vertex.template)?.get(config.fragment.template)
const setProgramCache = ({
  vertex,
  fragment,
  program,
}: {
  vertex: ShaderToken
  fragment: ShaderToken
  program: WebGLProgram
}) => {
  if (!programCache.get(vertex.template)) {
    programCache.set(vertex.template, new WeakMap())
  }
  if (!programCache.get(vertex.template)!.get(fragment.template)) {
    programCache.get(vertex.template)!.set(fragment.template, program)
  }
}

/** Checks if a given value is a `ProgramToken` */
export const isProgramToken = (value: any): value is ProgramToken =>
  typeof value === 'object' && IS_PROGRAM in value

/** Filters `any` for `ProgramTokens`. Returns `ProgramToken[]` */
export const filterProgramTokens = (value: any) =>
  (typeof value === 'object' && Array.isArray(value)
    ? (value as any[])
    : [value]
  ).filter(isProgramToken)

/* 
  UTILITY-FUNCTIONS FOR GL_TOKEN AND PROGRAM_TOKEN
*/

/**
 * Utility-function to automatically update `GLToken['canvas'] | ProgramToken['canvas']` width/height on resize.
 * @param gl
 * @returns void
 */
export const autosize = <T extends StackToken | ProgramToken>(
  token: T,
  onResize?: (token: T) => void
) => {
  /* Observe resize-events canvas */
  const resizeObserver = new ResizeObserver(() => {
    token.canvas.width = token.canvas.clientWidth
    token.canvas.height = token.canvas.clientHeight
    token.ctx.viewport(0, 0, token.canvas.width, token.canvas.height)
    token.render()
    onResize?.(token)
  })
  resizeObserver.observe(token.canvas)
  return token
}

/**
 * Utility-function to clear canvas with sensible defaults.
 * @param `GLToken | ProgramToken`
 * @returns void
 */
export const clear = <T extends StackToken | ProgramToken>(token: T) => {
  token.ctx.clearColor(0.0, 0.0, 0.0, 1.0)
  token.ctx.clearDepth(1.0)
  token.ctx.enable(token.ctx.DEPTH_TEST)
  token.ctx.depthFunc(token.ctx.LEQUAL)
  token.ctx.clear(token.ctx.COLOR_BUFFER_BIT | token.ctx.DEPTH_BUFFER_BIT)
  token.ctx.depthRange(0.2, 10)
  return token
}

type RenderBufferConfig = {
  internalFormat: InternalFormat
  width: number
  height: number
}
/**
 * Utility-function to set renderBuffer of a `GLToken['context'] | ProgramToken['context']`.
 * @param gl
 * @param {RenderBufferConfig} config
 * @returns `typeof config.output`
 */
export const renderBuffer = (
  token: StackToken | ProgramToken,
  { internalFormat, width, height }: RenderBufferConfig
) => {
  const framebuffer = token.ctx.createFramebuffer()
  token.ctx.bindFramebuffer(token.ctx.FRAMEBUFFER, framebuffer)

  /* Create a renderbuffer */
  const renderBuffer = token.ctx.createRenderbuffer()
  token.ctx.bindRenderbuffer(token.ctx.RENDERBUFFER, renderBuffer)
  token.ctx.renderbufferStorage(
    token.ctx.RENDERBUFFER,
    token.ctx[internalFormat],
    width,
    height
  )

  /* Attach the renderbuffer to the framebuffer */
  token.ctx.framebufferRenderbuffer(
    token.ctx.FRAMEBUFFER,
    token.ctx.COLOR_ATTACHMENT0,
    token.ctx.RENDERBUFFER,
    renderBuffer
  )

  token.ctx.finish()

  return token
}

const readCache = new WeakMap<WebGL2RenderingContext, Record<string, any>>()
export type ReadConfig = {
  width?: number
  height?: number
  internalFormat?: InternalFormat
  format?: Format
  dataType?: DataType
  output: Buffer
}
/**
 * Utility-function to read the pixel-data of a `GLToken['context']`.
 * @param token
 * @param {ReadConfig} config
 * @returns `typeof config.output`
 */
export const read = (token: StackToken | ProgramToken, config?: ReadConfig) => {
  const mergedConfig = mergeProps(
    {
      format: 'RGBA',
      dataType: 'UNSIGNED_BYTE',
      internalFormat: 'RGBA8',
      width: token.canvas.width,
      height: token.canvas.height,
    } as const,
    config
  )

  if (
    !readCache.get(token.ctx) ||
    !objectsAreEqual(mergedConfig, readCache.get(token.ctx))
  ) {
    readCache.set(token.ctx, mergedConfig)
    renderBuffer(token, mergedConfig)
  }

  clear(token)
    .render()
    .ctx.readPixels(
      0,
      0,
      mergedConfig.width,
      mergedConfig.height,
      token.ctx[mergedConfig.format],
      token.ctx[mergedConfig.dataType],
      mergedConfig.output
    )

  return mergedConfig.output
}

export const createBuffer = (config: { canvas: HTMLCanvasElement }) => {
  const context = config.canvas.getContext('webgl2')
  return context?.createBuffer()
}
