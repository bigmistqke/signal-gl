import { mat4, quat, vec3 } from 'gl-matrix'
import {
  createEffect,
  createSignal,
  mergeProps,
  onCleanup,
  untrack,
} from 'solid-js'
import { createStore } from 'solid-js/store'
import { Vector3 } from '..'
import { useScene } from './components'

export const orbit = (_config?: {
  near?: number
  far?: number
  target?: Vector3
  up?: Vector3
}) => {
  /* const scene = useScene()
  if (!scene) throw `scene is undefined` */
  const config = mergeProps(
    {
      target: [0, 0, 0] as Vector3,
      up: [0, 1, 0] as Vector3,
      near: 0,
      far: 50,
    },
    _config
  )

  const [rotation, setRotation] = createSignal<[number, number]>([0, 0], {
    equals: false,
  })
  const [radius, setRadius] = createSignal(10)

  const _matrix = mat4.create()
  const matrix = () => {
    const [theta, phi] = rotation()

    const eye: Vector3 = [
      radius() * Math.sin(theta) * Math.cos(phi),
      radius() * Math.sin(phi),
      radius() * Math.cos(theta) * Math.cos(phi),
    ]

    const target: Vector3 = config.target
    const up: Vector3 = [0, 1, 0]

    mat4.lookAt(_matrix, eye, target, up)

    return _matrix
  }

  let start: { x: number; y: number }
  const onMouseDown = (e: MouseEvent) => {
    start = {
      x: e.clientX,
      y: e.clientY,
    }
    const onMouseUp = (e: MouseEvent) =>
      window.removeEventListener('mousemove', onMouseMove)
    const onMouseMove = (e: MouseEvent) => {
      const now = {
        x: e.clientX,
        y: e.clientY,
      }
      const delta = {
        x: start.x - now.x,
        y: start.y - now.y,
      }
      start = now
      setRotation((rotation) => [
        rotation[0] + delta.x / 200,
        rotation[1] - delta.y / 200,
      ])
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }
  window.addEventListener('mousedown', onMouseDown)
  const onWheel = (e: WheelEvent) => {
    setRadius((radius) =>
      Math.min(config.far, Math.max(config.near, radius + e.deltaY / 10))
    )
    e.preventDefault()
  }
  window.addEventListener('wheel', onWheel, { passive: false })

  onCleanup(() => {
    window.removeEventListener('mousedown', onMouseDown)
    window.removeEventListener('wheel', onWheel)
  })

  return {
    get realMatrix() {
      return matrix()
    },
  }
}

export const fly = () => {
  const scene = useScene()
  if (!scene) throw 'scene is undefined'

  const [position, setPosition] = createSignal<Vector3>([0.0, 0.0, 6.0], {
    equals: false,
  })
  const [rotation, setRotation] = createSignal(quat.create(), {
    equals: false,
  })
  const [keys, setKeys] = createStore<Record<string, boolean>>({})

  {
    const speed = 0.05
    let last: number | undefined
    let keysPressed = false
    const front = vec3.create()
    const right = vec3.create()
    const up = vec3.create()
    const moveDirection = vec3.create()

    const keyboardLoop = (now: number) => {
      if (last) {
        const delta = now - last
        setPosition((position) => {
          vec3.set(front, 0, 0, -1)
          vec3.transformQuat(front, front, rotation())
          vec3.set(right, 1, 0, 0)
          vec3.transformQuat(right, right, rotation())
          vec3.set(up, -1, 0, 0)
          vec3.transformQuat(up, up, rotation())

          vec3.set(moveDirection, 0, 0, 0)
          if (keys.KeyW) vec3.add(moveDirection, moveDirection, front)
          if (keys.KeyS) vec3.subtract(moveDirection, moveDirection, front)
          if (keys.KeyA) vec3.subtract(moveDirection, moveDirection, right)
          if (keys.KeyD) vec3.add(moveDirection, moveDirection, right)

          vec3.normalize(moveDirection, moveDirection)
          vec3.scale(moveDirection, moveDirection, (speed * delta) / 10)

          vec3.add(position, position, moveDirection)
          return position
        })
      }
      if (keysPressed) {
        last = now
        requestAnimationFrame(keyboardLoop)
      } else {
        last = undefined
      }
    }
    createEffect(() => {
      if (Object.values(keys).find((v) => v)) {
        if (!keysPressed) {
          keysPressed = true
          untrack(() => requestAnimationFrame(keyboardLoop))
        }
      } else {
        keysPressed = false
      }
    })
  }

  {
    const direction = {
      x: 0,
      y: 0,
    }
    const temp = quat.create()
    const pitch = quat.create()
    const yaw = quat.create()
    const xAxis: Vector3 = [1, 0, 0]
    const yAxis: Vector3 = [0, 1, 0]
    const sensitivity = 0.05
    const loop = () => {
      setRotation((rotation) => {
        quat.identity(pitch)
        quat.setAxisAngle(pitch, xAxis, -direction.y * sensitivity)
        quat.identity(yaw)
        quat.setAxisAngle(yaw, yAxis, -direction.x * sensitivity)
        quat.identity(temp)
        quat.multiply(temp, yaw, temp)
        quat.multiply(temp, temp, pitch)
        quat.normalize(temp, temp)
        return quat.multiply(rotation, rotation, temp)
      })
      requestAnimationFrame(loop)
    }
    loop()

    document.addEventListener('mousemove', (event: MouseEvent) => {
      direction.x = event.clientX / scene!.canvas.width - 0.5
      direction.y = event.clientY / scene!.canvas.height - 0.5
    })
    document.addEventListener('keydown', (event) => setKeys(event.code, true))
    document.addEventListener('keyup', (event) => setKeys(event.code, false))
  }

  const matrix = mat4.create()

  return {
    get matrix() {
      return mat4.fromRotationTranslation(matrix, rotation(), position())
    },
  }
}
