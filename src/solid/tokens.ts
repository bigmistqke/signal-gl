import { createEffect, mergeProps } from 'solid-js'
import zeptoid from 'zeptoid'

import type {
  Attribute,
  AttributeToken,
  OnRenderFunction,
  Sampler2DToken,
  ScopedVariableToken,
  Uniform,
  UniformToken,
  ValueOf,
} from '@core/types'

export const createToken = <
  TConfig extends ReturnType<ValueOf<Uniform> | ValueOf<Attribute>>,
  TOther extends Record<string, any>,
>(
  id: number | string,
  config: TConfig,
  other?: TOther
) =>
  mergeProps(
    config,
    {
      name: `${config.options?.name || ''}_${id}`,
    },
    other
  )

export const createScopedVariableToken = (
  scopedVariables: Map<string, string>,
  value: string
): ScopedVariableToken => {
  if (!scopedVariables.has(value)) {
    scopedVariables.set(value, `${value}_${zeptoid()}`)
  }
  return {
    name: scopedVariables.get(value)!,
    tokenType: 'scope',
    options: {
      name: value,
    },
  }
}

export const bindUniformToken = (
  token: UniformToken,
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  render: () => void
) => {
  const location = gl.getUniformLocation(program, token.name)
  createEffect(() => {
    gl[token.functionName](location, token.value)
    render()
  })
}

export const bindAttributeToken = (
  token: AttributeToken,
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  render: () => void,
  onRender: OnRenderFunction
) => {
  let { target, mode } = token.options || {}

  const buffer = gl.createBuffer()
  const location = gl.getAttribLocation(program, token.name)

  const glTarget = target ? gl[target] : gl.ARRAY_BUFFER

  createEffect(() => {
    gl.bindBuffer(glTarget, buffer)
    gl.bufferData(glTarget, token.value, gl.STATIC_DRAW)
    render()
  })

  onRender(() => {
    gl.bindBuffer(glTarget, buffer)
    gl.vertexAttribPointer(location, token.size, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(location)
    if (mode) gl.drawArrays(gl[mode], 0, 6)
  })
}

export const bindSampler2DToken = (
  sampler2D: Sampler2DToken,
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  render: () => void
) =>
  createEffect(() => {
    const { format, width, height, border, minFilter, magFilter } =
      sampler2D.options

    // Create a texture and bind it to texture unit 0
    const texture = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0 + sampler2D.textureIndex)
    gl.bindTexture(gl.TEXTURE_2D, texture)

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      format ? gl[format] : gl.RGBA,
      width || 2,
      height || 1,
      border || 0,
      format ? gl[format] : gl.RGBA,
      gl.UNSIGNED_BYTE,
      sampler2D.value
    )

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

    // Bind the texture to the uniform sampler
    gl[sampler2D.dataType === 'float' ? 'uniform1f' : 'uniform1i'](
      gl.getUniformLocation(program, sampler2D.name),
      sampler2D.textureIndex
    )

    render()
  })
