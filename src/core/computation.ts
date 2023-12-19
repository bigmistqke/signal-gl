import { Accessor, mergeProps } from 'solid-js'
import { glsl } from './template/glsl'
import { attribute, uniform } from './template/tokens'

import { GLProgram, GLStack } from './classes'
import {
  BufferArray,
  DataType,
  Format,
  InternalFormat,
  ShaderToken,
  UniformProxy,
} from './types'
import { getTextureConfigFromTypedArray } from './utils'

/* 
  CREATE_COMPUTATION-HOOK 
*/
const extend = (
  { gl }: GLStack | GLProgram,
  extension: Parameters<WebGLRenderingContextBase['getExtension']>[0]
) => gl.getExtension(extension)

const computationCanvas = document.createElement('canvas')
type ComputationConfig = {
  /** _Uint8Array_ `UNSIGNED_BYTE` _Float32Array_ `FLOAT` _default_ `FLOAT` */
  dataType?: DataType
  /** _default_ input.length */
  width?: number
  /** _default_ 1 */
  height?: number
  /**  _Uint8Array_ `R8` _Float32Array_ `R32F` _default_ `R32F` */
  internalFormat?: InternalFormat
  /** _Uint8Array_ `RED` _Float32Array_ `RED` _default_ `RED` */
  format?: Format
}
/**
 * currently fully supported: `Uint8Array` and `Float32Array`
 * @param input _required_ () => Buffer
 * @param callback _required_ glsl-lambda: expects a `vec2` to be returned
 * @param config _optional_
 * @param config.width _default_ input.length
 * @param config.height _default_ 1
 * @param config.dataType _Uint8Array_ `UNSIGNED_BYTE` _Float32Array_ `FLOAT` _default_ `FLOAT`
 * @param config.format _Uint8Array_ `RED` _Float32Array_ `RED` _default_ `RED`
 * @param config.internalFormat _Uint8Array_ `R8` _Float32Array_ `R32F` _default_ `R32F`
 * @returns TBuffer
 */
export const createComputation = function <TBuffer extends BufferArray>(
  input: Accessor<TBuffer>,
  callback: (
    uniform: ReturnType<UniformProxy['sampler2D']>
  ) => Accessor<ShaderToken>,
  config?: ComputationConfig
) {
  let output: TBuffer
  let bufferType = input().constructor as {
    new (length: number): TBuffer
  }

  const getConfig = () =>
    mergeProps(
      {
        internalFormat: 'R32F',
        format: 'RED',
        width: input().length,
        height: 1,
        dataType: 'FLOAT',
      } as const,
      getTextureConfigFromTypedArray(input()),
      config
    )

  const a_vertices = attribute.vec2(
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])
  )
  const vertex = glsl`#version 300 es
void main(){gl_Position = vec4(${a_vertices}, 0.0, 1.0);}`

  const fragment = glsl`#version 300 es
precision highp float; out vec4 outColor; vec4 compute(){${callback(
    uniform.sampler2D(input, getConfig())
  )}} void main(){outColor = compute();}`

  const program = new GLProgram({
    canvas: computationCanvas,
    vertex: vertex(),
    fragment: fragment(),
    mode: 'TRIANGLES',
    count: 4,
  })

  extend(program, 'EXT_color_buffer_float')

  const updateOutput = () => {
    if (input().constructor !== output?.constructor) {
      bufferType = input().constructor as {
        new (length: number): TBuffer
      }
      output = new bufferType(input().length)
    } else if (input().length !== output?.length) {
      output = new bufferType(input().length)
    }
  }

  updateOutput()

  return () => {
    updateOutput()
    program.clear().render()
    return program.read(output, getConfig())
  }
}
