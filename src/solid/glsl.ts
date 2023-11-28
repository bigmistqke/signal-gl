import zeptoid from 'zeptoid'

import type {
  Hole,
  OnRenderFunction,
  Sampler2DToken,
  ScopedVariableToken,
  ShaderToken,
  Token,
} from '@core/types'
import { compileStrings } from '@core/webgl'
import {
  bindAttributeToken,
  bindSampler2DToken,
  bindUniformToken,
  createScopedToken,
  createToken,
} from './tokens'

const DEBUG = false

let textureIndex = 0
export const glsl =
  (
    strings: TemplateStringsArray,
    // ...values: (ShaderVariable | Accessor<ShaderResult>)[]
    ...holes: Hole[]
  ) =>
  () => {
    // initialize variables
    const scopedVariables = new Map<string, ScopedVariableToken>()
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
            bindUniformToken(token, gl, program, render)
            break
        }
      })
    }
    return { source, bind, tokenType: 'shader' } as ShaderToken
  }
