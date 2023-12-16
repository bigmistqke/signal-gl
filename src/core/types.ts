import { mat2, mat3, mat4 } from "gl-matrix";

/* TYPE UTILITIES */
export type Accessor<T> = () => T
export type ValueOf<T extends Record<string, any>> = T[keyof T]
export type IsUnion<T, B = T> = T extends T
  ? [B] extends [T]
    ? false
    : true
  : never
export type Check<T, U extends any[]> = T extends U[number] ? true : false
export type TupleOf<T = number, N = 1, Acc extends T[] = []> = Acc['length'] extends N
    ? Acc
    : TupleOf<T, N, [T, ...Acc]>;
export type MatrixOf<T = number, N = 1> = TupleOf<TupleOf<T, N>, N>

/* TYPE ERROR MESSAGES */
const error = Symbol()
export type GLSLError<T> = { [error]: T }

/* MISC */
export type UniformSetter =
  | 'uniform1f'
  | 'uniform1i'
  | 'uniform1i'  
  | 'uniform1fv'
  | 'uniform1iv'
  | 'uniform1iv'
  | 'uniform2fv'
  | 'uniform2iv'
  | 'uniform3fv'
  | 'uniform3iv'
  | 'uniform4fv'
  | 'uniform4iv'
  | 'uniformMatrix2fv'
  | 'uniformMatrix3fv'
  | 'uniformMatrix4fv'

export type RenderMode = 'TRIANGLES' | 'LINES' | 'POINTS' | 'TRIANGLE_FAN' | 'TRIANGLE_STRIP' | 'LINE_STRIP' | 'LINE_LOOP'

export type OnRenderFunction = (
  location: WebGLUniformLocation | number,
  fn: () => void
) => () => void

/** VALID TYPED_ARRAY TYPES */
export type Buffer =
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Float32Array
type IntBuffer = Int8Array | Int16Array | Int32Array |  Uint8Array | Uint16Array | Uint32Array

/* GLSL TAG TEMPLATE LITERAL */
export type TemplateValue =
  | ReturnType<ValueOf<AttributeProxy>>
  | ReturnType<ValueOf<UniformProxy>>
  | string
  | Accessor<ShaderToken>

/* VARIABLE: UNIFORM + ATTRIBUTE */
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
  options?: Partial<TTOptions>
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

  vec2: Variable<'uniform', 'vec2', TupleOf<number, 2> | Buffer>
  ivec2: Variable<'uniform', 'ivec2', TupleOf<number, 2> | Buffer>
  bvec2: Variable<'uniform', 'bvec2', TupleOf<number, 2> | Buffer>

  vec3: Variable<'uniform', 'vec3', TupleOf<number, 3> | Buffer>
  ivec3: Variable<'uniform', 'ivec3', TupleOf<number, 3> | Buffer>
  bvec3: Variable<'uniform', 'bvec3', TupleOf<number, 3> | Buffer>

  vec4: Variable<'uniform', 'vec4', TupleOf<number, 4> | Buffer>
  ivec4: Variable<'uniform', 'ivec4', TupleOf<number, 4> | Buffer>
  bvec4: Variable<'uniform', 'bvec4', TupleOf<number, 4> | Buffer>

  mat2: Variable<'uniform', 'mat2', TupleOf<number, 16> | Buffer | mat2>
  mat3: Variable<'uniform', 'mat3', TupleOf<number, 9> | Buffer | mat3>
  mat4: Variable<'uniform', 'mat4', TupleOf<number, 16> | Buffer | mat4>

  sampler2D: Variable<
    'sampler2D',
    'sampler2D',
    ArrayBufferView,
    Sampler2DOptions
  >
  isampler2D: Variable<
    'isampler2D',
    'isampler2D',
    ArrayBufferView,
    Sampler2DOptions
  >
  samplerCube: Variable<
    'samplerCube',
    'samplerCube',
    ArrayBufferView,
    Sampler2DOptions
  >
}
export type UniformParameters = Parameters<UniformProxy[keyof UniformProxy]>
export type UniformReturnType = ReturnType<ValueOf<UniformProxy>>
export type Sampler2DOptions = {
  dataType?: DataType
  width?: number
  height?: number
  type?: 'float' | 'integer'
  format?: Format
  internalFormat?: InternalFormat
  wrapS?: 'CLAMP_TO_EDGE'
  wrapT?: 'CLAMP_TO_EDGE'
  magFilter?: 'NEAREST' | 'LINEAR'
  minFilter?: 'NEAREST' | 'LINEAR'
  border?: number
}



