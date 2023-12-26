import { Camera, Cube, Scene, fly, useScene } from '@bigmistqke/signal-gl/world'
import { Vector3 } from '@core/types'
import { mat4, quat, vec3, vec4 } from 'gl-matrix'
import { createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import './index.css'

function rayIntersectsBox(
  rayOrigin: vec3,
  rayDirection: vec3 | vec4,
  boxMin: Vector3,
  boxMax: Vector3
) {
  const tMin = vec3.create()
  const tMax = vec3.create()

  for (let i = 0; i < 3; i++) {
    const invDir = 1.0 / rayDirection[i]!
    const t1 = (boxMin[i]! - rayOrigin[i]!) * invDir
    const t2 = (boxMax[i]! - rayOrigin[i]!) * invDir

    tMin[i] = Math.min(t1, t2)
    tMax[i] = Math.max(t1, t2)
  }

  const tNear = Math.max(tMin[0], tMin[1], tMin[2])
  const tFar = Math.min(tMax[0], tMax[1], tMax[2])

  if (tNear > tFar || tFar < 0) {
    return false
  }
  return true
}

const App = () => {
  const scene = useScene()
  if (!scene) throw 'scene undefined'

  const [hit, setHit] = createSignal(false)

  // Modify the pickObject function to check for intersection with box colliders
  function pickObject() {
    if (!scene || !scene.view) return

    // Set up the model-view matrix
    const view = scene.view.matrix

    const cameraPosition = vec3.create()
    const rotationMatrix = mat4.create()

    // Extract the rotation part (upper-left 3x3) of the view matrix
    const rotationQuat = quat.create()
    mat4.getRotation(rotationQuat, view)
    // Convert the quaternion back to a rotation matrix
    mat4.fromQuat(rotationMatrix, rotationQuat)

    // Invert the rotation matrix to get the camera's orientation
    mat4.invert(rotationMatrix, rotationMatrix)

    // Extract the translation part (last column) of the view matrix
    const localPosition = mat4.getTranslation(vec3.create(), view)

    // Transform the local position using the inverted rotation matrix
    vec3.transformMat4(cameraPosition, localPosition, rotationMatrix)

    // Negate the result to get the correct camera position
    vec3.negate(cameraPosition, cameraPosition)

    const forwardDirection = vec3.create()
    vec3.set(
      forwardDirection,
      -rotationMatrix[8],
      -rotationMatrix[9],
      -rotationMatrix[10]
    )
    vec3.normalize(forwardDirection, forwardDirection)

    let hit = false

    for (const collider of colliders) {
      if (
        rayIntersectsBox(
          cameraPosition,
          forwardDirection,
          collider.min,
          collider.max
        )
      ) {
        console.log('Box collider picked:', collider)
        hit = true
      }
    }
    setHit(hit)
  }

  const colliders = [
    {
      min: [-0.5, -0.5, -0.5] as Vector3,
      max: [0.5, 0.5, 0.5] as Vector3,
    },
  ]

  scene.onRender(pickObject)

  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: '50vw',
          top: '50vh',
          transform: 'translate(-50%)',
          width: '10px',
          height: '10px',
          'border-radius': '50%',
          background: hit() ? 'blue' : 'yellow',
          'z-index': 10,
        }}
      />
      <Cube />
      <Camera active fov={33} {...fly()} />
    </>
  )
}

render(
  () => (
    <Scene background={[1, 0, 0, 1]} style={{ cursor: 'crosshair' }}>
      <App />
    </Scene>
  ),
  document.getElementById('app')!
)
