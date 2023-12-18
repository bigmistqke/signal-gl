import { mergeProps } from 'solid-js'
import type {
  AttributeProxy,
  AttributeToken,
  BufferToken,
  OnRenderFunction,
  Sampler2DToken,
  UniformProxy,
  UniformToken,
  ValueOf,
} from '../types'

export const createToken = <
  TConfig extends ReturnType<ValueOf<UniformProxy> | ValueOf<AttributeProxy>>,
  TOther extends Record<string, any>
>(
  name: number | string,
  config: TConfig,
  other?: TOther
) => mergeProps(config, { name }, other)

type BindUniformTokenConfig = {
  token: UniformToken
  gl: WebGL2RenderingContext
  program: WebGLProgram
  onRender: OnRenderFunction
}

export const bindUniformToken = ({
  token,
  gl,
  program,
  onRender,
}: BindUniformTokenConfig) => {
  console.log('binding')
  // get location based on token.name
  const location = gl.getUniformLocation(program, token.name)!
  const isMatrix = token.dataType.includes('mat')
  if (isMatrix) {
    onRender(token.name, () =>
      (gl[token.functionName] as any)(location, false, token.value)
    )
  } else {
    onRender(token.name, () =>
      (gl[token.functionName] as any)(location, token.value)
    )
  }
}

type bindAttributeTokenConfig = {
  token: AttributeToken
  gl: WebGL2RenderingContext
  program: WebGLProgram
  onRender: OnRenderFunction
  effect: (cb: () => void) => void
  render: () => void
}
export const bindAttributeToken = ({
  token,
  gl,
  program,
  onRender,
  effect,
  render,
}: bindAttributeTokenConfig) => {
  const location = gl.getAttribLocation(program, token.name)
  bindBufferToken({
    token: token.buffer,
    gl,
    onRender,
    effect,
    render,
    cb: () => {
      gl.enableVertexAttribArray(location)
      gl.vertexAttribPointer(
        location,
        token.size,
        gl.FLOAT,
        false,
        token.options.stride,
        token.options.offset
      )
    },
  })
}

type BindBufferTokenConfig = {
  token: BufferToken
  gl: WebGL2RenderingContext
  onRender: OnRenderFunction
  effect: (cb: () => void) => void
  render: () => void
  cb?: (buffer: WebGLBuffer) => void
}
/**
 * bind BufferToken made with `buffer()`
 * */
export const bindBufferToken = ({
  token,
  gl,
  onRender,
  effect,
  render,
  cb,
}: BindBufferTokenConfig) => {
  const buffer = gl.createBuffer()!
  effect(() => {
    gl.bindBuffer(gl[token.options.target], buffer)
    gl.bufferData(gl[token.options.target], token.value, gl.STATIC_DRAW)
    gl.finish()
    render()
  })
  // NOTE: a bit of code-duplication, but better then unnecessary conditional in render-loop
  const renderFn = cb
    ? () => {
        gl.bindBuffer(gl[token.options.target], buffer)
        gl.bufferData(gl[token.options.target], token.value, gl.STATIC_DRAW)
        cb(buffer)
      }
    : () => {
        token.value
        gl.bindBuffer(gl[token.options.target], buffer)
      }
  onRender(token.name, renderFn)
}

type BindSampler2DTokenConfig = {
  token: Sampler2DToken
  gl: WebGL2RenderingContext
  program: WebGLProgram
  onRender: OnRenderFunction
  effect: (cb: () => void) => void
  render: () => void
}
export const bindSampler2DToken = ({
  token,
  gl,
  program,
  onRender,
  effect,
  render,
}: BindSampler2DTokenConfig) => {
  // create texture
  const texture = gl.createTexture()
  const options = mergeProps(
    {
      internalFormat: 'RGBA',
      width: 2,
      height: 1,
      border: 0,
      format: 'RGBA',
      dataType: 'UNSIGNED_BYTE',
      minFilter: 'NEAREST',
      magFilter: 'NEAREST',
      wrapS: 'CLAMP_TO_EDGE',
      wrapT: 'CLAMP_TO_EDGE',
    } as const,
    token.options
  )
  // render-loop
  onRender(token.name, () => {
    token.value // to trigger effect when value updates
    gl.activeTexture(gl[`TEXTURE${token.textureIndex}`])
    gl.bindTexture(gl.TEXTURE_2D, texture)
  })
  effect(() => {
    const {
      format,
      width,
      height,
      border,
      minFilter,
      magFilter,
      wrapS,
      wrapT,
      internalFormat,
      dataType,
    } = options
    gl.activeTexture(gl[`TEXTURE${token.textureIndex}`])
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl[internalFormat],
      width,
      height,
      border,
      gl[format],
      gl[dataType],
      token.value
    )
    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[minFilter])
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[magFilter])
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[wrapS])
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[wrapT])
    // Bind the texture to the uniform sampler
    gl.uniform1i(gl.getUniformLocation(program, token.name), token.textureIndex)
  })
}
