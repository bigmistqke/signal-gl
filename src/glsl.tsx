import { createEffect, createMemo, createSignal, type Accessor } from 'solid-js'
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

const compileStrings = (strings: TemplateStringsArray, memo: any) => {
  const source = [
    ...strings.flatMap((string, index) => {
      const name = memo[index]?.name
      return name ? [string, name] : string
    }),
  ].join('\n')

  const precision = source.match(/precision.*;/)?.[0]
  if (precision) {
    const [pre, after] = source.split(/precision.*;/)
    return [
      pre,
      precision,
      memo.flatMap((arg) => `uniform ${arg.dataType} ${arg.name};`).join('\n'),
      after,
    ].join('\n')
  }
  const version = source.match(/#version.*/)?.[0]
  const [, after] = source.split(/#version.*/)
  return [
    version,
    memo.flatMap((arg) => `uniform ${arg.dataType} ${arg.name};`).join('\n'),
    after,
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
const updateUniform = (
  uniform: ReturnType<typeof createUniform>,
  gl: Accessor<WebGL2RenderingContext | null>,
  program: Accessor<WebGLProgram | null>
) => {
  const location = createMemo(() => {
    const _program = program()
    const _gl = gl()
    if (!_program || !_gl) return undefined
    return _gl.getUniformLocation(_program, uniform.name)
  })
  createEffect(() => {
    const _gl = gl()
    const _location = location()
    if (_gl && uniform.functionName in _gl && _location) {
      _gl[uniform.functionName](_location, uniform.value)
    }
  })
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
const updateSampler2D = (
  sampler2D: ReturnType<typeof createSampler2D>,
  _gl: Accessor<WebGL2RenderingContext | null>,
  _program: Accessor<WebGLProgram | null>
) =>
  createEffect(() => {
    const gl = _gl()
    const program = _program()
    const options = sampler2D.options

    if (!gl || !program) return undefined

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
    const [program, setProgram] = createSignal<WebGLProgram | null>(null)
    const [gl, setGl] = createSignal<WebGL2RenderingContext | null>(null)

    const variables = values.map((value, index) =>
      value.type === 'sampler2D'
        ? createSampler2D(zeptoid(), value)
        : createUniform(zeptoid(), value)
    )

    variables.map((variable) => {
      if (variable.dataType === 'sampler2D') {
        updateSampler2D(
          variable as ReturnType<typeof createSampler2D>,
          gl,
          program
        )
      } else {
        updateUniform(variable, gl, program)
      }
    })

    // create shader-source
    const source = compileStrings(strings, variables)

    const link = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
      setGl(gl)
      setProgram(program)
    }

    return { source, bind: link } as ShaderResult
  }

export const float = (value: Accessor<number>) =>
  ({
    type: 'float',
    value,
  } as const)

export const int = (value: Accessor<number>) =>
  ({
    type: 'int',
    value,
  } as const)

export const bool = (value: Accessor<boolean>) =>
  ({
    type: 'bool',
    value,
  } as const)

export const ivec2 = (value: Accessor<[number, number]>) =>
  ({
    type: 'ivec2',
    value,
  } as const)

export const vec2 = (value: Accessor<[number, number]>) =>
  ({
    type: 'vec2',
    value,
  } as const)

export const bvec2 = (value: Accessor<[boolean, boolean]>) =>
  ({
    type: 'bvec2',
    value,
  } as const)

export const ivec3 = (value: Accessor<[number, number, number]>) =>
  ({
    type: 'ivec3',
    value,
  } as const)

export const vec3 = (value: Accessor<[number, number, number]>) =>
  ({
    type: 'vec3',
    value,
  } as const)

export const bvec3 = (value: Accessor<[boolean, boolean, boolean]>) =>
  ({
    type: 'bvec3',
    value,
  } as const)

export const vec4 = (value: Accessor<[number, number, number, number]>) =>
  ({
    type: 'vec4',
    value,
  } as const)

export const ivec4 = (value: Accessor<[number, number, number, number]>) =>
  ({
    type: 'ivec4',
    value,
  } as const)

export const bvec4 = (value: Accessor<[boolean, boolean, boolean, boolean]>) =>
  ({
    type: 'bvec4',
    value,
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
