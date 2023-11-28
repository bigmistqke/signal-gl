import { type Accessor } from 'solid-js'
import zeptoid from 'zeptoid'
import {
  AttributeToken,
  Sampler2DToken,
  ScopedVariableToken,
  UniformToken,
  bindAttributeToken,
  bindSampler2DToken,
  bindUniformToken,
  createAttributeToken,
  createSampler2DToken,
  createScopedVariableToken,
  createUniformToken,
} from './tokens'
import { Attribute, OnRenderFunction, ShaderResult, Uniform } from './types'
export * from './GL'

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

type Hole =
  | ReturnType<(typeof attribute)[keyof typeof attribute]>
  | ReturnType<(typeof uniform)[keyof typeof uniform]>
  | string
  | Accessor<ShaderResult>

type Token =
  | ShaderResult
  | ScopedVariableToken
  | AttributeToken
  | UniformToken
  | Sampler2DToken

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
          ? createScopedVariableToken(hole, scopedVariables)
          : hole.tokenType === 'attribute'
          ? createAttributeToken(zeptoid(), hole as any)
          : hole.dataType === 'sampler2D'
          ? createSampler2DToken(zeptoid(), hole)
          : hole.tokenType === 'uniform'
          ? createUniformToken(zeptoid(), hole as any)
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
        if ('type' in token && token.dataType === 'sampler2D') {
          bindSampler2DToken(
            token as ReturnType<typeof createSampler2DToken>,
            gl,
            program,
            render
          )
          return
        }
        if (token.tokenType === 'uniform') {
          bindUniformToken(token, gl, program, render)
        }
      })

    return { source, bind } as ShaderResult
  }

export const uniform = new Proxy({} as Uniform, {
  get(target, dataType) {
    return (...[value, options]: Parameters<Uniform[keyof Uniform]>) => ({
      get value() {
        return value()
      },
      dataType,
      tokenType: 'uniform',
      options,
    })
  },
})

export const attribute = new Proxy({} as Attribute, {
  get(target, dataType) {
    return (...[value, options]: Parameters<Attribute[keyof Attribute]>) => {
      const size =
        typeof dataType === 'string'
          ? +dataType[dataType.length - 1]
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
