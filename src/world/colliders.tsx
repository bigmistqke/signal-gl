import { mat4, vec3 } from 'gl-matrix'
import {
  ParentComponent,
  Show,
  createContext,
  createEffect,
  createSignal,
  mapArray,
  mergeProps,
  onCleanup,
  useContext,
} from 'solid-js'
import { Cube, Group, Spaces, useScene } from '.'
import { Vector2 } from '..'
import { Vector3 } from './types'
import { directionFromCursor } from './utils'

type Collider = {
  onEvent?: (event: { type: string; value: boolean }) => void
  intersects: (position: Vector3 | vec3, direction: Vector3 | vec3) => boolean
}

const collidersContext = createContext<{
  colliders: Set<Collider>
  addCollider: (collider: Collider) => () => void
}>()

const useColliders = () => useContext(collidersContext)

type ColliderPlugin = ReturnType<typeof createRaycaster>

export const ColliderProvider: ParentComponent<{
  plugins: ColliderPlugin[]
}> = (props) => {
  const [colliders, setColliders] = createSignal<Set<Collider>>(new Set())
  return (
    <collidersContext.Provider
      value={{
        get colliders() {
          return colliders()
        },
        addCollider: (collider) => {
          setColliders((c) => c.add(collider))
          return () =>
            setColliders((c) => {
              c.delete(collider)
              return c
            })
        },
      }}
    >
      {(() => {
        createEffect(
          mapArray(
            () => props.plugins || [],
            (plugin) => plugin.initialize()
          )
        )
        return null
      })()}
      {props.children}
    </collidersContext.Provider>
  )
}

export const createRaycaster = () => {
  const [_colliders, setColliders] = createSignal<Set<Collider>>(new Set())
  const [_spaces, setSpaces] = createSignal<Spaces>()
  let scene: ReturnType<typeof useScene>

  const cursor: Vector2 = [0, 0]

  const cast = (origin: vec3, direction: vec3) => {
    const colliders = _colliders()
    if (!colliders) return

    let hit = false

    for (const collider of colliders) {
      if (collider.intersects(origin, direction)) {
        collider.onEvent?.({ type: 'raycast', value: true })
        hit = true
      } else {
        collider.onEvent?.({ type: 'raycast', value: false })
      }
    }
  }

  return {
    initialize() {
      const scene = useScene()
      const colliders = useColliders()

      if (!scene) throw 'scene is undefined'
      if (!colliders) throw 'colliders is undefined'

      setSpaces(scene)
      setColliders(colliders.colliders)

      scene.canvas.addEventListener('mousemove', (e) => {
        // Convert cursor position to normalized device coordinates
        cursor[0] = (2.0 * e.clientX) / scene.canvas.width - 1.0
        cursor[1] = 1.0 - (2.0 * e.clientY) / scene.canvas.height
      })
    },
    cast,
    castCenter() {
      const colliders = _colliders()
      const spaces = _spaces()

      if (!colliders || !spaces) return
      const view = spaces.view.matrix

      // extract direction vector from matrix
      const direction = vec3.fromValues(-view[2], -view[6], -view[10])
      vec3.normalize(direction, direction)

      const origin = vec3.transformMat4(
        vec3.create(),
        [0, 0, 0],
        spaces.view.invertedMatrix
      )

      cast(origin, direction)
    },
    castCursor() {
      const spaces = _spaces()
      if (!spaces) return undefined

      const direction = directionFromCursor({
        cursor,
        projection: spaces.projection.matrix,
        view: spaces.view.matrix,
      })

      const origin = vec3.transformMat4(
        vec3.create(),
        [0, 0, 0],
        spaces.view.invertedMatrix
      )

      cast(origin, direction)
    },
  }
}

export const AxisAlignedBoxCollider: ParentComponent<
  Partial<{
    scale?: Vector3 | vec3
    position: Vector3 | vec3
    color?: Vector3 | vec3
    onEvent?: (event: { type: string; value: boolean }) => void
  }>
> = (props) => {
  const scene = useScene()
  if (!scene) throw 'scene undefined'

  const colliders = useColliders()
  if (!colliders) throw 'collidersContext undefined'
  const merged = mergeProps(
    {
      scale: [1, 1, 1] as Vector3,
      position: [0, 0, 0] as Vector3,
    },
    props
  )

  const tMin: Vector3 = [0, 0, 0]
  const tMax: Vector3 = [0, 0, 0]
  let boxMin: Vector3 = [0, 0, 0]
  let boxMax: Vector3 = [0, 0, 0]

  const unsubscribe = colliders.addCollider({
    intersects: (position, direction) => {
      for (let i = 0; i < 3; i++) {
        boxMin[i] = merged.position[i]! - 0.5 * merged.scale[i]!
        boxMax[i] = merged.position[i]! + 0.5 * merged.scale[i]!
      }

      const origin = mat4.getTranslation(vec3.create(), scene.model.matrix)

      vec3.add(boxMax, boxMax, origin)
      vec3.add(boxMin, boxMin, origin)

      for (let i = 0; i < 3; i++) {
        const invDir = 1.0 / direction[i]!
        const t1 = (boxMin[i]! - position[i]!) * invDir
        const t2 = (boxMax[i]! - position[i]!) * invDir

        tMin[i] = Math.min(t1, t2)
        tMax[i] = Math.max(t1, t2)
      }

      const tNear = Math.max(tMin[0], tMin[1], tMin[2])
      const tFar = Math.min(tMax[0], tMax[1], tMax[2])

      if (tNear > tFar || tFar < 0) {
        return false
      }
      return true
    },
    get onEvent() {
      return props.onEvent
    },
  })

  onCleanup(unsubscribe)

  return (
    <>
      <Show when={props.color}>
        <Cube mode="LINES" />
      </Show>
      <Group {...merged}>{props.children}</Group>
    </>
  )
}
