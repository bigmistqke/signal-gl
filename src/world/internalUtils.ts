import { mat4 } from 'gl-matrix'
import { uniform, useSignalGL } from '..'
import { Pose } from './types'

export const matrixFromPose = (matrix: mat4, pose: Pose) => {
  if (pose.position) mat4.translate(matrix, matrix, pose.position)
  if (pose.rotation) {
    mat4.rotate(matrix, matrix, pose.rotation[0], [1, 0, 0])
    mat4.rotate(matrix, matrix, pose.rotation[1], [0, 1, 0])
    mat4.rotate(matrix, matrix, pose.rotation[2], [0, 0, 1])
  }
  if (pose.scale) mat4.scale(matrix, matrix, pose.scale)
  return matrix
}

export const modelView = (props: Pose) => {
  const gl = useSignalGL()
  if (!gl) throw 'gl not defined'
  let modelView = mat4.create()
  return uniform.mat4(() => matrixFromPose(mat4.identity(modelView), props))
}
