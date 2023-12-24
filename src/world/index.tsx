export * from './loaders'
import { ReadonlyMat4, mat4, vec3 } from 'gl-matrix'
import {
  Component,
  ComponentProps,
  ParentProps,
  createContext,
  createMemo,
  createRenderEffect,
  createSignal,
  mergeProps,
  splitProps,
  useContext,
} from 'solid-js'
import {
  Canvas,
  Program,
  ShaderToken,
  attribute,
  glsl,
  uniform,
  useSignalGL,
} from '../'

type Vector3 = [number, number, number]
type Pose = {
  position?: Vector3 | vec3
  rotation?: Vector3 | vec3
  scale?: Vector3 | vec3
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

type BaseCameraConfig = Pose & Partial<{ far: number; near: number }>
type CameraConfig = BaseCameraConfig & Partial<{ fov: number }>
/**
 * SCENE
 */
const sceneContext = createContext<{
  projection: ReturnType<typeof uniform.mat4>
  setCamera: (pose: CameraConfig) => void
}>()
const useScene = () => useContext(sceneContext)
export const Scene: Component<ComponentProps<typeof Canvas>> = (props) => {
  const [projection, setProjection] = createSignal(mat4.create(), {
    equals: false,
  })
  const [camera, setCamera] = createSignal<CameraConfig>({
    position: [0, 0, 0],
    rotation: [0, 0.1, 0],
    scale: [1, 1, 1],
  })
  const cameraPerspectiveScratch = mat4.create()

  const projectedScene = createMemo(() =>
    matrixFromPose(projection(), camera())
  )

  return (
    <>
      <Canvas
        {...props}
        onResize={({ canvas }) => {
          setProjection(
            mat4.perspective(
              cameraPerspectiveScratch,
              ((camera().fov || 45) * Math.PI) / 180,
              canvas.clientWidth / canvas.clientHeight,
              camera().near || 0.1,
              camera().far || 10000.0
            )
          )
        }}
      >
        <sceneContext.Provider
          value={{
            projection: uniform.mat4(projectedScene),
            setCamera,
          }}
        >
          {props.children}
        </sceneContext.Provider>
      </Canvas>
    </>
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
  /** in vec4 position */
  fragment?: ShaderToken
  vertex?: ShaderToken
  indices: number[]
  color: Vector3
  opacity: number
  vertices: Float32Array
}

export const Shape: Component<ParentProps<ShapeProps>> = (props) => {
  const [pose] = splitProps(props, ['position', 'rotation', 'scale'])
  return (
    <Group {...pose}>
      {props.children}
      {(() => {
        const scene = useScene()
        if (!scene) throw 'scene not defined'
        return (
          <Program
            // prettier-ignore
            vertex={
          props.vertex ||
          glsl`#version 300 es
          precision mediump float;
          out vec4 position;
          void main(void) {
            position = ${scene.projection} * vec4(${attribute.vec3(props.vertices)}, 1.);
            gl_Position = position;
          }`}
            // prettier-ignore
            fragment={
          props.fragment ||
          glsl`#version 300 es
          precision mediump float;
          out vec4 color_out;
          void main(void) {
            color_out = vec4(${uniform.vec3(() => props.color)}, ${uniform.float(() => props.opacity)});
          }`}
            mode="TRIANGLES"
            indices={props.indices}
            cacheEnabled
          />
        )
      })()}
    </Group>
  )
}

/**
 * CUBE
 */

export const Cube: Component<ParentProps<Partial<ShapeProps>>> = (props) => {
  // prettier-ignore
  const merged = mergeProps({
    positions: new Float32Array([
      // Front face
      -0.5, -0.5,  0.5,    0.5, -0.5,  0.5,    0.5,  0.5,  0.5,   -0.5,  0.5,  0.5,
      // Back face
      -0.5, -0.5, -0.5,   -0.5,  0.5, -0.5,    0.5,  0.5, -0.5,    0.5, -0.5, -0.5,
      // Top face
      -0.5,  0.5, -0.5,   -0.5,  0.5,  0.5,    0.5,  0.5,  0.5,    0.5,  0.5, -0.5,
      // Bottom face
      -0.5, -0.5, -0.5,    0.5, -0.5, -0.5,    0.5, -0.5,  0.5,   -0.5, -0.5,  0.5,
      // Right face
      0.5, -0.5, -0.5,    0.5,  0.5,  -0.5,    0.5,  0.5,  0.5,    0.5, -0.5,  0.5,
      // Left face
      -0.5, -0.5, -0.5,   -0.5, -0.5,  0.5,   -0.5,  0.5,  0.5,   -0.5,  0.5, -0.5,
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
    color: [1,1,1] as Vector3,
    opacity: 1
  }, props)
  return <Shape {...merged} />
}

export const Camera: Component<
  Partial<
    Pose & { active?: boolean; fov?: number; near?: number; far?: number }
  >
> = (props) => {
  const scene = useScene()
  if (!scene) throw 'scene is undefined'

  const position = vec3.create()
  const rotation = vec3.create()

  const cameraProps = mergeProps(props, {
    get position() {
      if (!props.position) return undefined
      return vec3.negate(position, props.position)
    },
    get rotation() {
      if (!props.rotation) return undefined
      return vec3.negate(rotation, props.rotation)
    },
  })

  createRenderEffect(() => {
    if (!props.active) return
    scene.setCamera(cameraProps)
  })

  return <Group {...props} />
}
