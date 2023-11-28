import { type Accessor } from 'solid-js'
import zeptoid from 'zeptoid'
import {
  bindAttributeToken,
  bindSampler2DToken,
  bindUniformToken,
  createScopedVariableToken,
  createToken,
} from './tokens'
import {
  Attribute,
  AttributeParameters,
  OnRenderFunction,
  Sampler2DToken,
  ShaderResult,
  Token,
  Uniform,
  UniformParameters,
  UniformSetter,
  ValueOf,
} from './types'
export * from './GL'

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
  | Accessor<ShaderResult>

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
    const tokens = holes
      .map((hole, index) =>
        typeof hole === 'function'
          ? hole()
          : typeof hole === 'string'
          ? createScopedVariableToken(scopedVariables, hole)
          : hole.tokenType === 'attribute'
          ? createToken(zeptoid(), hole)
          : hole.dataType === 'sampler2D'
          ? createToken(zeptoid(), hole, {
              textureIndex: textureIndex++,
              tokenType: 'sampler2D',
            })
          : hole.tokenType === 'uniform'
          ? createToken(zeptoid(), hole as any)
          : undefined
      )
      .filter((hole) => hole !== undefined) as Token[]

    // create shader-source
    const source = compileStrings(strings, tokens).split(/\s\s+/g).join('\n')
    console.log('source', source)

    const bind = (
      gl: WebGL2RenderingContext,
      program: WebGLProgram,
      render: () => void,
      onRender: OnRenderFunction
    ) =>
      tokens.forEach((token) => {
        if ('bind' in token) {
          token.bind(gl, program, render, onRender)
          return
        }
        if (token.tokenType === 'attribute') {
          bindAttributeToken(token, gl, program, render, onRender)
          return
        }
        if ('dataType' in token && token.dataType === 'sampler2D') {
          bindSampler2DToken(token as Sampler2DToken, gl, program, render)
          return
        }
        if (token.tokenType === 'uniform') {
          bindUniformToken(token, gl, program, render)
        }
      })

    return { source, bind } as ShaderResult
  }

/* VARIABLES: UNIFORM / ATTRIBUTE */

export const uniform = new Proxy({} as Uniform, {
  get(target, dataType) {
    return (...[value, options]: UniformParameters) => ({
      get value() {
        return value()
      },
      functionName: dataTypeToFunctionName(dataType as string),
      dataType,
      tokenType: 'uniform',
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
        get value() {
          return value()
        },
        dataType,
        tokenType: 'attribute',
        options: {
          ...options,
          size: size && !isNaN(size) ? size : 1,
        },
      }
    }
  },
})
