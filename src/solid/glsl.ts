import { type Accessor } from 'solid-js'
import zeptoid from 'zeptoid'

import type {
  Attribute,
  AttributeParameters,
  OnRenderFunction,
  Sampler2DToken,
  ShaderToken,
  Token,
  Uniform,
  UniformParameters,
  UniformSetter,
  ValueOf,
} from '@core/types'
import {
  bindAttributeToken,
  bindSampler2DToken,
  bindUniformToken,
  createScopedVariableToken as createScopedToken,
  createToken,
} from './tokens'

/* UTILITIES */

const dataTypeToFunctionName = (dataType: string) => {
  // TODO: include mat
  if (dataType === 'float') return 'uniform1f'
  if (dataType === 'int') return 'uniform1i'
  if (dataType === 'bool') return 'uniform1i'

  return ('uniform' +
    dataType[dataType.length - 1] +
    (dataType[0] === 'b' ? 'b' : dataType[0] === 'i' ? 'i' : 'f') +
    'v') as UniformSetter
}

const resolveToken = (token: Token) =>
  'source' in token
    ? token.source
    : token.tokenType === 'attribute'
    ? `in ${token.dataType} ${token.name};`
    : token.tokenType === 'uniform'
    ? `uniform ${token.dataType} ${token.name};`
    : ''

const compileStrings = (strings: TemplateStringsArray, variables: Token[]) => {
  const source = [
    ...strings.flatMap((string, index) => {
      const variable = variables[index]
      if (!variable) return string
      return 'name' in variable ? [string, variable.name] : string
    }),
  ].join('')

  const precision = source.match(/precision.*;/)?.[0]
  if (precision) {
    const [pre, after] = source.split(/precision.*;/)
    return [
      pre,
      precision,
      variables.flatMap((variable) => resolveToken(variable)).join('\n'),
      after,
    ].join('\n')
  }
  const version = source.match(/#version.*/)?.[0]
  const [pre, after] = source.split(/#version.*/)
  return [
    version,
    variables.flatMap((variable) => resolveToken(variable)).join('\n'),
    after || pre,
  ].join('\n')
}

/* GLSL TAG TEMPLATE LITERAL */

type Hole =
  | ReturnType<ValueOf<Attribute>>
  | ReturnType<ValueOf<Uniform>>
  | string
  | Accessor<ShaderToken>

let textureIndex = 0
export const glsl =
  (
    strings: TemplateStringsArray,
    // ...values: (ShaderVariable | Accessor<ShaderResult>)[]
    ...holes: Hole[]
  ) =>
  () => {
    // initialize variables
    const scopedVariables = new Map<string, string>()
    const tokens: Token[] = holes
      .map((hole, index) => {
        if (typeof hole === 'function') {
          // if token is a function
          // it is interpret as a glsl-module / Accessor<ShaderResult>
          return hole()
        }
        if (typeof hole === 'string') {
          // if token is a function
          // it is interpret as a scoped variable name
          return createScopedToken(scopedVariables, hole)
        }
        switch (hole.tokenType) {
          case 'attribute':
          case 'uniform':
            return createToken(zeptoid(), hole)
          case 'sampler2D':
            return createToken(zeptoid(), hole, {
              textureIndex: textureIndex++,
            })
        }
      })
      .filter((hole) => hole !== undefined)

    // create shader-source
    const source = compileStrings(strings, tokens).split(/\s\s+/g).join('\n')
    console.log('source', source)

    const bind = (
      gl: WebGL2RenderingContext,
      program: WebGLProgram,
      render: () => void,
      onRender: OnRenderFunction
    ) => {
      tokens.forEach((token) => {
        switch (token.tokenType) {
          case 'shader':
            token.bind(gl, program, render, onRender)
            break
          case 'attribute':
            bindAttributeToken(token, gl, program, render, onRender)
            break
          case 'sampler2D':
            bindSampler2DToken(token as Sampler2DToken, gl, program, render)
            break
          case 'uniform':
            bindUniformToken(token, gl, program, render)
            break
        }
      })
    }
    return { source, bind, tokenType: 'shader' } as ShaderToken
  }

/* VARIABLES: UNIFORM / ATTRIBUTE */

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
