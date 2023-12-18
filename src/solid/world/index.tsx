import { ReadonlyMat4, mat4 } from 'gl-matrix'
import {
  Component,
  ParentProps,
  createContext,
  createSignal,
  mergeProps,
  splitProps,
  useContext,
} from 'solid-js'
import { attribute, glsl, uniform } from '..'
import { Program, Stack, useSignalGL } from '../components'

type Vector3 = [number, number, number]
type Pose = {
  position?: Vector3
  rotation?: Vector3
  scale?: Vector3
}

const matrixFromPose = (matrix: mat4, pose: Pose) => {
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

/**
 * SCENE
 */
const sceneContext = createContext<{
  projection: ReturnType<typeof uniform.mat4>
}>()
const useScene = () => useContext(sceneContext)
export const Scene: Component<ParentProps> = (props) => {
  const [projection, setProjection] = createSignal(mat4.create(), {
    equals: false,
  })
  const m = mat4.create()
  return (
    <Stack
      onResize={({ canvas }) => {
        setProjection(
          mat4.perspective(
            mat4.create(),
            (45 * Math.PI) / 180,
            canvas.clientWidth / canvas.clientHeight,
            0.1,
            100.0
          )
        )
      }}
    >
      <sceneContext.Provider
        value={{
          projection: uniform.mat4(projection),
        }}
      >
        {props.children}
      </sceneContext.Provider>
    </Stack>
  )
}

/**
 * GROUP
 */

export const Group: Component<ParentProps<Pose>> = (props) => {
  const scene = useScene()
  if (!scene) throw 'scene was not defined'

  const projection = uniform.mat4(() =>
    matrixFromPose(mat4.clone(scene.projection.value as ReadonlyMat4), props)
  )

  return (
    <sceneContext.Provider
      value={{
        ...scene,
        get projection() {
          return projection
        },
      }}
    >
      {props.children}
    </sceneContext.Provider>
  )
}

/**
 * SHAPE
 */

type ShapeProps = Pose & {
  indices: number[]
  colors: Float32Array
  positions: Float32Array
}

export const Shape: Component<ParentProps<ShapeProps>> = (props) => {
  const scene = useScene()
  if (!scene) throw 'gl not defined'
  const [pose] = splitProps(props, ['position', 'rotation', 'scale'])
  return (
    <Group {...pose}>
      {props.children}
      <Program
        // prettier-ignore
        vertex={
          glsl`#version 300 es
          precision mediump float;
          out vec3 color_in;
          void main(void) {
            color_in = ${attribute.vec3(props.colors)};
            gl_Position = ${scene.projection} * ${modelView(props)} * vec4(${attribute.vec3(props.positions)}, 1.);
          }`}
        // prettier-ignore
        fragment={
          glsl`#version 300 es
          precision mediump float;
          in vec3 color_in;
          out vec4 color_out;
          void main(void) {
            color_out = vec4(color_in, 1.);
          }`}
        mode="TRIANGLES"
        indices={props.indices}
        cacheEnabled
      />
    </Group>
  )
}

/**
 * CUBE
 */

export const Cube: Component<ParentProps<Partial<ShapeProps>>> = (props) => {
  const [_, shapeProps] = splitProps(props, ['children'])
  // prettier-ignore
  const merged = mergeProps({
    colors: new Float32Array([
      // Front face
      1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,
      // Back face
      1, 1, 0,   1, 1, 0,   1, 1, 0,   1, 1, 0,
      // Top face
      0, 1, 1,   0, 1, 1,   0, 1, 1,   0, 1, 1,
      // Bottom face
      0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,
      // Right face
      1, 0, 1,   1, 0, 1,   1, 0, 1,   1, 0, 1,
      // Left face
      0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,
    ]),
    positions: new Float32Array([
      // Front face
      -1, -1,  1,    1, -1,  1,    1,  1,  1,   -1,  1,  1,
      // Back face
      -1, -1, -1,   -1,  1, -1,    1,  1, -1,    1, -1, -1,
      // Top face
      -1,  1, -1,   -1,  1,  1,    1,  1,  1,    1,  1, -1,
      // Bottom face
      -1, -1, -1,    1, -1, -1,    1, -1,  1,   -1, -1,  1,
      // Right face
      1, -1, -1,    1,  1,  -1,    1,  1,  1,    1, -1,  1,
      // Left face
      -1, -1, -1,   -1, -1,  1,   -1,  1,  1,   -1,  1, -1,
    ]),
    indices:  [
      // Front face
      0,   1,  2,  0,  2,  3,
      // Back face
      4,   5,  6,  4,  6,  7,
      // Top face
      8,   9, 10,  8, 10, 11,
      // Bottom face
      12, 13, 14, 12, 14, 15,
      // Right face
      16, 17, 18, 16, 18, 19,
      // Left face
      20, 21, 22, 20, 22, 23,
    ],
  })
  return (
    <Shape
      {...shapeProps}
      colors={merged.colors}
      positions={merged.positions}
      indices={merged.indices}
    >
      {props.children}
    </Shape>
  )
}
