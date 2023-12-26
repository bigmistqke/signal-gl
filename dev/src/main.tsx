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
import { render } from 'solid-js/web'

import './index.css'

const randomVector3 = (size = 50) =>
  [
    Math.random() * size - size / 2,
    Math.random() * size - size / 2,
    Math.random() * size - size / 2,
  ] as Vector3

const Explosion = (props: { color: Vector3 }) => {
  console.log('mount')
  const [pieces, setPieces] = createSignal(
    Array.from({ length: 10 }).map(() => ({
      start: [0, 0, 0],
      end: randomVector3(5),
      scale: [1, 1, 1],
    }))
  )

  return (
    <For each={pieces()}>
      {(piece) => <Cube position={piece.end} {...props} />}
    </For>
  )
}

const HitBox = (props: Pose) => {
  const [hit, setHit] = createSignal(false)
  const color: Vector3 = [Math.random(), Math.random(), Math.random()]

  return (
    <Group {...props}>
      <Show when={!hit()} fallback={<Explosion color={color} />}>
        <AxisAlignedBoxCollider onEvent={({ value }) => setHit(value)}>
          <Cube color={hit() ? [1, 1, 1] : color} />
        </AxisAlignedBoxCollider>
      </Show>
    </Group>
  )
}

render(() => {
  const raycaster = createRaycaster()
  createEffect(raycaster.castCursor)
  return (
    <Scene background={[1, 0, 0, 1]}>
      <ColliderProvider plugins={[raycaster]}>
        <For each={Array.from({ length: 500 }).map(() => randomVector3())}>
          {(position) => <HitBox position={position} />}
        </For>
        <Camera active fov={33} {...fly()} />
      </ColliderProvider>
    </Scene>
  )
}, document.getElementById('app')!)
