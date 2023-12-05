import zeptoid from 'zeptoid'

import { compileStrings as compileTemplate } from './compilation'
import {
  bindAttributeToken,
  bindSampler2DToken,
  bindUniformToken,
  createToken,
} from './tokens'
import type {
  AttributeParameters,
  AttributeProxy,
  AttributeReturnType,
  Check,
  GLSLError,
  IsUnion,
  OnRenderFunction,
  ShaderToken,
  TemplateValue,
  Token,
  UniformParameters,
  UniformProxy,
  UniformReturnType,
  UniformSetter,
} from './types'

const DEBUG = false //import.meta.env.DEV
const nameCacheMap = new WeakMap<TemplateStringsArray, string[]>()
let textureIndex = 0

/* 
  GLSL TAG TEMPLATE LITERAL 
*/
/* 
  ADDITIONAL TYPE RULES
    1. `uniforms, attributes and scoped variable names (strings) can not be unions`
        this way we prevent multiple instances of the same glsl-snippet to have mismatched configurations
        which could cause issues in cached mode
 */
type ShouldNotUnion<T> = Check<
  T,
  [UniformReturnType, AttributeReturnType, string]
>
type CheckTemplateValues<T extends any[]> = {
  [K in keyof T]: ShouldNotUnion<T[K]> extends true
    ? IsUnion<Extract<T[K], any>> extends true
      ? GLSLError<`unions not allowed in interpolations`>
      : T[K]
    : T[K]
}
/**
 * Tag template literal to compose glsl-shaders.
 */
export const glsl = function <T extends TemplateValue[]>(
  template: TemplateStringsArray,
  ...holes: CheckTemplateValues<T>
) {
  return () => {
    const hasNameCache = nameCacheMap.has(template)
    if (!hasNameCache) nameCacheMap.set(template, [])
    const nameCache = nameCacheMap.get(template)!

    const scopedNames = new Map<string, string>()
    const tokens = holes
      .map((hole, index) => {
        if (typeof hole === 'function') {
          // if token is a function
          // it is interpret as a glsl-module / Accessor<ShaderResult>
          return hole()
        }

        if (typeof hole === 'string') {
          // if token is a function
          // it is interpret as a scoped variable name
          const name =
            // check for cache
            (hasNameCache && nameCache[index]) ||
            // check for scoped names
            scopedNames.get(hole) ||
            // create new name
            `${hole}_${zeptoid()}`

          if (!scopedNames.has(hole)) scopedNames.set(hole, name)
          if (!hasNameCache || !nameCache[index]) nameCache[index] = name

          return {
            name,
            tokenType: 'scope',
          }
        }

        // generate name if cache is disabled or it's not included in
        const name = (hasNameCache && nameCache[index]) || hole.name

        if (!hasNameCache) nameCache[index] = name

        if (DEBUG && !name) {
          console.error('id was not found for hole:', hole, 'with index', index)
        }

        switch (hole.tokenType) {
          case 'attribute':
          case 'uniform':
            return createToken(name, hole)
          case 'isampler2D':
          case 'sampler2D':
            return createToken(name, hole, {
              textureIndex: textureIndex++,
            })
        }
      })
      .filter((hole) => hole !== undefined) as Token[]

    const bind = (
      gl: WebGL2RenderingContext,
      program: WebGLProgram,
      onRender: OnRenderFunction,
      render: () => void
    ) => {
      gl.useProgram(program)

      tokens.forEach((token) => {
        switch (token.tokenType) {
          case 'attribute':
            bindAttributeToken(token, gl, program, onRender)
            break
          case 'sampler2D':
          case 'isampler2D':
            bindSampler2DToken(token, gl, program, onRender, glsl.effect)
            break
          case 'shader':
            token.bind(gl, program, onRender, render)
            break
          case 'uniform':
            bindUniformToken(token, gl, program, onRender)
            break
        }
      })
    }
    return {
      get source() {
        const source = compileTemplate(template, tokens)
        DEBUG && console.log('source', source.code)
        return source
      },
      bind,
      tokenType: 'shader',
      template,
    } as ShaderToken
  }
}
/** Stubbed effect. Overwrite this value to create bindings for other signal-implementations. */
glsl.effect = (cb: () => void) => {}

/* 
  TEMPLATE-HELPERS 
*/
const dataTypeToFunctionName = (dataType: string) => {
  switch (dataType) {
    case 'float':
      return 'uniform1f'
    case 'int':
    case 'bool':
      return 'uniform1i'
    default:
      return ('uniform' +
        // 1 | 2 | 3 | 4
        dataType[dataType.length - 1] +
        // b | i | f
        (dataType[0] === 'b' || dataType[0] === 'i' ? dataType[0] : 'f') +
        // v
        'v') as UniformSetter
  }
}
/**
 * template-helper to inject uniform into `glsl`
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
export const uniform = new Proxy({} as UniformProxy, {
  get(target, dataType) {
    return (...[value, options]: UniformParameters) => ({
      dataType,
      name: 'u_' + zeptoid(),
      functionName: dataTypeToFunctionName(dataType as string),
      tokenType:
        dataType === 'sampler2D'
          ? 'sampler2D'
          : dataType === 'isampler2D'
          ? 'isampler2D'
          : 'uniform',
      get value() {
        return typeof value === 'function' ? value() : value
      },
      options,
    })
  },
})
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
export const attribute = new Proxy({} as AttributeProxy, {
  get(target, dataType) {
    return (...[value, options]: AttributeParameters) => {
      const size =
        typeof dataType === 'string'
          ? +dataType[dataType.length - 1]!
          : undefined
      return {
        dataType,
        name: 'a_' + zeptoid(),
        tokenType: 'attribute',
        size: size && !isNaN(size) ? size : 1,
        get value() {
          return typeof value === 'function' ? value() : value
        },
        options,
      }
    }
  },
})
