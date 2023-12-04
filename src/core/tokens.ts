import type {
  AttributeProxy,
  AttributeToken,
  OnRenderFunction,
  Sampler2DToken,
  UniformProxy,
  UniformToken,
  ValueOf,
} from '@core/types'
import { mergeProps } from 'solid-js'

export const createToken = <
  TConfig extends ReturnType<ValueOf<UniformProxy> | ValueOf<AttributeProxy>>,
  TOther extends Record<string, any>
>(
  name: number | string,
  config: TConfig,
  other?: TOther
) => mergeProps(config, { name }, other)

export const bindUniformToken = (
  token: UniformToken,
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  onRender: OnRenderFunction
) => {
  const location = gl.getUniformLocation(program, token.name)!
  onRender(location, () => {
    gl[token.functionName](location, token.value)
  })
}

export const bindAttributeToken = (
  token: AttributeToken,
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  onRender: OnRenderFunction
) => {
  const target = token.options?.target
  const buffer = gl.createBuffer()
  const glTarget = target ? gl[target] : gl.ARRAY_BUFFER
  const location = gl.getAttribLocation(program, token.name)

  onRender(location, () => {
    gl.bindBuffer(glTarget, buffer)
    gl.bufferData(glTarget, token.value, gl.STATIC_DRAW)
    gl.vertexAttribPointer(location, token.size, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(location)
  })
}

export const bindSampler2DToken = (
  token: Sampler2DToken,
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  onRender: OnRenderFunction,
  effect: (cb: () => void) => void
) => {
  // Create a texture and bind it to texture unit 0
  // onRender(token.textureIndex, () => token.value)
  onRender(token.textureIndex, () => {
    console.log('bind')
    const {
      format,
      width,
      height,
      border,
      minFilter,
      magFilter,
      wrapS,
      wrapT,
      internalFormat,
      type,
      dataType,
    } = mergeProps(
      {
        internalFormat: 'RGBA',
        width: 2,
        height: 1,
        border: 0,
        format: 'RGBA',
        dataType: 'UNSIGNED_BYTE',
        minFilter: 'NEAREST',
        magFilter: 'NEAREST',
        wrapS: 'CLAMP_TO_EDGE',
        wrapT: 'CLAMP_TO_EDGE',
      } as const,
      token.options
    )

    gl.useProgram(program)

    const texture = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0 + token.textureIndex)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl[internalFormat],
      width,
      height,
      border,
      gl[format],
      gl[dataType],
      token.value
    )

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[minFilter])
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[magFilter])
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[wrapS])
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[wrapT])

    // Bind the texture to the uniform sampler
    gl[type === 'float' ? 'uniform1f' : 'uniform1i'](
      gl.getUniformLocation(program, token.name),
      token.textureIndex
    )

    gl.finish()
  })
}
