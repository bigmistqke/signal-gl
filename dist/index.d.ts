import * as solid_js from 'solid-js';
import { ComponentProps, Accessor as Accessor$1 } from 'solid-js';

type Accessor<T> = () => T;
type ValueOf<T extends Record<string, any>> = T[keyof T];
type IsUnion<T, B = T> = T extends T ? [B] extends [T] ? false : true : never;
type Check<T, U extends any[]> = T extends U[number] ? true : false;
declare const error: unique symbol;
type GLSLError<T> = {
    [error]: T;
};
type UniformSetter = 'uniform1f' | 'uniform1i' | 'uniform2fv' | 'uniform2iv' | 'uniform3fv' | 'uniform3iv' | 'uniform4fv' | 'uniform4iv';
/** valid TypedArray-types */
type Buffer = Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | Float32Array;
type IntBuffer = Int8Array | Int16Array | Int32Array;
type OnRenderFunction = (location: WebGLUniformLocation | number, fn: () => void) => () => void;
type PrimitiveOptions = {
    name?: string;
};
type TemplateValue = ReturnType<ValueOf<AttributeProxy>> | ReturnType<ValueOf<UniformProxy>> | string | Accessor<ShaderToken>;
type Variable<TTokenType extends string, TDataType extends string, TValueDefault extends any, TTOptionsDefault = unknown> = <const TValue extends TValueDefault, const TTOptions extends TTOptionsDefault>(value: Accessor<TValue> | TValue, options?: TTOptions) => {
    name: string;
    dataType: TDataType;
    tokenType: TTokenType;
    value: TValue;
    options: TTOptions;
};
type UniformProxy = {
    float: Variable<'uniform', 'float', number>;
    int: Variable<'uniform', 'int', number>;
    bool: Variable<'uniform', 'bool', boolean>;
    vec2: Variable<'uniform', 'vec2', [number, number]>;
    ivec2: Variable<'uniform', 'ivec2', [number, number]>;
    bvec2: Variable<'uniform', 'bvec2', [boolean, boolean]>;
    vec3: Variable<'uniform', 'vec3', [number, number, number]>;
    ivec3: Variable<'uniform', 'ivec3', [number, number, number]>;
    bvec3: Variable<'uniform', 'bvec3', [boolean, boolean, boolean]>;
    vec4: Variable<'uniform', 'vec4', [number, number, number, number]>;
    ivec4: Variable<'uniform', 'ivec4', [number, number, number, number]>;
    bvec4: Variable<'uniform', 'bvec4', [boolean, boolean, boolean, boolean]>;
    sampler2D: Variable<'sampler2D', 'sampler2D', ArrayBufferView, Sampler2DOptions>;
    isampler2D: Variable<'isampler2D', 'isampler2D', ArrayBufferView, Sampler2DOptions>;
};
type UniformParameters = Parameters<UniformProxy[keyof UniformProxy]>;
type UniformReturnType = ReturnType<ValueOf<UniformProxy>>;
type Sampler2DOptions = PrimitiveOptions & {
    dataType?: DataType;
    width?: number;
    height?: number;
    type?: 'float' | 'integer';
    format?: Format;
    internalFormat?: InternalFormat;
    wrapS?: 'CLAMP_TO_EDGE';
    wrapT?: 'CLAMP_TO_EDGE';
    magFilter?: 'NEAREST' | 'LINEAR';
    minFilter?: 'NEAREST' | 'LINEAR';
    border?: number;
};
type AttributeOptions = PrimitiveOptions & {
    target?: 'ARRAY_BUFFER' | 'ELEMENT_ARRAY_BUFFER' | 'COPY_READ_BUFFER' | 'COPY_WRITE_BUFFER' | 'TRANSFORM_FEEDBACK_BUFFER' | 'UNIFORM_BUFFER' | 'PIXEL_PACK_BUFFER' | 'PIXEL_UNPACK_BUFFER';
};
type AttributeProxy = {
    float: Variable<'attribute', 'float', Buffer, AttributeOptions>;
    int: Variable<'attribute', 'int', IntBuffer, AttributeOptions>;
    bool: Variable<'attribute', 'bool', IntBuffer, AttributeOptions>;
    vec2: Variable<'attribute', 'vec2', Buffer, AttributeOptions>;
    ivec2: Variable<'attribute', 'ivec2', IntBuffer, AttributeOptions>;
    bvec2: Variable<'attribute', 'bvec2', IntBuffer, AttributeOptions>;
    vec3: Variable<'attribute', 'vec3', Buffer, AttributeOptions>;
    ivec3: Variable<'attribute', 'ivec3', IntBuffer, AttributeOptions>;
    bvec3: Variable<'attribute', 'bvec3', IntBuffer, AttributeOptions>;
    vec4: Variable<'attribute', 'vec4', Buffer, AttributeOptions>;
    ivec4: Variable<'attribute', 'ivec4', IntBuffer, AttributeOptions>;
    bvec4: Variable<'attribute', 'bvec4', IntBuffer, AttributeOptions>;
};
type AttributeParameters = Parameters<AttributeProxy[keyof AttributeProxy]>;
type AttributeReturnType = ReturnType<ValueOf<AttributeProxy>>;
type ShaderToken = {
    source: {
        code: string;
        split: {
            version: string | undefined;
            precision: string;
            variables: string;
            body: string | undefined;
        };
    };
    template: TemplateStringsArray;
    tokenType: 'shader';
    bind: (gl: WebGL2RenderingContext, program: WebGLProgram, onRender: OnRenderFunction) => void;
};
interface TokenBase {
    dataType: keyof UniformProxy | keyof AttributeProxy;
    options: PrimitiveOptions;
    name: string;
    value: any;
}
interface AttributeToken extends TokenBase {
    size: number;
    tokenType: 'attribute';
    options: AttributeOptions;
}
interface UniformToken extends TokenBase {
    functionName: UniformSetter;
    tokenType: 'uniform';
}
interface Sampler2DToken extends TokenBase {
    options: Sampler2DOptions;
    textureIndex: number;
    tokenType: 'sampler2D' | 'isampler2D';
}
type ScopedVariableToken = {
    name: string;
    tokenType: 'scope';
};
type Token = ShaderToken | ScopedVariableToken | AttributeToken | UniformToken | Sampler2DToken;
type FormatWebGL = 'RGBA' | 'RGB' | 'ALPHA' | 'LUMINANCE' | 'LUMINANCE_ALPHA' | 'DEPTH_COMPONENT' | 'DEPTH_STENCIL';
type FormatWebGL2 = 'RED' | 'RG' | 'RED_INTEGER' | 'RG_INTEGER' | 'RGB_INTEGER';
type Format = FormatWebGL | FormatWebGL2;
type InternalFormatWebGL = 'RGBA' | 'RGB' | 'ALPHA' | 'LUMINANCE' | 'LUMINANCE_ALPHA' | 'DEPTH_COMPONENT' | 'DEPTH_STENCIL';
type InternalFormatWebGL2 = 'R8' | 'R8_SNORM' | 'R8UI' | 'R8I' | 'R16UI' | 'R16I' | 'R16F' | 'R32UI' | 'R32I' | 'R32F' | 'RG8' | 'RG8_SNORM' | 'RG8UI' | 'RG8I' | 'RG16UI' | 'RG16I' | 'RG16F' | 'RG32UI' | 'RG32I' | 'RG32F' | 'RGB8' | 'SRGB8' | 'RGB565' | 'R11F_G11F_B10F' | 'RGB9_E5' | 'RGB16F' | 'RGB32F' | 'RGBA8' | 'SRGB8_ALPHA8' | 'RGB5_A1' | 'RGBA4' | 'RGBA16F' | 'RGBA32F' | 'DEPTH_COMPONENT16' | 'DEPTH_COMPONENT24' | 'DEPTH_COMPONENT32F' | 'DEPTH24_STENCIL8' | 'DEPTH32F_STENCIL8';
type InternalFormat = InternalFormatWebGL | InternalFormatWebGL2;
type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array;
type DataType = 'UNSIGNED_BYTE' | 'BYTE' | 'UNSIGNED_SHORT' | 'SHORT' | 'UNSIGNED_INT' | 'INT' | 'FLOAT' | 'HALF_FLOAT';
type ComputeShader = (u_buffer: ReturnType<UniformProxy['sampler2D']>) => Accessor<ShaderToken>;

