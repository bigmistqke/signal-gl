import zeptoid from 'zeptoid'

import type {
  Hole,
  OnRenderFunction,
  Sampler2DToken,
  ShaderToken,
  Token,
} from '@core/types'
import { compileStrings } from '@core/webgl'
import {
  bindAttributeToken,
  bindSampler2DToken,
  bindUniformToken,
  createToken,
} from './tokens'

const DEBUG = import.meta.env.DEV

const nameCache = new WeakMap<TemplateStringsArray, string[]>()

let textureIndex = 0
export const glsl =
  (
    strings: TemplateStringsArray,
    // ...values: (ShaderVariable | Accessor<ShaderResult>)[]
    ...holes: Hole[]
  ) =>
  () => {
    const hasNameCache = nameCache.has(strings)
    if (!hasNameCache) nameCache.set(strings, [])
    const names = nameCache.get(strings)!

    // initialize variables
    const scopedVariableNames = new Map<string, string>()
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
          const name = hasNameCache
            ? names[index]!
            : scopedVariableNames.get(hole) || `${hole}_${zeptoid()}`

          if (!scopedVariableNames.has(hole))
            scopedVariableNames.set(hole, name)
          if (!hasNameCache) names[index] = name

          return {
            name,
            tokenType: 'scope',
          }
        }

        const name = hasNameCache ? names[index]! : zeptoid()

        // if the same TemplateStringsArray has been compiled before
        // we try to follow the same
        if (!hasNameCache) names[index] = name

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

    // create shader-source
    const source = compileStrings(strings, tokens).split(/\s\s+/g).join('\n')

    DEBUG && console.log('source', source)

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
            bindUniformToken(token, gl, program, render, onRender)
            break
        }
      })
    }
    return { source, bind, tokenType: 'shader', strings } as ShaderToken
  }
