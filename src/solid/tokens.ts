import { createEffect, mergeProps } from 'solid-js'
import zeptoid from 'zeptoid'
import {
  Attribute,
  AttributeToken,
  OnRenderFunction,
  Sampler2DToken,
  ScopedVariableToken,
  Uniform,
  UniformSetter,
  UniformToken,
  ValueOf,
} from './types'

const dataTypeToFunctionName = (dataType: string): UniformSetter => {
  // TODO: include mat
  if (dataType === 'float') return 'uniform1f'
  if (dataType === 'int') return 'uniform1i'
  if (dataType === 'bool') return 'uniform1i'

  return ('uniform' +
    dataType[dataType.length - 1] +
    (dataType[0] === 'b' ? 'b' : dataType[0] === 'i' ? 'i' : 'f') +
    'v') as UniformSetter
}

const createToken = <
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

export const createUniformToken = (
  id: number | string,
  config: ReturnType<ValueOf<Uniform>>
): UniformToken =>
  createToken(id, config, {
    functionName: dataTypeToFunctionName(config.dataType),
  })

export const bindUniformToken = (
  variable: UniformToken,
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  render: () => void
) => {
  const location = gl.getUniformLocation(program, variable.name)
  createEffect(() => {
    gl[variable.functionName](location, variable.value)
    render()
  })
}

export const createAttributeToken = (
  id: number | string,
  config: ReturnType<ValueOf<Attribute>>
): AttributeToken => createToken(id, config)

export const bindAttributeToken = (
  token: AttributeToken,
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  render: () => void,
  onRender: OnRenderFunction
) => {
  const buffer = gl.createBuffer()
  const location = gl.getAttribLocation(program, token.name)

  const target = token.options.target
    ? gl[token.options.target]
    : gl.ARRAY_BUFFER

  createEffect(() => {
    gl.bindBuffer(target, buffer)
    gl.bufferData(target, token.value, gl.STATIC_DRAW)
    render()
  })

  onRender(() => {
    gl.bindBuffer(target, buffer)
    gl.vertexAttribPointer(location, token.options.size, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(location)
    if (token.options.mode) gl.drawArrays(gl[token.options.mode], 0, 6)
  })
}

let textureIndex = 0

export const createSampler2DToken = (
  id: number | string,
  config: ReturnType<Uniform['sampler2D']>
): Sampler2DToken =>
  createToken(id, config, {
    textureIndex: textureIndex++,
  })

export const bindSampler2DToken = (
  sampler2D: Sampler2DToken,
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  render: () => void
) =>
  createEffect(() => {
    const options = sampler2D.options
    const _value = sampler2D.value

    // Create a texture and bind it to texture unit 0
    const texture = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0 + sampler2D.textureIndex)
    gl.bindTexture(gl.TEXTURE_2D, texture)

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      sampler2D.options?.format ? gl[sampler2D.options.format] : gl.RGBA,
      sampler2D.options?.width || 2,
      sampler2D.options?.height || 1,
      sampler2D.options?.border || 0,
      sampler2D.options?.format ? gl[sampler2D.options.format] : gl.RGBA,
      gl.UNSIGNED_BYTE,
      _value
    )

    // Set texture parameters
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      options?.minFilter ? gl[options.minFilter] : gl.NEAREST
    )
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MAG_FILTER,
      options?.magFilter ? gl[options.magFilter] : gl.NEAREST
    )

    // Bind the texture to the uniform sampler
    gl[sampler2D.dataType === 'float' ? 'uniform1f' : 'uniform1i'](
      gl.getUniformLocation(program, sampler2D.name),
      sampler2D.textureIndex
    )

    render()
  })

export const createScopedVariableToken = (
  value: string,
  scopedVariables: Map<string, string>
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