/**
 * @example
 *
 * ```ts
 * // dynamic
 * const [color] = createSignal([0, 1, 2])
 * glsl`
 *  vec3 color = ${uniform.vec3(color)};
 * `
 * // static
 * glsl`
 *  vec3 color = ${uniform.vec3([0, 1, 2])};
 * `
 * ```
 * */
declare const uniform: UniformProxy;
/**
 * @example
 * ```ts
 * // dynamic
 * const [vertices] = createSignal
 *  new Float32Array([
      -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
    ])
 * )
 * glsl`
 *  vec2 vertices = ${attribute.vec2(vertices)};
 * `
 *
 * // static
 * glsl`
 *  vec2 vertices = ${attribute.vec2(new Float32Array([
      -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
    ]))};
 * `
 * ```
 * */
declare const attribute: AttributeProxy;

/** */
type GLConfig = {
    canvas: HTMLCanvasElement;
    programs: ReturnType<typeof createProgram>[];
    autoResize?: boolean;
    extensions?: {
        /** default true */
        float?: boolean;
        /** default false */
        half_float?: boolean;
    };
};
type GLReadConfig = {
    width?: number;
    height?: number;
    internalFormat?: InternalFormat;
    format?: Format;
    dataType?: DataType;
};
declare const createGL: (config: GLConfig) => {
    render: () => void;
    read: (results: Buffer, _config?: GLReadConfig) => Buffer;
};
declare const createProgram: (config: {
    canvas: HTMLCanvasElement;
    vertex: ShaderToken;
    fragment: ShaderToken;
    onRender?: ((gl: WebGL2RenderingContext, program: WebGLProgram) => void) | undefined;
    mode: 'TRIANGLES' | 'LINES' | 'POINTS';
    cacheEnabled?: boolean | undefined;
    count: number;
}) => {
    render: () => void;
} | undefined;

