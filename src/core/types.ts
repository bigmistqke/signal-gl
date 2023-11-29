/* UTILITIES */

type Accessor<T> = () => T
export type ValueOf<T extends Record<string, any>> = T[keyof T]
export type IsUnion<T, B = T> = T extends T
  ? [B] extends [T]
    ? false
    : true
  : never
export type Check<T, U extends any[]> = T extends U[number] ? true : false

/* TYPE ERROR MESSAGES */

const error = Symbol()
export type GLSLError<T> = { [error]: T }

/* MISC */

export type UniformSetter =
  | 'uniform1f'
  | 'uniform1i'
  | 'uniform2fv'
  | 'uniform2iv'
  | 'uniform3fv'
  | 'uniform3iv'
  | 'uniform4fv'
  | 'uniform4iv'

export type Buffer =
  | Int8Array
  | Int16Array
  | Int32Array
  | Float32Array
  | Float64Array

type IntBuffer = Int8Array | Int16Array | Int32Array

export type OnRenderFunction = (fn: () => void) => () => void

export type PrimitiveOptions = {
  name?: string
}

/* GLSL TAG TEMPLATE LITERAL */

export type TemplateValue =
  | ReturnType<ValueOf<AttributeProxy>>
  | ReturnType<ValueOf<UniformProxy>>
  | string
  | Accessor<ShaderToken>

/* VARIABLE-PROXIES: UNIFORM + ATTRIBUTE */

type Variable<
  TTokenType extends string,
  TDataType extends string,
  TValueDefault extends any,
  TTOptionsDefault = unknown
> = <
  const TValue extends TValueDefault,
  const TTOptions extends TTOptionsDefault
>(
  value: Accessor<TValue> | TValue,
  options?: TTOptions
) => {
  name: string
  dataType: TDataType
  tokenType: TTokenType
  value: TValue
  options: TTOptions
}

/* UNIFORM */

export type UniformProxy = {
  float: Variable<'uniform', 'float', number>
  int: Variable<'uniform', 'int', number>
  bool: Variable<'uniform', 'bool', boolean>
  vec2: Variable<'uniform', 'vec2', [number, number]>
  ivec2: Variable<'uniform', 'ivec2', [number, number]>
  bvec2: Variable<'uniform', 'bvec2', [boolean, boolean]>
  vec3: Variable<'uniform', 'vec3', [number, number, number]>
  ivec3: Variable<'uniform', 'ivec3', [number, number, number]>
  bvec3: Variable<'uniform', 'bvec3', [boolean, boolean, boolean]>
  vec4: Variable<'uniform', 'vec4', [number, number, number, number]>
  ivec4: Variable<'uniform', 'ivec4', [number, number, number, number]>
  bvec4: Variable<'uniform', 'bvec4', [boolean, boolean, boolean, boolean]>
  sampler2D: Variable<
    'sampler2D',
    'sampler2D',
    ArrayBufferView,
    Sampler2DOptions
  >
}
export type UniformParameters = Parameters<UniformProxy[keyof UniformProxy]>
export type UniformReturnType = ReturnType<ValueOf<UniformProxy>>
export type Sampler2DOptions = PrimitiveOptions & {
  width?: number
  height?: number
  type?: 'float' | 'integer'
  format?: 'RGBA' | 'RGB' | 'LUMINANCE'
  magFilter?: 'NEAREST' | 'LINEAR'
  minFilter?: 'NEAREST' | 'LINEAR'
  border?: number
}

/* ATTRIBUTE */

export type AttributeOptions = PrimitiveOptions & {
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
export type AttributeProxy = {
  float: Variable<'attribute', 'float', Buffer, AttributeOptions>
  int: Variable<'attribute', 'int', IntBuffer, AttributeOptions>
  bool: Variable<'attribute', 'bool', IntBuffer, AttributeOptions>
  vec2: Variable<'attribute', 'vec2', Buffer, AttributeOptions>
  ivec2: Variable<'attribute', 'ivec2', IntBuffer, AttributeOptions>
  bvec2: Variable<'attribute', 'bvec2', IntBuffer, AttributeOptions>
  vec3: Variable<'attribute', 'vec3', Buffer, AttributeOptions>
  ivec3: Variable<'attribute', 'ivec3', IntBuffer, AttributeOptions>
  bvec3: Variable<'attribute', 'bvec3', IntBuffer, AttributeOptions>
  vec4: Variable<'attribute', 'vec4', Buffer, AttributeOptions>
  ivec4: Variable<'attribute', 'ivec4', IntBuffer, AttributeOptions>
  bvec4: Variable<'attribute', 'bvec4', IntBuffer, AttributeOptions>
}
export type AttributeParameters = Parameters<
  AttributeProxy[keyof AttributeProxy]
>
export type AttributeReturnType = ReturnType<ValueOf<AttributeProxy>>

/* TOKENS */

export type ShaderToken = {
  source: string
  template: TemplateStringsArray
  tokenType: 'shader'
  bind: (
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    onRender: OnRenderFunction
  ) => void
}

interface TokenBase {
  dataType: keyof UniformProxy | keyof AttributeProxy
  options: PrimitiveOptions
  name: string
  value: any
}
export interface AttributeToken extends TokenBase {
  size: number
  tokenType: 'attribute'
  options: AttributeOptions
}

export interface UniformToken extends TokenBase {
  functionName: UniformSetter
  tokenType: 'uniform'
}

export interface Sampler2DToken extends TokenBase {
  options: Sampler2DOptions
  textureIndex: number
  tokenType: 'sampler2D'
}

export type ScopedVariableToken = {
  name: string
  tokenType: 'scope'
}

export type Token =
  | ShaderToken
  | ScopedVariableToken
  | AttributeToken
  | UniformToken
  | Sampler2DToken
