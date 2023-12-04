import zeptoid from 'zeptoid'

import { dataTypeToFunctionName } from './compilation'
import type {
  AttributeParameters,
  AttributeProxy,
  UniformParameters,
  UniformProxy,
} from './types'

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
