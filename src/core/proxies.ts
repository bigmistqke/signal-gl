import type {
  Attribute,
  AttributeParameters,
  Uniform,
  UniformParameters,
} from './types'
import { dataTypeToFunctionName } from './webgl'

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
