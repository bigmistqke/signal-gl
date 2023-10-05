import { createEffect, type Accessor } from 'solid-js'
export * from './GL'

export type ShaderResult = {
  source: string
  bind: (
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    render: () => void
  ) => void
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
  ].join('')

  const precision = source.match(/precision.*;/)?.[0]
  if (precision) {
    const [pre, after] = source.split(/precision.*;/)
    return [
      pre,
      precision,
      '\n\n',
      variables
        .flatMap((arg) => `uniform ${arg.dataType} ${arg.name};`)
        .join('\n'),
      '\n',
      after,
    ].join('')
  }
  const version = source.match(/#version.*/)?.[0]
  const [pre, after] = source.split(/#version.*/)
  return [
    version,
    variables.flatMap((arg) => `uniform ${arg.dataType} ${arg.name};`).join(''),
    after || pre,
  ].join('\n')
}

const createVariable = (
  id: number | string,
  { type, value, options }: ReturnType<VariableProxy[keyof VariableProxy]>
) => ({
  name: `signal${options.name ? `_${options.name}` : ''}_${id}`,
  get value() {
    return value()
  },
  options,
  dataType: type,
  functionName: dataTypeToFunctionName(type),
})
const bindVariable = (
  variable: ReturnType<typeof createVariable>,
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

let textureIndex = 0

const createSampler2D = (
  id: number | string,
  { type, value, options }: ReturnType<VariableProxy['sampler2D']>
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
  program: WebGLProgram | null,
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

let uniformIndex = 0
export const glsl =
  (
    strings: TemplateStringsArray,
    ...values: ReturnType<VariableProxy[keyof VariableProxy]>[]
  ) =>
  () => {
    // initialize variables
    const variables = values.map((value, index) =>
      value.type === 'sampler2D'
        ? createSampler2D(++uniformIndex, value)
        : createVariable(++uniformIndex, value)
    )

    // create shader-source
    const source = compileStrings(strings, variables)
    console.log('source is ', source)

    const bind = (
      gl: WebGL2RenderingContext,
      program: WebGLProgram,
      render: () => void
    ) => {
      variables.map((variable) => {
        if (variable.dataType === 'sampler2D') {
          bindSampler2D(
            variable as ReturnType<typeof createSampler2D>,
            gl,
            program,
            render
          )
        } else {
          bindVariable(variable, gl, program, render)
        }
      })
    }

    return { source, bind } as ShaderResult
  }

type PrimitiveOptions = { type?: 'attribute' | 'uniform'; name?: string }

type UniformSetter =
  | 'uniform1f'
  | 'uniform1i'
  | 'uniform2fv'
  | 'uniform2iv'
  | 'uniform3fv'
  | 'uniform3iv'
  | 'uniform4fv'
  | 'uniform4iv'

type VariableCallback<
  TType extends string,
  TValue extends any,
  TTOptions = PrimitiveOptions
> = (
  value: Accessor<TValue>,
  options?: TTOptions
) => {
  type: TType
  value: Accessor<TValue>
  options: TTOptions
}

type VariableProxy = {
  float: VariableCallback<'float', number>
  int: VariableCallback<'int', number>
  bool: VariableCallback<'bool', boolean>
  vec2: VariableCallback<'vec2', [number, number]>
  ivec2: VariableCallback<'ivec2', [number, number]>
  bvec2: VariableCallback<'bvec2', [boolean, boolean]>
  vec3: VariableCallback<'vec3', [number, number, number]>
  ivec3: VariableCallback<'ivec3', [number, number, number]>
  bvec3: VariableCallback<'bvec3', [boolean, boolean, boolean]>
  vec4: VariableCallback<'vec4', [number, number, number, number]>
  ivec4: VariableCallback<'ivec4', [number, number, number, number]>
  bvec4: VariableCallback<'bvec4', [boolean, boolean, boolean, boolean]>
  sampler2D: VariableCallback<
    'sampler2D',
    ArrayBufferView,
    PrimitiveOptions & {
      width?: number
      height?: number
      type?: 'float' | 'integer'
      format?: 'RGBA' | 'RGB' | 'LUMINANCE'
      magFilter?: 'NEAREST' | 'LINEAR'
      minFilter?: 'NEAREST' | 'LINEAR'
      border?: number
    }
  >
}

export const u = new Proxy({} as VariableProxy, {
  get(target, prop) {
    return (
      ...[value, options]: Parameters<VariableProxy[keyof VariableProxy]>
    ) => ({
      value,
      type: prop,
      options: {
        ...options,
        type: 'uniform',
      },
    })
  },
})
