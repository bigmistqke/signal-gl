import { Accessor } from 'solid-js'
import { attribute, createGL, createProgram, uniform } from '..'
import { glsl } from './glsl'

import { Buffer, ShaderToken, UniformProxy } from '../core/types'

const canvas = document.createElement('canvas')
const context = canvas.getContext('webgl2')

export const createComputation = <TBuffer extends Buffer>(
  input: Accessor<TBuffer>,
  callback: (
    uniform: ReturnType<UniformProxy['sampler2D']>
  ) => Accessor<ShaderToken>,
  config?: {
    dataType?: 'UNSIGNED_BYTE' | 'UNSIGNED_SHORT' | 'UNSIGNED_INT'
    width?: number
    height?: number
  }
) => {
  let output: TBuffer

  const updateOutput = () => {
    if (input().constructor !== output?.constructor) {
      const bufferType = input().constructor as {
        new (length: number): TBuffer
      }
      output = new bufferType(input().length)
    }
  }

  updateOutput()

  const a_vertices = attribute.vec2(
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])
  )
  const vertex = glsl`#version 300 es
    void main() {
      gl_Position = vec4(${a_vertices}, 0.0, 1.0);
    }
    `
  const fragment = glsl`#version 300 es
    precision lowp float;
    
    out vec4 outColor;
    
    vec4 compute(){
      ${callback(
        uniform.sampler2D(input, {
          internalFormat: 'R8',
          format: 'RED',
          get width() {
            return config?.width || input()?.length || 1
          },
          get height() {
            return config?.height || 1
          },
          dataType: 'UNSIGNED_BYTE',
        })
      )}
    }

    void main() {
      outColor = compute();
    }`

  const program = createProgram({
    canvas,
    vertex: vertex(),
    fragment: fragment(),
    mode: 'TRIANGLES',
    count: 4,
  })

  const gl = createGL({ canvas, programs: [program] })

  return () => {
    updateOutput()
    gl.render()
    return gl.read(output, {
      get width() {
        return config?.width || output.length || 1
      },
      get height() {
        return config?.height || 1
      },
      format: 'RED',
      dataType: 'UNSIGNED_BYTE',
    })
  }
}
