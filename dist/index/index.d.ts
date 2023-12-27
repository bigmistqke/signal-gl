import { T as TemplateValue, S as ShaderToken, a as Token, I as IsUnion, G as GLSLError, C as Check, U as UniformReturnType, A as AttributeReturnType } from '../tokens-9AvW-2wz.js';
export { r as Accessor, w as AddToRenderQueue, E as AttributeOptions, H as AttributeParameters, F as AttributeProxy, L as AttributeToken, B as BufferArray, J as BufferOptions, K as BufferToken, m as Canvas, Z as Computation, Y as DataType, W as Format, c as GLProgram, b as GLProgramConfig, k as GLRenderBuffer, j as GLRenderTexture, g as GLRenderTextureStack, e as GLStack, h as GLTexture, X as InternalFormat, M as MatrixOf, n as Program, P as ProgramInstance, v as RenderMode, R as RenderTexture, z as Sampler2DOptions, O as Sampler2DToken, Q as ScopedVariableToken, l as SignalGLContext, D as TextureOptions, s as TupleOf, y as UniformParameters, x as UniformProxy, t as UniformSetter, N as UniformToken, V as ValueOf, _ as Vector2, $ as Vector3, a0 as Vector4, p as attribute, q as buffer, f as filterGLPrograms, d as filterNonGLPrograms, i as isGLProgram, o as uniform, u as useSignalGL } from '../tokens-9AvW-2wz.js';
import 'solid-js';
import 'gl-matrix';

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

export { AttributeReturnType, Check, GLSLError, IsUnion, ShaderToken, TemplateValue, Token, UniformReturnType, compileStrings, glsl };
