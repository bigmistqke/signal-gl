import type {
  Attribute,
  AttributeParameters,
  Uniform,
  UniformParameters,
} from './types'
import { dataTypeToFunctionName } from './webgl'

/** 
 * @example
 * ```ts
 * const [color] = createSignal([0, 1, 2])
 * glsl`
 *  vec3 color = ${uniform.vec3(color)};
 * `
 * ```
 * */
export const uniform = new Proxy({} as Uniform, {
  get(target, dataType) {
    return (...[value, options]: UniformParameters) => ({
      dataType,
      functionName: dataTypeToFunctionName(dataType as string),
      tokenType: dataType === 'sampler2D' ? 'sampler2D' : 'uniform',
      get value() {
        return value()
      },
      options,
    })
  },
})

/** 
 * @example
 * ```ts
 * const [vertices] = createSignal
 *  new Float32Array([
      -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
    ])
 * )
 * glsl`
 *  vec2 vertices = ${attribute.vec2(vertices)};
 * `
 * ```
 * */
export const attribute = new Proxy({} as Attribute, {
  get(target, dataType) {
    return (...[value, options]: AttributeParameters) => {
      const size =
        typeof dataType === 'string'
          ? +dataType[dataType.length - 1]!
          : undefined
      return {
        dataType,
        tokenType: 'attribute',
        size: size && !isNaN(size) ? size : 1,
        get value() {
          return value()
        },
        options,
      }
    }
  },
})