/* ATTRIBUTE */
export type AttributeOptions = {
  stride: number
  offset: number
}
export type AttributeProxy = {
  float: Variable<'attribute', 'float', Buffer, AttributeOptions>
  int: Variable<'attribute', 'int', IntBuffer, AttributeOptions>

  vec2: Variable<'attribute', 'vec2', Buffer, AttributeOptions>
  ivec2: Variable<'attribute', 'ivec2', IntBuffer, AttributeOptions>

  vec3: Variable<'attribute', 'vec3', Buffer, AttributeOptions>
  ivec3: Variable<'attribute', 'ivec3', IntBuffer, AttributeOptions>

  vec4: Variable<'attribute', 'vec4', Buffer, AttributeOptions>
  ivec4: Variable<'attribute', 'ivec4', IntBuffer, AttributeOptions>
}
export type AttributeParameters = Parameters<
  AttributeProxy[keyof AttributeProxy]
>
export type AttributeReturnType = ReturnType<ValueOf<AttributeProxy>>

/* BUFFER */

export type BufferOptions = {
  name?: string
  target:
  | 'ARRAY_BUFFER'
  | 'ELEMENT_ARRAY_BUFFER'
  | 'COPY_READ_BUFFER'
  | 'COPY_WRITE_BUFFER'
  | 'TRANSFORM_FEEDBACK_BUFFER'
  | 'UNIFORM_BUFFER'
  | 'PIXEL_PACK_BUFFER'
  | 'PIXEL_UNPACK_BUFFER'
}

export interface BufferToken  {
  name: string
  value: Buffer
  tokenType: 'buffer',
  options: BufferOptions
}

/* TOKENS */
interface TokenBase {
  dataType: keyof UniformProxy | keyof AttributeProxy
  name: string
}
export interface AttributeToken extends TokenBase {
  tokenType: 'attribute'
  size: number
  options: AttributeOptions
  buffer: BufferToken
}
export interface UniformToken extends TokenBase {
  value: any
  functionName: UniformSetter
  tokenType: 'uniform'
}
export interface Sampler2DToken extends TokenBase {
  value: Buffer
  options: Sampler2DOptions
  textureIndex: number
  tokenType: 'sampler2D' | 'isampler2D'
}
export type ScopedVariableToken = {
  name: string
  tokenType: 'scope'
}
export type ShaderToken = {
  source: {
    code: string
    parts: {
      version: string | undefined
      precision: string
      variables: string
      body: string | undefined
    }
  }
  template: TemplateStringsArray
  tokenType: 'shader'
  bind: (config: {
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    onRender: OnRenderFunction,
    render: () => void
  }) => void
}
export type Token =
  | ShaderToken
  | ScopedVariableToken
  | AttributeToken
  | UniformToken
  | Sampler2DToken


/* WEBGL FORMATS / INTERNAL_FORMATS / DATA_TYPES (ty chatgpt) */
type FormatWebGL = 
  /* General-purpose formats */
  | 'RGBA'                 // RGBA, 8 bits per channel
  | 'RGB'                  // RGB, 8 bits per channel
  | 'ALPHA'                // Alpha channel only, 8 bits
  | 'LUMINANCE'            // Single color channel, 8 bits
  | 'LUMINANCE_ALPHA'      // Luminance (grey) and alpha, 8 bits each

  /* Special-purpose formats */
  | 'DEPTH_COMPONENT'      // Depth component, typically 16 or 24 bits
  | 'DEPTH_STENCIL';       // Depth combined with stencil, 24 bits for depth, 8 for stencil
type FormatWebGL2 = 
  | 'RED'
  | 'RG'
  | 'RED_INTEGER'
  | 'RG_INTEGER'
  | 'RGB_INTEGER'
export type Format = FormatWebGL | FormatWebGL2
type InternalFormatWebGL = 
  /* General-purpose formats */
  | 'RGBA'                 // RGBA, 8 bits per channel
  | 'RGB'                  // RGB, 8 bits per channel
  | 'ALPHA'                // Alpha channel only, 8 bits
  | 'LUMINANCE'            // Single color channel, 8 bits
  | 'LUMINANCE_ALPHA'      // Luminance (grey) and alpha, 8 bits each
  /* Depth and stencil formats */
  | 'DEPTH_COMPONENT'      // Depth component, typically 16 or 24 bits
  | 'DEPTH_STENCIL';       // Depth combined with stencil, 24 bits for depth, 8 for stencil
  // Types for WebGL 2 internal formats with detailed annotations
