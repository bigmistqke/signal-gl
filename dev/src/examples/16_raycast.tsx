import {
  AxisAlignedBoxCollider,
  Camera,
  ColliderProvider,
  Cube,
  Pose,
  Scene,
  Vector3,
  createRaycaster,
  fly,
} from '@bigmistqke/signal-gl/world'
import { For, createEffect, createSignal } from 'solid-js'
import { render } from 'solid-js/web'

import './index.css'

const SIZE = 50
const randomVector3 = () =>
  [
    Math.random() * SIZE - SIZE / 2,
    Math.random() * SIZE - SIZE / 2,
    Math.random() * SIZE - SIZE / 2,
  ] as Vector3

const HitBox = (props: Pose) => {
  const [hit, setHit] = createSignal(false)
  const color: Vector3 = [Math.random(), Math.random(), Math.random()]
  return (
    <AxisAlignedBoxCollider {...props} onEvent={({ value }) => setHit(value)}>
      <Cube color={hit() ? [1, 1, 1] : color} />
    </AxisAlignedBoxCollider>
  )
}

render(() => {
  const raycaster = createRaycaster()
  createEffect(raycaster.castCursor)
  return (
    <Scene background={[1, 0, 0, 1]}>
      <ColliderProvider plugins={[raycaster]}>
        <For each={Array.from({ length: 1000 }).map(randomVector3)}>
          {(position) => <HitBox position={position} />}
        </For>
        <Camera active fov={33} {...fly()} />
      </ColliderProvider>
    </Scene>
  )
}, document.getElementById('app')!)
