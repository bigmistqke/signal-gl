import zeptoid from 'zeptoid'

import { compileStrings as compileTemplate } from '@core/compilation'
import type {
  AttributeReturnType,
  Check as Extends,
  GLSLError,
  IsUnion,
  OnRenderFunction,
  ShaderToken,
  TemplateValue,
  Token,
  UniformReturnType,
} from '@core/types'
import {
  bindAttributeToken,
  bindSampler2DToken,
  bindUniformToken,
  createToken,
} from './tokens'

const DEBUG = false //import.meta.env.DEV
const nameCacheMap = new WeakMap<TemplateStringsArray, string[]>()
let textureIndex = 0

/**
 *  RULES
 *    1. `uniforms, attributes and scoped variable names (strings) can not be unions`
 *        this way we prevent multiple instances of the same glsl-snippet to have mismatched configurations
 *        which could cause issues in cached mode
 * */

type ShouldNotUnion<T> = Extends<
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
 * pass effect from signal implementation
 */
export const createGlsl =
  (effect: (cb: () => void) => void) =>
  <T extends TemplateValue[]>(
    template: TemplateStringsArray,
    ...holes: CheckTemplateValues<T>
  ) =>
  () => {
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
      onRender: OnRenderFunction
    ) => {
      gl.useProgram(program)

      tokens.forEach((token) => {
        switch (token.tokenType) {
          case 'attribute':
            bindAttributeToken(token, gl, program, onRender)
            break
          case 'sampler2D':
            bindSampler2DToken(token, gl, program, effect)
            break
          case 'shader':
            token.bind(gl, program, onRender)
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