type InternalFormatWebGL2 =
  /* 8-bit single channel formats */
  | 'R8'             // Normalized unsigned byte red channel format
  | 'R8_SNORM'       // Normalized signed byte red channel format
  | 'R8UI'           // Unsigned integer red channel format
  | 'R8I'            // Signed integer red channel format
  /* 16-bit single channel formats */
  | 'R16UI'          // Unsigned integer 16-bit red channel format
  | 'R16I'           // Signed integer 16-bit red channel format
  | 'R16F'           // Floating point 16-bit red channel format
  /* 32-bit single channel formats */
  | 'R32UI'          // Unsigned integer 32-bit red channel format
  | 'R32I'           // Signed integer 32-bit red channel format
  | 'R32F'           // Floating point 32-bit red channel format
  /* 8-bit dual channel formats */
  | 'RG8'            // Normalized unsigned byte red and green channels format
  | 'RG8_SNORM'      // Normalized signed byte red and green channels format
  | 'RG8UI'          // Unsigned integer red and green channels format
  | 'RG8I'           // Signed integer red and green channels format
  /* 16-bit dual channel formats */
  | 'RG16UI'         // Unsigned integer 16-bit red and green channels format
  | 'RG16I'          // Signed integer 16-bit red and green channels format
  | 'RG16F'          // Floating point 16-bit red and green channels format
  /* 32-bit dual channel formats */
  | 'RG32UI'         // Unsigned integer 32-bit red and green channels format
  | 'RG32I'          // Signed integer 32-bit red and green channels format
  | 'RG32F'          // Floating point 32-bit red and green channels format
  /* 8-bit RGB formats */
  | 'RGB8'           // Normalized unsigned byte RGB format
  | 'SRGB8'          // sRGB color space format
  | 'RGB565'         // Compact RGB format (5 bits red, 6 bits green, 5 bits blue)
  /* High dynamic range and wide gamut formats */
  | 'R11F_G11F_B10F' // Packed floating-point format with shared exponent
  | 'RGB9_E5'        // High dynamic range RGB format with shared exponent
  /* 16-bit RGB formats */
  | 'RGB16F'         // Floating point 16-bit RGB format
  /* 32-bit RGB formats */
  | 'RGB32F'         // Floating point 32-bit RGB format
  /* 8-bit RGBA formats */
  | 'RGBA8'          // Normalized unsigned byte RGBA format
  | 'SRGB8_ALPHA8'   // sRGB color space format with alpha channel
  | 'RGB5_A1'        // Compact RGBA format (5 bits for RGB, 1 bit for alpha)
  | 'RGBA4'          // Compact RGBA format (4 bits per channel)
  /* 16-bit RGBA formats */
  | 'RGBA16F'        // Floating point 16-bit RGBA format
  /* 32-bit RGBA formats */
  | 'RGBA32F'        // Floating point 32-bit RGBA format
  /* Depth and stencil formats */
  | 'DEPTH_COMPONENT16'  // 16-bit depth component format
  | 'DEPTH_COMPONENT24'  // 24-bit depth component format
  | 'DEPTH_COMPONENT32F' // 32-bit floating point depth format
  | 'DEPTH24_STENCIL8'   // Combined 24-bit depth and 8-bit stencil format
  | 'DEPTH32F_STENCIL8'; // Combined 32-bit floating point depth and 8-bit stencil format
export type InternalFormat = InternalFormatWebGL | InternalFormatWebGL2
export type DataType =
  | 'UNSIGNED_BYTE'
  | 'BYTE'
  | 'UNSIGNED_SHORT'
  | 'SHORT'
  | 'UNSIGNED_INT'
  | 'INT'
  | 'FLOAT'
  | 'HALF_FLOAT'

/* createComputation  */
export type Computation = (u_buffer: ReturnType<UniformProxy['sampler2D' ]>) => Accessor<ShaderToken>

/* tuples */

export type Vector2 = TupleOf<number, 2>
export type Vector3 = TupleOf<number, 3>
export type Vector4 = TupleOf<number, 4>