import {
  AxisAlignedBoxCollider,
  Camera,
  ColliderProvider,
  Cube,
  Group,
  Pose,
  Scene,
  Vector3,
  createRaycaster,
  fly,
} from '@bigmistqke/signal-gl/world'
import { For, Show, createEffect, createSignal } from 'solid-js'

import { createScheduled, throttle } from '@solid-primitives/scheduled'

const randomVector3 = (size = 50) =>
  [
    Math.random() * size - size / 2,
    Math.random() * size - size / 2,
    Math.random() * size - size / 2,
  ] as Vector3

const Explosion = (props: { color: Vector3 }) => {
  const [delta, setDelta] = createSignal(0)

  const pieces = Array.from({ length: 10 }).map(() => ({
    start: [0, 0, 0] as Vector3,
    end: randomVector3(5),
  }))

  const tweenPosition = ({ start, end }: { start: Vector3; end: Vector3 }) =>
    start.map((v, i) => v * (1 - delta()) + end[i]! * delta()) as Vector3

  const loop = () => {
    if (delta() < 1) {
      requestAnimationFrame(loop)
    }
    setDelta((delta) => Math.min(1, delta + 0.01))
  }
  loop()

  return (
    <Show when={delta() < 1}>
      <For each={pieces}>
        {(piece) => (
          <Cube
            position={tweenPosition(piece)}
            scale={[1 - delta(), 1 - delta(), 1 - delta()]}
            {...props}
          />
        )}
      </For>
    </Show>
  )
}

const HitBox = (props: Pose) => {
  const [hit, setHit] = createSignal(false)
  const color: Vector3 = [Math.random(), Math.random(), Math.random()]
  return (
    <Group {...props}>
      <Show when={!hit()} fallback={<Explosion color={color} />}>
        <AxisAlignedBoxCollider onEvent={({ hit }) => setHit(hit)}>
          <Cube color={hit() ? [1, 1, 1] : color} />
        </AxisAlignedBoxCollider>
      </Show>
    </Group>
  )
}

export default function () {
  const scheduled = createScheduled((fn) => throttle(fn, 1000 / 30))
  const raycaster = createRaycaster()
  createEffect(() => {
    if (!scheduled()) return
    raycaster.castCursor()
  })
  return (
    <Scene background={[1, 0, 0, 1]}>
      <ColliderProvider plugins={[raycaster]}>
        <For each={Array.from({ length: 1000 }).map(() => randomVector3())}>
          {(position) => <HitBox position={position} />}
        </For>
        <Camera active fov={33} {...fly()} />
      </ColliderProvider>
    </Scene>
  )
}
