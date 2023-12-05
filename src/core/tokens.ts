import { mergeProps } from 'solid-js'

import type {
  AttributeProxy,
  AttributeToken,
  OnRenderFunction,
  Sampler2DToken,
  UniformProxy,
  UniformToken,
  ValueOf,
} from './types'

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
  onRender: OnRenderFunction,
  effect: (cb: () => void) => void
) => {
  // get location based on token.name
  const location = gl.getUniformLocation(program, token.name)!
  onRender(token.name, () =>
    (gl[token.functionName] as any)(location, token.value)
  )
}

export const bindAttributeToken = (
  token: AttributeToken,
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  onRender: OnRenderFunction,
  effect: (cb: () => void) => void
) => {
  // create buffer
  const buffer = gl.createBuffer()
  const location = gl.getAttribLocation(program, token.name)
  const glTarget = () => gl[token.options?.target || 'ARRAY_BUFFER']
  onRender(token.name, () => {
    token.value // to trigger effect when value updates
    gl.bindBuffer(glTarget(), buffer)
    gl.vertexAttribPointer(location, token.size, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(location)
  })
  effect(() => {
    gl.bindBuffer(glTarget(), buffer)
    gl.bufferData(glTarget(), token.value, gl.STATIC_DRAW)
  })
}

export const bindSampler2DToken = (
  token: Sampler2DToken,
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  onRender: OnRenderFunction,
  effect: (cb: () => void) => void
) => {
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
