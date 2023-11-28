import { Accessor } from 'solid-js'

/* UTILITIES */

export type ValueOf<T extends Record<string, any>> = T[keyof T]

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
type IntBuffer =
  | Int8Array
  | Int16Array
  | Int32Array
  | Float32Array
  | Float64Array

export type OnRenderFunction = (fn: () => void) => () => void

export type PrimitiveOptions = {
  name?: string
}

/* GLSL TAG TEMPLATE LITERAL */

export type Hole =
  | ReturnType<ValueOf<Attribute>>
  | ReturnType<ValueOf<Uniform>>
  | string
  | Accessor<ShaderToken>

/* VARIABLE-PROXIES: UNIFORM + ATTRIBUTE */

type Variable<
  TType extends string,
  TValue extends any,
  TTOptions = PrimitiveOptions
> = (
  value: Accessor<TValue>,
  options?: TTOptions
) => {
  dataType: TType
  tokenType: 'uniform' | 'attribute' | 'sampler2D'
  value: Accessor<TValue>
  options: TTOptions
}

/* UNIFORM */

export type Uniform = {
  float: Variable<'float', number>
  int: Variable<'int', number>
  bool: Variable<'bool', boolean>
  vec2: Variable<'vec2', [number, number]>
  ivec2: Variable<'ivec2', [number, number]>
  bvec2: Variable<'bvec2', [boolean, boolean]>
  vec3: Variable<'vec3', [number, number, number]>
  ivec3: Variable<'ivec3', [number, number, number]>
  bvec3: Variable<'bvec3', [boolean, boolean, boolean]>
  vec4: Variable<'vec4', [number, number, number, number]>
  ivec4: Variable<'ivec4', [number, number, number, number]>
  bvec4: Variable<'bvec4', [boolean, boolean, boolean, boolean]>
  sampler2D: Variable<'sampler2D', ArrayBufferView, Sampler2DOptions>
}
export type UniformParameters = Parameters<Uniform[keyof Uniform]>
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
export type Attribute = {
  float: Variable<'float', Buffer, AttributeOptions>
  int: Variable<'int', IntBuffer, AttributeOptions>
  bool: Variable<'bool', IntBuffer, AttributeOptions>
  vec2: Variable<'vec2', Buffer, AttributeOptions>
  ivec2: Variable<'ivec2', IntBuffer, AttributeOptions>
  bvec2: Variable<'bvec2', IntBuffer, AttributeOptions>
  vec3: Variable<'vec3', Buffer, AttributeOptions>
  ivec3: Variable<'ivec3', IntBuffer, AttributeOptions>
  bvec3: Variable<'bvec3', IntBuffer, AttributeOptions>
  vec4: Variable<'vec4', Buffer, AttributeOptions>
  ivec4: Variable<'ivec4', IntBuffer, AttributeOptions>
  bvec4: Variable<'bvec4', IntBuffer, AttributeOptions>
}
export type AttributeParameters = Parameters<Attribute[keyof Attribute]>

/* TOKENS */

export type ShaderToken = {
  tokenType: 'shader'
  source: string
  bind: (
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    render: () => void,
    onRender: OnRenderFunction
  ) => void
}

interface TokenBase {
  dataType: keyof Uniform | keyof Attribute
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
  options: {
    name: string
  }
}

export type Token =
  | ShaderToken
  | ScopedVariableToken
  | AttributeToken
  | UniformToken
  | Sampler2DToken