type GLProps = ComponentProps<'canvas'> & {
    onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void;
    onProgramCreate?: () => void;
    onInit?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void;
    animate?: boolean;
};
declare const GL: (props: GLProps) => solid_js.JSX.Element;
type ProgramProps = {
    count: number;
    fragment: Accessor$1<ShaderToken>;
    vertex: Accessor$1<ShaderToken>;
    onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void;
    onInit?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void;
    mode: 'TRIANGLES' | 'POINTS' | 'LINES';
    /**
     * @unstable
     * ⚠️ Caching can cause issues when used in combination with dynamic and/or conditional glsl-snippets. Only enable cache when generated source is static. ⚠️
     */
    cacheEnabled?: boolean;
};
declare const Program: (props: ProgramProps) => solid_js.JSX.Element;

type ComputationConfig = {
    /** _Uint8Array_ `UNSIGNED_BYTE` _Float32Array_ `FLOAT` _default_ `FLOAT` */
    dataType?: DataType;
    /** _default_ input.length */
    width?: number;
    /** _default_ 1 */
    height?: number;
    /**  _Uint8Array_ `R8` _Float32Array_ `R32F` _default_ `R32F` */
    internalFormat?: InternalFormat;
    /** _Uint8Array_ `RED` _Float32Array_ `RED` _default_ `RED` */
    format?: Format;
};
/**
 * currently fully supported: `Uint8Array` and `Float32Array`
 * @param input _required_ () => Buffer
 * @param callback _required_ glsl-lambda: expects a `vec2` to be returned
 * @param config _optional_
 * @param config.width _default_ input.length
 * @param config.height _default_ 1
 * @param config.dataType _Uint8Array_ `UNSIGNED_BYTE` _Float32Array_ `FLOAT` _default_ `FLOAT`
 * @param config.format _Uint8Array_ `RED` _Float32Array_ `RED` _default_ `RED`
 * @param config.internalFormat _Uint8Array_ `R8` _Float32Array_ `R32F` _default_ `R32F`
 * @returns TBuffer
 */
declare const createComputation: <TBuffer extends Buffer>(input: Accessor$1<TBuffer>, callback: (uniform: ReturnType<UniformProxy['sampler2D']>) => Accessor$1<ShaderToken>, config?: ComputationConfig) => () => Buffer;

declare const glsl: <T extends TemplateValue[]>(template: TemplateStringsArray, ...holes: { [K in keyof T]: Check<T[K], [UniformReturnType, AttributeReturnType, string]> extends true ? IsUnion<Extract<T[K], any>, Extract<T[K], any>> extends true ? GLSLError<"unions not allowed in interpolations"> : T[K] : T[K]; }) => () => ShaderToken;

export { type AttributeOptions, type AttributeParameters, type AttributeProxy, type AttributeReturnType, type AttributeToken, type Buffer, type Check, type ComputeShader, type DataType, type Format, GL, type GLSLError, type InternalFormat, type IsUnion, type OnRenderFunction, type PrimitiveOptions, Program, type Sampler2DOptions, type Sampler2DToken, type ScopedVariableToken, type ShaderToken, type TemplateValue, type Token, type TypedArray, type UniformParameters, type UniformProxy, type UniformReturnType, type UniformSetter, type UniformToken, type ValueOf, attribute, createComputation, createGL, createProgram, glsl, uniform };
