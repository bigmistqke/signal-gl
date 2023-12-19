import { createSignal, mergeProps } from 'solid-js'
import { bindBufferToken } from './template/bindings'
import { glsl } from './template/glsl'
import { buffer } from './template/tokens'
import {
  BufferArray,
  DataType,
  Format,
  InternalFormat,
  RenderMode,
  ShaderToken,
  TextureOptions,
} from './types'
import { castToArray, createWebGLProgram } from './utils'

type BaseConfig = {
  canvas: HTMLCanvasElement | OffscreenCanvas
  cacheEnabled?: boolean
  first?: number
  /** default TRIANGLES */
  mode?: RenderMode
  offset?: number
  onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
}

class Base {
  gl: WebGL2RenderingContext
  canvas: HTMLCanvasElement | OffscreenCanvas
  constructor(config: BaseConfig) {
    this.canvas = config.canvas
    const gl = config.canvas.getContext('webgl2')
    if (!gl) throw 'can not get webgl2 context'
    this.gl = gl
  }
  render() {
    return this
  }
  clear() {
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0)
    this.gl.clearDepth(1.0)
    this.gl.enable(this.gl.DEPTH_TEST)
    this.gl.depthFunc(this.gl.LEQUAL)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
    this.gl.depthRange(0.2, 10)
    return this
  }
  autosize(onResize?: (token: Base) => void) {
    if (this.canvas instanceof OffscreenCanvas) {
      throw 'can not autosize OffscreenCanvas'
    }
    /* Observe resize-events canvas */
    const resizeObserver = new ResizeObserver(() => {
      if (this.canvas instanceof OffscreenCanvas) {
        throw 'can not autosize OffscreenCanvas'
      }
      this.canvas.width = this.canvas.clientWidth
      this.canvas.height = this.canvas.clientHeight
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
      this.render()
      onResize?.(this)
    })
    resizeObserver.observe(this.canvas)
    return this
  }
  read(output: BufferArray, config: Partial<TextureOptions>) {
    const _config = {
      format: 'RGBA',
      dataType: 'UNSIGNED_BYTE',
      internalFormat: 'RGBA8',
      width: this.gl.canvas.width,
      height: this.gl.canvas.height,
      ...config,
    } as const
    this.render().gl.readPixels(
      0,
      0,
      _config.width,
      _config.height,
      this.gl[_config.format],
      this.gl[_config.dataType],
      output
    )
    return output
  }
}

type BaseProgramConfig = BaseConfig & {
  fragment: ShaderToken
  vertex: ShaderToken
}

export type GLProgramConfig =
  | ({ count: number } & BaseProgramConfig)
  | ({ indices: number[] | Uint16Array } & BaseProgramConfig)
export type ProgramInstance = typeof GLProgram
export class GLProgram extends Base {
  config: GLProgramConfig
  program: WebGLProgram
  constructor(_config: GLProgramConfig) {
    super(_config)
    const config = mergeProps(
      {
        mode: 'TRIANGLES' as const,
        cacheEnabled: false,
        first: 0,
        offset: 0,
      },
      _config
    )
    this.config = config

    if (!this.gl) throw 'webgl2 is not supported'

    /* create program */
    const cachedProgram = config.cacheEnabled && getProgramCache(config)
    const program =
      cachedProgram ||
      createWebGLProgram(
        this.gl,
        config.vertex.source.code,
        config.fragment.source.code
      )
    if (!program) throw `error while building program`

    this.program = program

    if (config.cacheEnabled)
      setProgramCache({ ...config, program: this.program })

    /* BINDINGS */
    // bind all uniforms/attributes to the program and add to `updateQueue`
    config.vertex.bind(this)
    config.fragment.bind(this)
    // if indices are defined, bind them to the program
    if ('indices' in config && config.indices) {
      const token = buffer(
        Array.isArray(config.indices)
          ? new Uint16Array(config.indices)
          : config.indices,
        {
          target: 'ELEMENT_ARRAY_BUFFER',
        }
      )
      bindBufferToken(
        mergeProps(this, {
          token,
          effect: glsl.effect,
        })
      )
    }
  }

  /* Map of all uniforms/attributes in this program. Gets added to during bind-stage with `addToQueue`. */
  renderQueue: Map<WebGLUniformLocation | number, () => void> = new Map()
  addToRenderQueue = (
    location: WebGLUniformLocation | number,
    fn: () => void
  ) => (
    this.renderQueue.set(location, fn), () => this.renderQueue.delete(location)
  )

  private renderRequestSignal = createSignal(0)

  private getRenderRequest = this.renderRequestSignal[0]
  private setRenderRequest = this.renderRequestSignal[1]

  requestRender = () => {
    this.setRenderRequest((number) => (number + 1) % Number.MAX_SAFE_INTEGER)
  }

