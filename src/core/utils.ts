import { DataType, TypedArray } from './types'

const typedArrayToDataTypeMap = new Map<Function, DataType>()
typedArrayToDataTypeMap.set(Uint8Array, 'UNSIGNED_BYTE')
typedArrayToDataTypeMap.set(Int8Array, 'BYTE')
typedArrayToDataTypeMap.set(Uint16Array, 'UNSIGNED_SHORT')
typedArrayToDataTypeMap.set(Int16Array, 'SHORT')
typedArrayToDataTypeMap.set(Uint32Array, 'UNSIGNED_INT')
typedArrayToDataTypeMap.set(Int32Array, 'INT')
typedArrayToDataTypeMap.set(Float32Array, 'FLOAT')

export function typedArrayToDataType(array: Uint8Array): 'UNSIGNED_BYTE'
export function typedArrayToDataType(array: Int8Array): 'BYTE'
export function typedArrayToDataType(array: Uint16Array): 'UNSIGNED_SHORT'
export function typedArrayToDataType(array: Int16Array): 'SHORT'
export function typedArrayToDataType(array: Uint32Array): 'UNSIGNED_INT'
export function typedArrayToDataType(array: Int32Array): 'INT'
export function typedArrayToDataType(array: Float32Array): 'FLOAT'
export function typedArrayToDataType(array: TypedArray) {
  const dataType = typedArrayToDataTypeMap.get(array.constructor as Function)
  if (!dataType) {
    throw new Error('Unsupported TypedArray type')
  }
  return dataType
}

export function readableError(gl: WebGL2RenderingContext) {
  const error = gl.getError()
  switch (error) {
    case gl.INVALID_ENUM:
      return 'INVALID_ENUM: An unacceptable value has been specified for an enumerated argument.'
    case gl.INVALID_VALUE:
      return 'INVALID_VALUE: A numeric argument is out of range.'
    case gl.INVALID_OPERATION:
      return 'INVALID_OPERATION: The specified operation is not allowed in the current state.'
    case gl.INVALID_FRAMEBUFFER_OPERATION:
      return 'INVALID_FRAMEBUFFER_OPERATION: The framebuffer object is not complete.'
    case gl.OUT_OF_MEMORY:
      return 'OUT_OF_MEMORY: Not enough memory is left to execute the command.'
    case gl.CONTEXT_LOST_WEBGL:
      return 'CONTEXT_LOST_WEBGL: The WebGL context is lost.'
    case gl.NO_ERROR:
      return 'NO ERROR'
    default:
      return 'Unknown WebGL Error: ' + error
  }
}
