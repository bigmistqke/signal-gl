import { Buffer, DataType, Format, InternalFormat } from './types'

// export function readableError(gl: WebGL2RenderingContext) {
//   const error = gl.getError()
//   switch (error) {
//     case gl.INVALID_ENUM:
//       return 'INVALID_ENUM: An unacceptable value has been specified for an enumerated argument.'
//     case gl.INVALID_VALUE:
//       return 'INVALID_VALUE: A numeric argument is out of range.'
//     case gl.INVALID_OPERATION:
//       return 'INVALID_OPERATION: The specified operation is not allowed in the current state.'
//     case gl.INVALID_FRAMEBUFFER_OPERATION:
//       return 'INVALID_FRAMEBUFFER_OPERATION: The framebuffer object is not complete.'
//     case gl.OUT_OF_MEMORY:
//       return 'OUT_OF_MEMORY: Not enough memory is left to execute the command.'
//     case gl.CONTEXT_LOST_WEBGL:
//       return 'CONTEXT_LOST_WEBGL: The WebGL context is lost.'
//     case gl.NO_ERROR:
//       return 'NO ERROR'
//     default:
//       return 'Unknown WebGL Error: ' + error
//   }
// }

export function objectsAreEqual(
  a?: Record<string, any>,
  b?: Record<string, any>
) {
  return a && b && Object.keys(a).every((key) => b[key] === a[key])
}

const defaultConfigs = new Map<
  Uint8ArrayConstructor | Float32ArrayConstructor,
  { format: Format; internalFormat: InternalFormat; dataType: DataType }
>()

defaultConfigs.set(Uint8Array, {
  format: 'RED',
  internalFormat: 'R8',
  dataType: 'UNSIGNED_BYTE',
})
defaultConfigs.set(Float32Array, {
  format: 'RED',
  internalFormat: 'R32F',
  dataType: 'FLOAT',
})

export const getDefaultConfig = (buffer: Buffer) =>
  defaultConfigs.get(buffer.constructor as any)
