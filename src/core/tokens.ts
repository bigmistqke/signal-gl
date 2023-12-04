import type {
  AttributeProxy,
  AttributeToken,
  OnRenderFunction,
  Sampler2DToken,
  UniformProxy,
  UniformToken,
  ValueOf,
} from '@core/types'
import { mergeProps } from 'solid-js'
import { readableError } from './utils'

const DEBUG = false

export const createToken = <
  TConfig extends ReturnType<ValueOf<UniformProxy> | ValueOf<AttributeProxy>>,
  TOther extends Record<string, any>
>(
  name: number | string,
  config: TConfig,
  other?: TOther
) => mergeProps(config, { name }, other)

export const bindUniformToken = (
  token: UniformToken,
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  onRender: OnRenderFunction
) => {
  const location = gl.getUniformLocation(program, token.name)!
  onRender(location, () => gl[token.functionName](location, token.value))
}

export const bindAttributeToken = (
  token: AttributeToken,
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  onRender: OnRenderFunction
) => {
  const target = token.options?.target
  const buffer = gl.createBuffer()
  const glTarget = target ? gl[target] : gl.ARRAY_BUFFER
  const location = gl.getAttribLocation(program, token.name)

  if (location === -1)
    DEBUG && console.error('token is not registered', token.name)

  onRender(location, () => {
    gl.bindBuffer(glTarget, buffer)
    gl.bufferData(glTarget, token.value, gl.STATIC_DRAW)
    gl.vertexAttribPointer(location, token.size, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(location)
  })
}

export const bindSampler2DToken = (
  token: Sampler2DToken,
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  effect: (cb: () => void) => void
) => {
  // Create a texture and bind it to texture unit 0
  effect(() => {
    const texture = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0 + token.textureIndex)
    gl.bindTexture(gl.TEXTURE_2D, texture)

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
      type,
      dataType,
    } = token.options || {}

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat ? gl[internalFormat] : gl.RGBA,
      width || 2,
      height || 1,
      border || 0,
      format ? gl[format] : gl.RGBA,
      dataType ? gl[dataType] : gl.UNSIGNED_BYTE,
      token.value
    )

    DEBUG && console.error(readableError(gl))

    // Set texture parameters
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      minFilter ? gl[minFilter] : gl.NEAREST
    )
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MAG_FILTER,
      magFilter ? gl[magFilter] : gl.NEAREST
    )
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_S,
      wrapS ? gl[wrapS] : gl.CLAMP_TO_EDGE
    )
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_T,
      wrapT ? gl[wrapT] : gl.CLAMP_TO_EDGE
    )

    // Bind the texture to the uniform sampler
    gl[type === 'float' ? 'uniform1f' : 'uniform1i'](
      gl.getUniformLocation(program, token.name),
      token.textureIndex
    )

    gl.flush()
  })
}
