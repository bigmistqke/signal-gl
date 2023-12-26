import { mat4, vec3 } from 'gl-matrix'
import {
  Component,
  ComponentProps,
  ParentProps,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  useContext,
} from 'solid-js'
import { Pose } from '.'
import {
  Canvas,
  Program,
  RenderMode,
  ShaderToken,
  Vector3,
  attribute,
  glsl,
  uniform,
  useSignalGL,
} from '..'

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

export type Spaces = {
  projection: {
    uniform: ReturnType<typeof uniform.mat4>
    matrix: mat4
    invertedMatrix: mat4
  }
  view: {
    uniform: ReturnType<typeof uniform.mat4>
    matrix: mat4
    invertedMatrix: mat4
  }
  model: {
    uniform: ReturnType<typeof uniform.mat4>
    matrix: mat4
  }
}
/**
 * SCENE
 */
const sceneContext = createContext<
  Spaces & {
    setView: (view: mat4) => void
    setProjection: (view: mat4) => void
  } & ReturnType<typeof useSignalGL>
>()
export const useScene = () => useContext(sceneContext)
export const Scene: Component<ComponentProps<typeof Canvas>> = (props) => {
  const [projection, setProjection] = createSignal<mat4>(mat4.create(), {
    equals: false,
  })
  const [view, setView] = createSignal<mat4>(mat4.create(), { equals: false })
  const model = mat4.create()

  const _invertedProjection = mat4.create()
  const _invertedView = mat4.create()

  return (
    <>
      <Canvas {...props}>
        {(() => {
          const signalgl = useSignalGL()
          if (!signalgl) throw `signalgl is undefined`

          return (
            <sceneContext.Provider
              value={mergeProps(signalgl, {
                projection: {
                  uniform: uniform.mat4(projection),
                  get matrix() {
                    return projection()
                  },
                  get invertedMatrix() {
                    return mat4.invert(_invertedProjection, projection())
                  },
                },
                view: {
                  uniform: uniform.mat4(view),
                  get matrix() {
                    return view()
                  },
                  get invertedMatrix() {
                    return mat4.invert(_invertedView, view())
                  },
                },
                model: {
                  uniform: uniform.mat4(model),
                  matrix: model,
                },
                setView,
                setProjection,
              })}
            >
              {props.children}
            </sceneContext.Provider>
          )
        })()}
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

  const matrix = createMemo(() =>
    props.matrix
      ? props.matrix
      : matrixFromPose(mat4.clone(scene.model.matrix), props)
  )

  return (
    <sceneContext.Provider
      value={mergeProps(scene, {
        model: {
          uniform: uniform.mat4(matrix),
          get matrix() {
            return matrix()
          },
        },
      })}
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
  color?: Vector3 | vec3
  opacity: number
  vertices: Float32Array
  mode: RenderMode
}

export const Shape: Component<ParentProps<ShapeProps>> = (props) => {
  return (
    <Group {...props}>
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
          out vec4 model;
          out vec4 view;
          out vec4 clip;
          void main(void) {
            model = ${scene.model.uniform} * vec4(${attribute.vec3(props.vertices)}, 1.);
            view = ${scene.view.uniform} * model;
            clip = ${scene.projection.uniform} * view;
            gl_Position = clip;
          }`}
            // prettier-ignore
            fragment={
          props.fragment ||
          glsl`#version 300 es
          precision mediump float;
          out vec4 color_out;
          void main(void) {
            color_out = vec4(${uniform.vec3(() => props.color || [0,0,0] as Vector3)}, ${uniform.float(() => props.opacity)});
          }`}
            mode={props.mode || 'TRIANGLES'}
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
    vertices: new Float32Array([
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
    opacity: 1,
    mode: "TRIANGLES" as RenderMode
  }, props)
  return <Shape {...merged} />
}

export const Camera: Component<
  Partial<
    Pose & {
      active?: boolean
      fov?: number
      near?: number
      far?: number
      realMatrix?: mat4
    }
  >
> = (props) => {
  const scene = useScene()
  if (!scene) throw 'scene is undefined'

  const projection = mat4.create()
  const view = mat4.create()
  const perspective = mergeProps(
    {
      fov: 45,
      near: 0.1,
      far: 10000,
    },
    props
  )
  const updatePerspective = () => {
    if (!props.active) return
    scene.setProjection(
      mat4.perspective(
        projection,
        (perspective.fov * Math.PI) / 180,
        scene.canvas.clientWidth / scene.canvas.clientHeight,
        perspective.near,
        perspective.far
      )
    )
  }
  createEffect(() => {
    if (!props.active) return
    window.addEventListener('resize', updatePerspective)
    updatePerspective()
    onCleanup(() => window.removeEventListener('resize', updatePerspective))
  })

  createEffect(() => {
    if (!props.active) return
    mat4.identity(view)
    mat4.multiply(view, scene.model.matrix, matrixFromPose(view, props))
    if (props.matrix) mat4.multiply(view, view, props.matrix)
    mat4.invert(view, view)
    if (props.realMatrix) mat4.multiply(view, view, props.realMatrix)
    scene.setView(view)
  })

  return <Group {...props} />
}
