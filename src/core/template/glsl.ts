import { mergeProps } from 'solid-js'
import zeptoid from 'zeptoid'

import type {
  AttributeProxy,
  AttributeReturnType,
  Check,
  GLSLError,
  IsUnion,
  OnRenderFunction,
  ShaderToken,
  TemplateValue,
  Token,
  UniformProxy,
  UniformReturnType,
  ValueOf,
} from '../types'
import {
  bindAttributeToken,
  bindSampler2DToken,
  bindUniformToken,
} from './bindings'

const DEBUG = import.meta.env.DEV
const nameCacheMap = new WeakMap<TemplateStringsArray, string[]>()
let textureIndex = 0

const createToken = <
  TConfig extends ReturnType<ValueOf<UniformProxy> | ValueOf<AttributeProxy>>,
  TOther extends Record<string, any>
>(
  name: number | string,
  config: TConfig,
  other?: TOther
) => mergeProps(config, { name }, other)

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

    const bind = ({
      gl,
      program,
      onRender,
      render,
    }: {
      gl: WebGL2RenderingContext
      program: WebGLProgram
      onRender: OnRenderFunction
      render: () => void
    }) => {
      gl.useProgram(program)

      tokens.forEach((token) => {
        switch (token.tokenType) {
          case 'attribute':
            return bindAttributeToken({
              token,
              gl,
              program,
              onRender,
              effect: glsl.effect,
              render,
            })
          case 'sampler2D':
          case 'isampler2D':
            return bindSampler2DToken({
              token,
              gl,
              program,
              onRender,
              effect: glsl.effect,
              render,
            })
          case 'shader':
            return token.bind({ gl, program, onRender, render })
          case 'uniform':
            return bindUniformToken({ token, gl, program, onRender })
        }
      })
    }
    return {
      get source() {
        const source = compileStrings(template, tokens)
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
  COMPILATION BY SIGNAL-GL 
*/
const tokenToString = (token: Token) => {
  switch (token.tokenType) {
    case 'shader':
      return token.source.parts.variables
    case 'attribute':
      return `in ${token.dataType} ${token.name};`
    case 'uniform':
    case 'sampler2D':
      return `uniform ${token.dataType} ${token.name};`
    case 'isampler2D':
      return `uniform highp ${token.dataType} ${token.name};`
  }
}
export const compileStrings = (
  strings: TemplateStringsArray,
  tokens: Token[]
) => {
  const code = [
    ...strings.flatMap((string, index) => {
      const variable = tokens[index]
      if (variable) {
        if (variable.tokenType === 'shader')
          return [string, variable.source.parts.body]
      }
      if (!variable || !('name' in variable)) return string
      return [string, variable.name]
    }),
  ].join('')
  const variables = Array.from(new Set(tokens.flatMap(tokenToString))).join(
    '\n'
  )

  const precision = code.match(/precision.*;/)?.[0]
  if (precision) {
    const [version, body] = code.split(/precision.*;/)
    return {
      code: [version, precision, variables, body].join('\n'),
      parts: {
        version,
        precision,
        variables,
        body,
      },
    }
  }
  const version = code.match(/#version.*/)?.[0]
  const [pre, after] = code.split(/#version.*/)
  const body = after || pre
  return {
    code: [version, variables, body].join('\n'),
    parts: {
      version,
      variables,
      body,
    },
  }
}
