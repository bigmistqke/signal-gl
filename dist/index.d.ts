import { mat2, mat3, mat4 } from 'gl-matrix';
import { JSX, Component, ParentProps, ComponentProps, Setter, Accessor as Accessor$1 } from 'solid-js';

type Accessor<T> = () => T;
type ValueOf<T extends Record<string, any>> = T[keyof T];
type IsUnion<T, B = T> = T extends T ? [B] extends [T] ? false : true : never;
type Check<T, U extends any[]> = T extends U[number] ? true : false;
type TupleOf<T = number, N = 1, Acc extends T[] = []> = Acc['length'] extends N ? Acc : TupleOf<T, N, [T, ...Acc]>;
type MatrixOf<T = number, N = 1> = TupleOf<TupleOf<T, N>, N>;
declare const error: unique symbol;
type GLSLError<T> = {
    [error]: T;
};
type UniformSetter = 'uniform1f' | 'uniform1i' | 'uniform1i' | 'uniform1fv' | 'uniform1iv' | 'uniform1iv' | 'uniform2fv' | 'uniform2iv' | 'uniform3fv' | 'uniform3iv' | 'uniform4fv' | 'uniform4iv' | 'uniformMatrix2fv' | 'uniformMatrix3fv' | 'uniformMatrix4fv';
type RenderMode = 'TRIANGLES' | 'LINES' | 'POINTS' | 'TRIANGLE_FAN' | 'TRIANGLE_STRIP' | 'LINE_STRIP' | 'LINE_LOOP';
type AddToRenderQueue = (location: WebGLUniformLocation | number, fn: () => void) => () => void;
/** VALID TYPED_ARRAY TYPES */
type BufferArray = Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | Float32Array;
type IntBufferArray = Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array;
type TemplateValue = ReturnType<ValueOf<AttributeProxy>> | ReturnType<ValueOf<UniformProxy>> | string | Accessor<ShaderToken>;
type Variable<TTokenType extends string, TDataType extends string, TValueDefault extends any, TTOptionsDefault = unknown> = <const TValue extends TValueDefault, const TTOptions extends TTOptionsDefault>(value: Accessor<TValue> | TValue, options?: Partial<TTOptions>) => {
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
    vec2: Variable<'uniform', 'vec2', TupleOf<number, 2> | BufferArray>;
    ivec2: Variable<'uniform', 'ivec2', TupleOf<number, 2> | BufferArray>;
    bvec2: Variable<'uniform', 'bvec2', TupleOf<number, 2> | BufferArray>;
    vec3: Variable<'uniform', 'vec3', TupleOf<number, 3> | BufferArray>;
    ivec3: Variable<'uniform', 'ivec3', TupleOf<number, 3> | BufferArray>;
    bvec3: Variable<'uniform', 'bvec3', TupleOf<number, 3> | BufferArray>;
    vec4: Variable<'uniform', 'vec4', TupleOf<number, 4> | BufferArray>;
    ivec4: Variable<'uniform', 'ivec4', TupleOf<number, 4> | BufferArray>;
    bvec4: Variable<'uniform', 'bvec4', TupleOf<number, 4> | BufferArray>;
    mat2: Variable<'uniform', 'mat2', TupleOf<number, 16> | BufferArray | mat2>;
    mat3: Variable<'uniform', 'mat3', TupleOf<number, 9> | BufferArray | mat3>;
    mat4: Variable<'uniform', 'mat4', TupleOf<number, 16> | BufferArray | mat4>;
    sampler2D: Variable<'sampler2D', 'sampler2D', ArrayBufferView | GLTexture, Sampler2DOptions>;
    isampler2D: Variable<'isampler2D', 'isampler2D', ArrayBufferView, Sampler2DOptions>;
    samplerCube: Variable<'samplerCube', 'samplerCube', ArrayBufferView, Sampler2DOptions>;
};
type UniformParameters = Parameters<UniformProxy[keyof UniformProxy]>;
type UniformReturnType = ReturnType<ValueOf<UniformProxy>>;
type Sampler2DOptions = TextureOptions & {
    border: number;
    magFilter: 'NEAREST' | 'LINEAR';
    minFilter: 'NEAREST' | 'LINEAR';
    wrapS: 'CLAMP_TO_EDGE';
    wrapT: 'CLAMP_TO_EDGE';
};
type TextureOptions = {
    dataType: DataType;
    format: Format;
    height: number;
    internalFormat: InternalFormat;
    width: number;
};
type AttributeOptions = {
    stride: number;
    offset: number;
};
type AttributeProxy = {
    float: Variable<'attribute', 'float', BufferArray, AttributeOptions>;
    int: Variable<'attribute', 'int', IntBufferArray, AttributeOptions>;
    vec2: Variable<'attribute', 'vec2', BufferArray, AttributeOptions>;
    ivec2: Variable<'attribute', 'ivec2', IntBufferArray, AttributeOptions>;
    vec3: Variable<'attribute', 'vec3', BufferArray, AttributeOptions>;
    ivec3: Variable<'attribute', 'ivec3', IntBufferArray, AttributeOptions>;
    vec4: Variable<'attribute', 'vec4', BufferArray, AttributeOptions>;
    ivec4: Variable<'attribute', 'ivec4', IntBufferArray, AttributeOptions>;
};
type AttributeParameters = Parameters<AttributeProxy[keyof AttributeProxy]>;
type AttributeReturnType = ReturnType<ValueOf<AttributeProxy>>;
type BufferOptions = {
    name?: string;
    target: 'ARRAY_BUFFER' | 'ELEMENT_ARRAY_BUFFER' | 'COPY_READ_BUFFER' | 'COPY_WRITE_BUFFER' | 'TRANSFORM_FEEDBACK_BUFFER' | 'UNIFORM_BUFFER' | 'PIXEL_PACK_BUFFER' | 'PIXEL_UNPACK_BUFFER';
};
interface BufferToken {
    name: string;
    value: BufferArray;
    tokenType: 'buffer';
    options: BufferOptions;
}
interface TokenBase {
    dataType: keyof UniformProxy | keyof AttributeProxy;
    name: string;
}
interface AttributeToken extends TokenBase {
    tokenType: 'attribute';
    size: number;
    options: AttributeOptions;
    buffer: BufferToken;
}
interface UniformToken extends TokenBase {
    value: any;
    functionName: UniformSetter;
    tokenType: 'uniform';
}
interface Sampler2DToken extends TokenBase {
    value: BufferArray;
    options: Sampler2DOptions;
    textureIndex: number;
    tokenType: 'sampler2D' | 'isampler2D';
}
type ScopedVariableToken = {
    name: string;
    tokenType: 'scope';
};
type ShaderToken = {
    bind: (config: {
        gl: WebGL2RenderingContext;
        program: WebGLProgram;
        addToRenderQueue: AddToRenderQueue;
        requestRender: (name: string) => void;
    }) => void;
    name: string;
    source: {
        code: string;
        parts: {
            version: string | undefined;
            precision: string;
            variables: string;
            body: string | undefined;
        };
    };
    template: TemplateStringsArray;
    tokenType: 'shader';
};
type Token = ShaderToken | ScopedVariableToken | AttributeToken | UniformToken | Sampler2DToken;
type FormatWebGL = 'RGBA' | 'RGB' | 'ALPHA' | 'LUMINANCE' | 'LUMINANCE_ALPHA' | 'DEPTH_COMPONENT' | 'DEPTH_STENCIL';
type FormatWebGL2 = 'RED' | 'RG' | 'RED_INTEGER' | 'RG_INTEGER' | 'RGB_INTEGER';
type Format = FormatWebGL | FormatWebGL2;
type InternalFormatWebGL = 'RGBA' | 'RGB' | 'ALPHA' | 'LUMINANCE' | 'LUMINANCE_ALPHA' | 'DEPTH_COMPONENT' | 'DEPTH_STENCIL';
type InternalFormatWebGL2 = 'R8' | 'R8_SNORM' | 'R8UI' | 'R8I' | 'R16UI' | 'R16I' | 'R16F' | 'R32UI' | 'R32I' | 'R32F' | 'RG8' | 'RG8_SNORM' | 'RG8UI' | 'RG8I' | 'RG16UI' | 'RG16I' | 'RG16F' | 'RG32UI' | 'RG32I' | 'RG32F' | 'RGB8' | 'SRGB8' | 'RGB565' | 'R11F_G11F_B10F' | 'RGB9_E5' | 'RGB16F' | 'RGB32F' | 'RGBA8' | 'SRGB8_ALPHA8' | 'RGB5_A1' | 'RGBA4' | 'RGBA16F' | 'RGBA32F' | 'DEPTH_COMPONENT16' | 'DEPTH_COMPONENT24' | 'DEPTH_COMPONENT32F' | 'DEPTH24_STENCIL8' | 'DEPTH32F_STENCIL8';
type InternalFormat = InternalFormatWebGL | InternalFormatWebGL2;
type DataType = 'UNSIGNED_BYTE' | 'BYTE' | 'UNSIGNED_SHORT' | 'SHORT' | 'UNSIGNED_INT' | 'INT' | 'FLOAT' | 'HALF_FLOAT';
type Computation = (u_buffer: ReturnType<UniformProxy['sampler2D']>) => Accessor<ShaderToken>;
type Vector2 = TupleOf<number, 2>;
type Vector3 = TupleOf<number, 3>;
type Vector4 = TupleOf<number, 4>;

