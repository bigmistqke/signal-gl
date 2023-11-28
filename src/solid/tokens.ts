import { createEffect } from 'solid-js'
import zeptoid from 'zeptoid'
import { Attribute, Uniform, UniformSetter } from './types'

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

export const createUniformToken = (
  id: number | string,
  { type, value, options }: ReturnType<Uniform[keyof Uniform]>
) => ({
  name: `signal${options.name ? `_${options.name}` : ''}_${id}`,
  get value() {
    return value()
  },
  options,
  type,
  functionName: dataTypeToFunctionName(type),
})
export const bindUniformToken = (
  variable: ReturnType<typeof createUniformToken>,
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
  { type, value, options }: ReturnType<Attribute[keyof Attribute]>
) => ({
  name: `signal${options.name ? `_${options.name}` : ''}_${id}`,
  get value() {
    return value()
  },
  options: {
    ...options,
    type: 'attribute',
  },
  type,
})
export const bindAttributeToken = (
  variable: ReturnType<typeof createAttributeToken>,
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  render: () => void,
  onRender: (fn: () => void) => () => void
) => {
  const buffer = gl.createBuffer()
  const location = gl.getAttribLocation(program, variable.name)

  const target = variable.options.target
    ? gl[variable.options.target]
    : gl.ARRAY_BUFFER

  createEffect(() => {
    gl.bindBuffer(target, buffer)
    gl.bufferData(target, variable.value, gl.STATIC_DRAW)
    render()
  })

  onRender(() => {
    gl.bindBuffer(target, buffer)
    gl.vertexAttribPointer(
      location,
      variable.options.size,
      gl.FLOAT,
      false,
      0,
      0
    )
    gl.enableVertexAttribArray(location)
    if (variable.options.mode) gl.drawArrays(gl[variable.options.mode], 0, 6)
  })
}

let textureIndex = 0

export const createSampler2DToken = (
  id: number | string,
  { type, value, options }: ReturnType<Uniform['sampler2D']>
) => {
  // TODO: idk if there is a limit to incrementing textureIndex
  const _textureIndex = textureIndex
  textureIndex++
  return {
    name: `value_${id}`,
    type,
    options,
    textureIndex: _textureIndex,
    get value() {
      return value()
    },
  }
}
export const bindSampler2DToken = (
  sampler2D: ReturnType<typeof createSampler2DToken>,
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
    gl[options?.type === 'float' ? 'uniform1f' : 'uniform1i'](
      gl.getUniformLocation(program, sampler2D.name),
      sampler2D.textureIndex
    )

    render()
  })

export const createScopedVariableToken = (
  value: string,
  scopedVariables: Map<string, string>
) => {
  if (!scopedVariables.has(value)) {
    scopedVariables.set(value, `${value}_${zeptoid()}`)
  }
  return {
    name: scopedVariables.get(value),
    options: {
      type: 'scope',
      name: value,
    },
  }
}
