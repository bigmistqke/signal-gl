import zeptoid from 'zeptoid'

import type {
  Hole,
  OnRenderFunction,
  Sampler2DToken,
  ShaderToken,
  Token,
} from '@core/types'
import { compileStrings as compileTemplate } from '@core/webgl'
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
  (template: TemplateStringsArray, ...holes: Hole[]) =>
  () => {
    const hasNameCache = nameCache.has(template)
    if (!hasNameCache) nameCache.set(template, [])
    const names = nameCache.get(template)!

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
            (hasNameCache && names[index]) ||
            // check for scoped names
            scopedNames.get(hole) ||
            // create new name
            `${hole}_${zeptoid()}`

          if (!scopedNames.has(hole)) scopedNames.set(hole, name)
          if (!hasNameCache || !names[index]) names[index] = name

          return {
            name,
            tokenType: 'scope',
          }
        }

        const name = (hasNameCache && names[index]) || zeptoid()

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
            bindAttributeToken(token, gl, program, onRender)
            break
          case 'sampler2D':
            bindSampler2DToken(token as Sampler2DToken, gl, program, render)
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
          .split(/\s\s+/g)
          .join('\n')
        DEBUG && console.log('source', source)
        return source
      },
      bind,
      tokenType: 'shader',
      template,
    } as ShaderToken
  }