type BaseConfig = {
    canvas: HTMLCanvasElement | OffscreenCanvas;
    cacheEnabled?: boolean;
    first?: number;
    /** default TRIANGLES */
    mode?: RenderMode;
    offset?: number;
    onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void;
};
declare class Base {
    gl: WebGL2RenderingContext;
    canvas: HTMLCanvasElement | OffscreenCanvas;
    constructor(config: BaseConfig);
    render(): this;
    clear(): this;
    autosize(onResize?: (token: Base) => void): this;
    read(output: BufferArray, config: Partial<TextureOptions>): BufferArray;
}
type BaseProgramConfig = BaseConfig & {
    fragment: ShaderToken;
    vertex: ShaderToken;
};
type GLProgramConfig = ({
    count: number;
} & BaseProgramConfig) | ({
    indices: number[] | Uint16Array;
} & BaseProgramConfig);
type ProgramInstance = typeof GLProgram;
declare class GLProgram extends Base {
    config: GLProgramConfig;
    program: WebGLProgram;
    constructor(_config: GLProgramConfig);
    renderQueue: Map<WebGLUniformLocation | number, () => void>;
    addToRenderQueue: (location: WebGLUniformLocation | number, fn: () => void) => () => boolean;
    private renderRequestSignal;
    private getRenderRequest;
    private setRenderRequest;
    requestRender: () => void;
    render: () => this;
}
/** Checks if a given value is a `ProgramToken` */
declare const isGLProgram: (value: any) => value is GLProgram;
/** Filters `any` for `ProgramTokens`. Returns `ProgramToken[]` */
declare const filterGLPrograms: (value: any) => GLProgram[];
type GLStackConfig = BaseConfig & {
    programs: GLProgram[];
};
declare class GLStack extends Base {
    config: GLStackConfig;
    get programs(): GLProgram[];
    constructor(config: GLStackConfig);
    render(): this;
}
declare class GLRenderTextureStack extends GLStack {
    texture: GLRenderTexture;
    constructor(config: BaseConfig & {
        programs: GLProgram[];
        color?: boolean;
        depth?: boolean;
    } & Partial<RenderTextureConfig>);
    render(): this;
}
declare class UtilityBase<T> {
    gl: WebGL2RenderingContext;
    config: Partial<T>;
    constructor(gl: WebGL2RenderingContext, config?: Partial<T>);
}
type RenderTextureConfig = RenderBufferConfig & {
    format: Format;
    dataType: DataType;
};
declare class GLTexture extends UtilityBase<RenderBufferConfig & {
    format: Format;
    dataType: DataType;
}> {
    texture: WebGLTexture;
    constructor(gl: WebGL2RenderingContext, config?: Partial<RenderBufferConfig & {
        format: Format;
        dataType: DataType;
    }>);
}
declare class GLRenderTexture extends GLTexture {
    renderBuffer: GLRenderBuffer;
    constructor(gl: WebGL2RenderingContext, config?: Partial<RenderBufferConfig & {
        format: Format;
        dataType: DataType;
    }>);
    activate(): void;
    deactivate(): void;
}
type RenderBufferConfig = {
    internalFormat: InternalFormat;
    width: number;
    height: number;
    color: boolean;
    depth: boolean;
};
declare class GLRenderBuffer extends UtilityBase<RenderBufferConfig> {
    framebuffer: WebGLFramebuffer;
    depthbuffer: WebGLFramebuffer;
    colorbuffer: WebGLRenderbuffer;
    constructor(gl: WebGL2RenderingContext, config?: Partial<RenderBufferConfig>);
    activate(): this;
    deactivate(): void;
}

