import { createEffect, type Accessor } from 'solid-js'
import zeptoid from 'zeptoid'
export * from './GL'

export type ShaderResult = {
  source: string
  bind: (
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    render: () => void,
    onRender: Accessor<(fn: () => void) => void>
  ) => void
}

type ValidShaderVersions = '1.017' | '3.0.0'

export type ShaderVariable = ReturnType<
  | typeof createUniform
  | typeof createAttribute
  | typeof createSampler2D
  | typeof createGlobalDeclaration
  | typeof createGlobalGet
>

export type ShaderInclude = {
  source: string
  variables: ShaderVariable[]
  version: ValidShaderVersions
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

const resolveVariable = (variable: ShaderVariable | ShaderResult) =>
  'source' in variable
    ? variable.source
    : variable.options.type === 'attribute'
    ? `in ${variable.type} ${variable.name};`
    : variable.options.type === 'uniform'
    ? `uniform ${variable.type} ${variable.name};`
    : ''

const compileStrings = (
  strings: TemplateStringsArray,
  variables: (ShaderVariable | ShaderResult)[]
) => {
  const source = [
    ...strings.flatMap((string, index) => {
      const variable = variables[index]
      if (!variable) return string
      const name = variable.name
      return name ? [string, name] : string
    }),
  ].join('')

  const precision = source.match(/precision.*;/)?.[0]
  if (precision) {
    const [pre, after] = source.split(/precision.*;/)
    return [
      pre,
      precision,
      variables.flatMap((variable) => resolveVariable(variable)).join('\n'),
      after,
    ].join('\n')
  }
  const version = source.match(/#version.*/)?.[0]
  const [pre, after] = source.split(/#version.*/)
  return [
    version,
    variables.flatMap((variable) => resolveVariable(variable)).join('\n'),
    after || pre,
  ].join('\n')
}

const createUniform = (
  id: number | string,
  { type, value, options }: ReturnType<UniformProxy[keyof UniformProxy]>
) => ({
  name: `signal${options.name ? `_${options.name}` : ''}_${id}`,
  get value() {
    return value()
  },
  options,
  type,
  functionName: dataTypeToFunctionName(type),
})
const bindUniform = (
  variable: ReturnType<typeof createUniform>,
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

const createAttribute = (
  id: number | string,
  { type, value, options }: ReturnType<AttributeProxy[keyof AttributeProxy]>
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
const bindAttribute = (
  variable: ReturnType<typeof createAttribute>,
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

const createSampler2D = (
  id: number | string,
  { type, value, options }: ReturnType<UniformProxy['sampler2D']>
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
const bindSampler2D = (
  sampler2D: ReturnType<typeof createSampler2D>,
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

const createScope = (value: string, _scope: Map<string, string>) => {
  if (!_scope.has(value)) {
    _scope.set(value, `${value}_${zeptoid()}`)
  }
  return {
    name: _scope.get(value),
    options: {
      type: 'scope',
      name: value,
    },
  }
}

export const glsl =
  (
    strings: TemplateStringsArray,
    // ...values: (ShaderVariable | Accessor<ShaderResult>)[]
    ...values: (
      | ReturnType<
          | (typeof attribute)[keyof typeof attribute]
          | (typeof uniform)[keyof typeof uniform]
        >
      | string
      | Accessor<ShaderResult>
    )[]
  ) =>
  () => {
    // initialize variables
    const globals = new Map<string, string>()
    const variables = values.map((value, index) => {
      if (typeof value === 'function') return value()

      return typeof value === 'string'
        ? createScope(value, globals)
        : value.options.type === 'attribute'
        ? createAttribute(zeptoid(), value)
        : value.type === 'sampler2D'
        ? createSampler2D(zeptoid(), value)
        : createUniform(zeptoid(), value)
    })

    // create shader-source
    const source = compileStrings(strings, variables).split(/\s\s+/g).join('\n')
    console.log('source', source)

    const bind = (
      gl: WebGL2RenderingContext,
      program: WebGLProgram,
      render: () => void,
      onRender: (fn: () => void) => void
    ) =>
      variables.forEach((variable) => {
        if ('bind' in variable) {
          variable.bind(gl, program, render, onRender)
          return
        }
        if (variable.options.type === 'attribute') {
          bindAttribute(variable, gl, program, render, onRender)
          return
        }
        if (variable.type === 'sampler2D') {
          bindSampler2D(
            variable as ReturnType<typeof createSampler2D>,
            gl,
            program,
            render
          )
          return
        }
        if (variable.options.type === 'uniform') {
          bindUniform(variable, gl, program, render)
        }
      })

    return { source, bind } as ShaderResult
  }

type PrimitiveOptions = {
  type?: 'attribute' | 'uniform' | 'scope'
  name?: string
}

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

type UniformProxy = {
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

export const uniform = new Proxy({} as UniformProxy, {
  get(target, prop) {
    return (
      ...[value, options]: Parameters<UniformProxy[keyof UniformProxy]>
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

type Buffer = Int8Array | Int16Array | Int32Array | Float32Array | Float64Array
type IntBuffer =
  | Int8Array
  | Int16Array
  | Int32Array
  | Float32Array
  | Float64Array

type AttributeOptions = PrimitiveOptions & {
  mode?: 'TRIANGLES' | 'POINTS' | 'LINES'
  target?:
    | 'ARRAY_BUFFER'
    | 'ELEMENT_ARRAY_BUFFER'
    | 'COPY_READ_BUFFER'
    | 'COPY_WRITE_BUFFER'
    | 'TRANSFORM_FEEDBACK_BUFFER'
    | 'UNIFORM_BUFFER'
    | 'PIXEL_PACK_BUFFER'
    | 'PIXEL_UNPACK_BUFFER'
}

type AttributeProxy = {
  float: VariableCallback<'float', Buffer, AttributeOptions>
  int: VariableCallback<'int', IntBuffer, AttributeOptions>
  bool: VariableCallback<'bool', IntBuffer, AttributeOptions>
  vec2: VariableCallback<'vec2', Buffer, AttributeOptions>
  ivec2: VariableCallback<'ivec2', IntBuffer, AttributeOptions>
  bvec2: VariableCallback<'bvec2', IntBuffer, AttributeOptions>
  vec3: VariableCallback<'vec3', Buffer, AttributeOptions>
  ivec3: VariableCallback<'ivec3', IntBuffer, AttributeOptions>
  bvec3: VariableCallback<'bvec3', IntBuffer, AttributeOptions>
  vec4: VariableCallback<'vec4', Buffer, AttributeOptions>
  ivec4: VariableCallback<'ivec4', IntBuffer, AttributeOptions>
  bvec4: VariableCallback<'bvec4', IntBuffer, AttributeOptions>
}

export const attribute = new Proxy({} as AttributeProxy, {
  get(target, prop) {
    return (
      ...[value, options]: Parameters<AttributeProxy[keyof AttributeProxy]>
    ) => {
      const size = typeof prop === 'string' ? +prop[prop.length - 1] : undefined
      return {
        value,
        type: prop,
        options: {
          ...options,
          size: size && !isNaN(size) ? size : 1,
          type: 'attribute',
        },
      }
    }
  },
})

export const scope = (name: string) => {
  return {
    options: {
      type: 'scope',
      name,
    },
  } as const
}