  render = () => {
    this.getRenderRequest()
    this.gl.useProgram(this.program)

    /* iterate through all uniforms/attributes and update them. */
    this.renderQueue.forEach((update) => update())
    this.config.onRender?.(this.gl, this.program)

    if ('indices' in this.config && this.config.indices) {
      this.gl.drawElements(
        this.gl[this.config.mode || 'TRIANGLES'],
        this.config.indices.length,
        this.gl.UNSIGNED_SHORT,
        this.config.offset || 0
      )
    } else if ('count' in this.config) {
      this.gl.drawArrays(
        this.gl[this.config.mode || 'TRIANGLES'],
        this.config.first || 0,
        this.config.count
      )
    } else {
      console.error('neither indices nor count defined')
    }
    return this
  }
}

/** Checks if a given value is a `ProgramToken` */
export const isGLProgram = (value: any): value is GLProgram =>
  value instanceof GLProgram

/** Filters `any` for `ProgramTokens`. Returns `ProgramToken[]` */
export const filterGLPrograms = (value: any) =>
  castToArray(value).filter(isGLProgram)

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

type GLStackConfig = BaseConfig & { programs: GLProgram[] }
export class GLStack extends Base {
  config: GLStackConfig
  get programs() {
    return this.config.programs
  }
  constructor(config: GLStackConfig) {
    super(config)
    this.config = config
  }
  render() {
    this.programs.forEach((program) => program.render())
    return this
  }
}

export class GLRenderTextureStack extends GLStack {
  texture: GLRenderTexture
  constructor(
    config: BaseConfig & {
      programs: GLProgram[]
    } & Partial<RenderTextureConfig>
  ) {
    super(config)
    this.texture = new GLRenderTexture(this.gl, config)
  }
  render() {
    this.texture.activate()
    super.render()
    this.texture.deactivate()
    return this
  }
}

/* UTILITIES */

class UtilityBase<T> {
  gl: WebGL2RenderingContext
  config: Partial<T>
  constructor(gl: WebGL2RenderingContext, config?: Partial<T>) {
    this.gl = gl
    this.config = config || {}
  }
}
type RenderTextureConfig = RenderBufferConfig & {
  format: Format
  dataType: DataType
}
export class GLRenderTexture extends UtilityBase<
  RenderBufferConfig & { format: Format; dataType: DataType }
> {
  renderBuffer: GLRenderBuffer
  texture: WebGLTexture
  constructor(
    gl: WebGL2RenderingContext,
    config: Partial<
      RenderBufferConfig & { format: Format; dataType: DataType }
    > = {}
  ) {
    super(gl, config)
    this.renderBuffer = new GLRenderBuffer(gl, config)
    const texture = this.gl.createTexture()
    if (!texture) throw 'unable to render texture'
    this.texture = texture
  }

  activate() {
    if (!this.gl) {
      console.error('this.gl is undefined')
      return
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture)
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0, // level
      this.gl[this.config.internalFormat || 'RGBA'],
      this.gl.drawingBufferWidth,
      this.gl.drawingBufferHeight,
      0, // border
      this.gl[this.config.format || 'RGBA'],
      this.gl[this.config.dataType || 'UNSIGNED_BYTE'],
      null
    )
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      this.texture,
      0
    )
    this.renderBuffer.activate()
  }

  deactivate() {
    this.renderBuffer.deactivate()
  }
}

type RenderBufferConfig = {
  internalFormat: InternalFormat
  width: number
  height: number
}
export class GLRenderBuffer extends UtilityBase<RenderBufferConfig> {
  framebuffer: WebGLFramebuffer
  renderbuffer: WebGLRenderbuffer
  constructor(
    gl: WebGL2RenderingContext,
    config: Partial<RenderBufferConfig> = {}
  ) {
    super(gl, config)
    const framebuffer = this.gl.createFramebuffer()
    const renderbuffer = this.gl.createRenderbuffer()
    if (!framebuffer || !renderbuffer)
      throw 'could not create framebuffer or renderbuffer'
    this.config = config
    this.framebuffer = framebuffer
    this.renderbuffer = renderbuffer
  }

  activate() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer)

    /* Create a renderbuffer */
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.renderbuffer)
    this.gl.renderbufferStorage(
      this.gl.RENDERBUFFER,
      this.gl[this.config.internalFormat || 'RGBA'],
      this.config.width || this.gl.canvas.width,
      this.config.height || this.gl.canvas.height
    )

    /* Attach the renderbuffer to the framebuffer */
    this.gl.framebufferRenderbuffer(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.RENDERBUFFER,
      this.renderbuffer
    )

    this.gl.finish()

    return this
  }

  deactivate() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null)
  }
}