declare const useSignalGL: () => {
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;
    onRender: (callback: () => void) => () => void;
    onResize: (callback: () => void) => () => void;
} | undefined;
type StackProps = {
    onRender?: () => void;
    onResize?: (token: GLStack) => void;
    onProgramCreate?: () => void;
    clear?: boolean | ((gl: GLStack) => void);
    animate?: boolean | number;
};
type CanvasProps = ComponentProps<'canvas'> & StackProps;
/** Root-element containing `<canvas/>` and `GLStack`. */
declare const Canvas: (props: CanvasProps) => JSX.Element;
interface ProgramPropsBase {
    fragment: ShaderToken;
    onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void;
    ref?: Setter<HTMLCanvasElement>;
    vertex: ShaderToken;
    buffer?: any;
    /**
     * default "TRIANGLES"
     */
    mode?: RenderMode;
    /**
     * @unstable
     * ⚠️ Caching can cause issues when used in combination with dynamic and/or conditional glsl-snippets. Only enable cache when generated source is static. ⚠️
     */
    cacheEnabled?: boolean;
}
interface ArrayProgramProps extends ProgramPropsBase {
    count: number;
}
interface ElementProgramProps extends ProgramPropsBase {
    indices: number[] | Uint16Array;
}
type ProgramProps = ArrayProgramProps | ElementProgramProps;
/** JSX-wrapper around `GLProgram`. */
declare const Program: (props: ProgramProps) => JSX.Element;
/** JSX-wrapper around `GLRenderTextureStack`. */
declare const RenderTexture: Component<ParentProps<StackProps> & {
    onTextureUpdate: (texture: GLRenderTexture) => void;
    passthrough?: boolean;
}>;

