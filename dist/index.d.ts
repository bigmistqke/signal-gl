import * as solid_js from 'solid-js';
import { Accessor } from 'solid-js';

type ValueOf<T extends Record<string, any>> = T[keyof T];
type Buffer = Int8Array | Int16Array | Int32Array | Float32Array | Float64Array;
type IntBuffer = Int8Array | Int16Array | Int32Array | Float32Array | Float64Array;
type OnRenderFunction = (fn: () => void) => () => void;
type PrimitiveOptions = {
    type?: 'attribute' | 'uniform' | 'scope';
    name?: string;
};
type Hole = ReturnType<ValueOf<Attribute>> | ReturnType<ValueOf<Uniform>> | string | Accessor<ShaderToken>;
type Variable<TType extends string, TValue extends any, TTOptions = PrimitiveOptions> = (value: Accessor<TValue>, options?: TTOptions) => {
    dataType: TType;
    tokenType: 'uniform' | 'attribute' | 'sampler2D';
    value: Accessor<TValue>;
    options: TTOptions;
};
type Uniform = {
    float: Variable<'float', number>;
    int: Variable<'int', number>;
    bool: Variable<'bool', boolean>;
    vec2: Variable<'vec2', [number, number]>;
    ivec2: Variable<'ivec2', [number, number]>;
    bvec2: Variable<'bvec2', [boolean, boolean]>;
    vec3: Variable<'vec3', [number, number, number]>;
    ivec3: Variable<'ivec3', [number, number, number]>;
    bvec3: Variable<'bvec3', [boolean, boolean, boolean]>;
    vec4: Variable<'vec4', [number, number, number, number]>;
    ivec4: Variable<'ivec4', [number, number, number, number]>;
    bvec4: Variable<'bvec4', [boolean, boolean, boolean, boolean]>;
    sampler2D: Variable<'sampler2D', ArrayBufferView, Sampler2DOptions>;
};
type Sampler2DOptions = PrimitiveOptions & {
    width?: number;
    height?: number;
    type?: 'float' | 'integer';
    format?: 'RGBA' | 'RGB' | 'LUMINANCE';
    magFilter?: 'NEAREST' | 'LINEAR';
    minFilter?: 'NEAREST' | 'LINEAR';
    border?: number;
};
type AttributeOptions = PrimitiveOptions & {
    mode?: 'TRIANGLES' | 'POINTS' | 'LINES';
    target?: 'ARRAY_BUFFER' | 'ELEMENT_ARRAY_BUFFER' | 'COPY_READ_BUFFER' | 'COPY_WRITE_BUFFER' | 'TRANSFORM_FEEDBACK_BUFFER' | 'UNIFORM_BUFFER' | 'PIXEL_PACK_BUFFER' | 'PIXEL_UNPACK_BUFFER';
};
type Attribute = {
    float: Variable<'float', Buffer, AttributeOptions>;
    int: Variable<'int', IntBuffer, AttributeOptions>;
    bool: Variable<'bool', IntBuffer, AttributeOptions>;
    vec2: Variable<'vec2', Buffer, AttributeOptions>;
    ivec2: Variable<'ivec2', IntBuffer, AttributeOptions>;
    bvec2: Variable<'bvec2', IntBuffer, AttributeOptions>;
    vec3: Variable<'vec3', Buffer, AttributeOptions>;
    ivec3: Variable<'ivec3', IntBuffer, AttributeOptions>;
    bvec3: Variable<'bvec3', IntBuffer, AttributeOptions>;
    vec4: Variable<'vec4', Buffer, AttributeOptions>;
    ivec4: Variable<'ivec4', IntBuffer, AttributeOptions>;
    bvec4: Variable<'bvec4', IntBuffer, AttributeOptions>;
};
type ShaderToken = {
    tokenType: 'shader';
    source: string;
    bind: (gl: WebGL2RenderingContext, program: WebGLProgram, render: () => void, onRender: OnRenderFunction) => void;
};

declare const uniform: Uniform;
declare const attribute: Attribute;

declare const GL: (props: solid_js.JSX.CanvasHTMLAttributes<HTMLCanvasElement> & {
    fragment: Accessor<ShaderToken>;
    vertex: Accessor<ShaderToken>;
    onRender?: ((gl: WebGL2RenderingContext, program: WebGLProgram) => void) | undefined;
    onInit?: ((gl: WebGL2RenderingContext, program: WebGLProgram) => void) | undefined;
    animate?: boolean | undefined;
}) => solid_js.JSX.Element;
declare const Program: (props: {
    fragment: Accessor<ShaderToken>;
    vertex: Accessor<ShaderToken>;
    onRender?: ((gl: WebGL2RenderingContext, program: WebGLProgram) => void) | undefined;
    onInit?: ((gl: WebGL2RenderingContext, program: WebGLProgram) => void) | undefined;
}) => void;

declare const glsl: (strings: TemplateStringsArray, ...holes: Hole[]) => () => ShaderToken;

export { GL, Program, attribute, glsl, uniform };
