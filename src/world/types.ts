import { mat4, vec3 } from 'gl-matrix'

export type Vector3 = [number, number, number]
export type Pose = {
  position?: Vector3 | vec3
  rotation?: Vector3 | vec3
  scale?: Vector3 | vec3
  matrix?: mat4
}
