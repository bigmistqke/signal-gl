import {
  AttributeParameters,
  AttributeProxy,
  AttributeToken,
  BufferArray,
  BufferOptions,
  BufferToken,
  UniformParameters,
  UniformProxy,
  UniformSetter,
} from '@core/types'
import { Accessor, mergeProps } from 'solid-js'
import zeptoid from 'zeptoid'

/* 
  TEMPLATE-HELPERS 
*/
const dataTypeToFunctionName = (dataType: string): UniformSetter => {
  switch (dataType) {
    case 'float':
      return 'uniform1f'
    case 'int':
    case 'bool':
      return 'uniform1i'
    default:
      if (dataType.includes('mat')) {
      }
      // 2 | 3 | 4
      const count = dataType[dataType.length - 1] as any as 2 | 3 | 4
      if (dataType.includes('mat')) return `uniformMatrix${count}fv`
      //  i | f
      const type = dataType[0] === 'b' || dataType[0] === 'i' ? 'i' : 'f'
      return `uniform${count}${type}v`
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
let textureIndex = 0
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
      textureIndex: textureIndex++,
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
  get(target, dataType: keyof AttributeProxy) {
    return (...[value, _options]: AttributeParameters): AttributeToken => {
      const options = mergeProps({ stride: 0, offset: 0 }, _options)
      const size =
        typeof dataType === 'string'
          ? +dataType[dataType.length - 1]!
          : undefined
      return {
        buffer: buffer(value, { target: 'ARRAY_BUFFER' }),
        dataType,
        name: 'a_' + zeptoid(),
        options,
        size: size && !isNaN(size) ? size : 1,
        tokenType: 'attribute',
      }
    }
  },
})

export const buffer = (
  value: BufferArray | Accessor<BufferArray>,
  options: BufferOptions
): BufferToken => ({
  name: options.name || zeptoid(),
  tokenType: 'buffer',
  get value() {
    return typeof value === 'function' ? value() : value
  },
  options,
})
