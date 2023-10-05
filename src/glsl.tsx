import { createEffect, type Accessor } from 'solid-js'
import zeptoid from 'zeptoid'
export * from './GL'

export type ShaderResult = {
  source: string
  bind: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
}

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

const compileStrings = (
  strings: TemplateStringsArray,
  variables: { dataType: string; name: string }[]
) => {
  const source = [
    ...strings.flatMap((string, index) => {
      const name = variables[index]?.name
      return name ? [string, name] : string
    }),
  ].join('\n')

  const precision = source.match(/precision.*;/)?.[0]
  if (precision) {
    const [pre, after] = source.split(/precision.*;/)
    return [
      pre,
      precision,
      variables
        .flatMap((arg) => `uniform ${arg.dataType} ${arg.name};`)
        .join('\n'),
      after,
    ].join('\n')
  }
  const version = source.match(/#version.*/)?.[0]
  const [pre, after] = source.split(/#version.*/)
  console.log('pre\n', pre, '\n after\n', after)
  return [
    version,
    variables
      .flatMap((arg) => `uniform ${arg.dataType} ${arg.name};`)
      .join('\n'),
    after || pre,
  ].join('\n')
}

const createUniform = (id: string, { type, value }: UniformToken) => ({
  name: `value_${id}`,
  get value() {
    return value()
  },
  dataType: type,
  functionName: dataTypeToFunctionName(type),
})
const bindUniform = (
  uniform: ReturnType<typeof createUniform>,
  gl: WebGL2RenderingContext,
  program: WebGLProgram
) => {
  const location = gl.getUniformLocation(program, uniform.name)
  createEffect(() => gl[uniform.functionName](location, uniform.value))
}

let textureIndex = 0

const createSampler2D = (
  id: string,
  { type, value, options }: Sampler2DToken
) => {
  // TODO: idk if there is a limit to incrementing textureIndex
  const _textureIndex = textureIndex
  textureIndex++
  return {
    name: `value_${id}`,
    dataType: type,
    options,
    textureIndex: _textureIndex,
    get value() {
      return value()
    },
  }
}
const bindSampler2D = (
  sampler2D: ReturnType<typeof createSampler2D>,
  gl: WebGL2RenderingContext,
  program: WebGLProgram
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
  })

export const shader =
  (strings: TemplateStringsArray, ...values: UniformToken[]) =>
  () => {
    // initialize variables
    const variables = values.map((value, index) =>
      value.type === 'sampler2D'
        ? createSampler2D(zeptoid(), value)
        : createUniform(zeptoid(), value)
    )

    // create shader-source
    const source = compileStrings(strings, variables)

    const bind = (gl: WebGL2RenderingContext, program: WebGLProgram) =>
      variables.map((variable) =>
        variable.dataType === 'sampler2D'
          ? bindSampler2D(
              variable as ReturnType<typeof createSampler2D>,
              gl,
              program
            )
          : bindUniform(variable, gl, program)
      )

    return { source, bind } as ShaderResult
  }

export const float = (
  value: Accessor<number>,
  options: { type: 'attribute' | 'uniform' }
) =>
  ({
    type: 'float',
    value,
    options,
  } as const)

export const int = (
  value: Accessor<number>,
  options: { type: 'attribute' | 'uniform' }
) =>
  ({
    type: 'int',
    value,
    options,
  } as const)

export const bool = (
  value: Accessor<boolean>,
  options: { type: 'attribute' | 'uniform' }
) =>
  ({
    type: 'bool',
    value,
    options,
  } as const)

export const ivec2 = (
  value: Accessor<[number, number]>,
  options: { type: 'attribute' | 'uniform' }
) =>
  ({
    type: 'ivec2',
    value,
    options,
  } as const)

export const vec2 = (
  value: Accessor<[number, number]>,
  options: { type: 'attribute' | 'uniform' }
) =>
  ({
    type: 'vec2',
    value,
    options,
  } as const)

export const bvec2 = (
  value: Accessor<[boolean, boolean]>,
  options: { type: 'attribute' | 'uniform' }
) =>
  ({
    type: 'bvec2',
    value,
    options,
  } as const)

export const ivec3 = (
  value: Accessor<[number, number, number]>,
  options: { type: 'attribute' | 'uniform' }
) =>
  ({
    type: 'ivec3',
    value,
    options,
  } as const)

export const vec3 = (
  value: Accessor<[number, number, number]>,
  options: { type: 'attribute' | 'uniform' }
) =>
  ({
    type: 'vec3',
    value,
    options,
  } as const)

export const bvec3 = (
  value: Accessor<[boolean, boolean, boolean]>,
  options: { type: 'attribute' | 'uniform' }
) =>
  ({
    type: 'bvec3',
    value,
    options,
  } as const)

export const vec4 = (
  value: Accessor<[number, number, number, number]>,
  options: { type: 'attribute' | 'uniform' }
) =>
  ({
    type: 'vec4',
    value,
    options,
  } as const)

export const ivec4 = (
  value: Accessor<[number, number, number, number]>,
  options: { type: 'attribute' | 'uniform' }
) =>
  ({
    type: 'ivec4',
    value,
    options,
  } as const)

export const bvec4 = (
  value: Accessor<[boolean, boolean, boolean, boolean]>,
  options: { type: 'attribute' | 'uniform' }
) =>
  ({
    type: 'bvec4',
    value,
    options,
  } as const)

export const sampler2D = (
  value: Accessor<ArrayBufferView>,
  options?: {
    width?: number
    height?: number
    type?: 'float' | 'integer'
    format?: 'RGBA' | 'RGB' | 'LUMINANCE'
    magFilter?: 'NEAREST' | 'LINEAR'
    minFilter?: 'NEAREST' | 'LINEAR'
    border?: number
  }
) =>
  ({
    type: 'sampler2D',
    value,
    options,
  } as const)

type UniformToken =
  | ReturnType<typeof float>
  | ReturnType<typeof int>
  | ReturnType<typeof bool>
  | ReturnType<typeof vec2>
  | ReturnType<typeof ivec2>
  | ReturnType<typeof bvec2>
  | ReturnType<typeof vec3>
  | ReturnType<typeof ivec3>
  | ReturnType<typeof bvec3>
  | ReturnType<typeof vec4>
  | ReturnType<typeof ivec4>
  | ReturnType<typeof bvec4>
  | ReturnType<typeof sampler2D>

type Sampler2DToken = ReturnType<typeof sampler2D>

type UniformSetter =
  | 'uniform1f'
  | 'uniform1i'
  | 'uniform2fv'
  | 'uniform2iv'
  | 'uniform3fv'
  | 'uniform3iv'
  | 'uniform4fv'
  | 'uniform4iv'
