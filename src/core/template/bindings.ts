import { GLRenderTexture } from '@core/classes'
import { createRenderEffect, mergeProps, untrack } from 'solid-js'
import type {
  AddToRenderQueue,
  AttributeProxy,
  AttributeToken,
  BufferToken,
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
  addToRenderQueue: AddToRenderQueue
  requestRender: () => void
}

export const bindUniformToken = ({
  token,
  gl,
  program,
  addToRenderQueue,
}: BindUniformTokenConfig) => {
  const location = gl.getUniformLocation(program, token.name)!
  const isMatrix = token.dataType.includes('mat')
  const update = isMatrix
    ? () => (gl[token.functionName] as any)(location, false, token.value)
    : () => (gl[token.functionName] as any)(location, token.value)
  addToRenderQueue(token.name, update)
}

type bindAttributeTokenConfig = {
  token: AttributeToken
  gl: WebGL2RenderingContext
  program: WebGLProgram
  addToRenderQueue: AddToRenderQueue
  requestRender: () => void
}
export const bindAttributeToken = ({
  token,
  gl,
  program,
  addToRenderQueue,
  requestRender,
}: bindAttributeTokenConfig) => {
  const location = gl.getAttribLocation(program, token.name)
  bindBufferToken({
    token: token.buffer,
    gl,
    addToRenderQueue,
    requestRender,
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
  addToRenderQueue: AddToRenderQueue
  requestRender: () => void
  cb?: (buffer: WebGLBuffer) => void
}
/**
 * bind BufferToken made with `buffer()`
 * */
export const bindBufferToken = ({
  token,
  gl,
  addToRenderQueue,
  requestRender,
  cb,
}: BindBufferTokenConfig) => {
  const buffer = gl.createBuffer()!
  addToRenderQueue(token.name, () => {
    gl.bindBuffer(gl[token.options.target], buffer)
    cb?.(buffer)
  })
  createRenderEffect(() => {
    gl.bindBuffer(gl[token.options.target], buffer)
    gl.bufferData(gl[token.options.target], token.value, gl.STATIC_DRAW)
    gl.finish()
    requestRender()
  })
}

type BindSampler2DTokenConfig = {
  token: Sampler2DToken
  gl: WebGL2RenderingContext
  program: WebGLProgram
  addToRenderQueue: AddToRenderQueue
  requestRender: () => void
}
export const bindSampler2DToken = ({
  token,
  gl,
  program,
  addToRenderQueue,
  requestRender,
}: BindSampler2DTokenConfig) => {
  // create texture

  const texture = untrack(() => {
    return token.value instanceof GLRenderTexture
      ? token.value.texture
      : gl.createTexture()
  })
  const options = mergeProps(
    {
      internalFormat: 'RGBA8',
      width: 2,
      height: 2,
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
  // requestRender-loop
  addToRenderQueue(token.name, () => {
    token.value
    gl.activeTexture(gl[`TEXTURE${token.textureIndex}`])
    gl.bindTexture(gl.TEXTURE_2D, texture)
  })
  createRenderEffect(() => {
    gl.useProgram(program)
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
    if (!(untrack(() => token.value) instanceof GLRenderTexture)) {
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
    }

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[minFilter])
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[magFilter])
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[wrapS])
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[wrapT])
    // Bind the texture to the uniform sampler
    gl.uniform1i(gl.getUniformLocation(program, token.name), token.textureIndex)
    requestRender()
  })
}
