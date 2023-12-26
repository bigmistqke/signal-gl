import { mat4, vec3 } from 'gl-matrix'
import { Vector2 } from '..'

export const directionFromCursor = ({
  cursor,
  projection,
  view,
}: {
  cursor: Vector2
  projection: mat4
  view: mat4
}) => {
  const direction = vec3.create()

  // Combine view and projection matrices
  const viewProjection = mat4.create()
  mat4.multiply(viewProjection, projection, view)
  mat4.invert(viewProjection, viewProjection)

  // Calculate the ray direction in world space
  vec3.transformMat4(direction, [...cursor, 1.0], viewProjection)

  return vec3.normalize(direction, direction)
}