type ShouldNotUnion<T> = Check<T, [
    UniformReturnType,
    AttributeReturnType,
    string
]>;
type CheckTemplateValues<T extends any[]> = {
    [K in keyof T]: ShouldNotUnion<T[K]> extends true ? IsUnion<Extract<T[K], any>> extends true ? GLSLError<`unions not allowed in interpolations`> : T[K] : T[K];
};
/**
 * Tag template literal to compose glsl-shaders.
 */
declare const glsl: <T extends TemplateValue[]>(template: TemplateStringsArray, ...holes: CheckTemplateValues<T>) => ShaderToken;
declare const compileStrings: (strings: TemplateStringsArray, tokens: Token[]) => {
    code: string;
    parts: {
        version: string | undefined;
        precision: string;
        variables: string;
        body: string | undefined;
    };
} | {
    code: string;
    parts: {
        version: string | undefined;
        variables: string;
        body: string | undefined;
        precision?: undefined;
    };
};

declare const uniform: UniformProxy;
/**
 * template-helper to inject attribute into `glsl`
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
declare const buffer: (value: BufferArray | Accessor$1<BufferArray>, options: BufferOptions) => BufferToken;

export { type Accessor, type AddToRenderQueue, type AttributeOptions, type AttributeParameters, type AttributeProxy, type AttributeReturnType, type AttributeToken, type BufferArray, type BufferOptions, type BufferToken, Canvas, type Check, type Computation, type DataType, type Format, GLProgram, type GLProgramConfig, GLRenderBuffer, GLRenderTexture, GLRenderTextureStack, type GLSLError, GLStack, GLTexture, type InternalFormat, type IsUnion, type MatrixOf, Program, type ProgramInstance, type RenderMode, RenderTexture, type Sampler2DOptions, type Sampler2DToken, type ScopedVariableToken, type ShaderToken, type TemplateValue, type TextureOptions, type Token, type TupleOf, type UniformParameters, type UniformProxy, type UniformReturnType, type UniformSetter, type UniformToken, type ValueOf, type Vector2, type Vector3, type Vector4, attribute, buffer, compileStrings, filterGLPrograms, glsl, isGLProgram, uniform, useSignalGL };
