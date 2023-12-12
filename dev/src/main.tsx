import { Cube, Group, Scene } from '@bigmistqke/signal-gl/world'
import { For, createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import './index.css'

function App() {
  const [rotation, setRotation] = createSignal<[number, number, number]>(
    [0, 0, 0],
    { equals: false }
  )

  const render = () => {
    setRotation((rotation) => {
      rotation[0] += 0.0125
      rotation[1] += 0.0125
      return rotation
    })
    requestAnimationFrame(render)
  }
  render()

  return (
    <Scene>
      <For
        each={Array.from({ length: 10 }, (): [number, number, number] => [
          Math.random() * 20 - 10,
          Math.random() * 20 - 10,
          Math.random() * 20 - 20,
        ])}
      >
        {(position) => (
          <Cube position={position} rotation={rotation()} scale={[0.5, 1, 1]} />
        )}
      </For>
      <Group position={[0, 0, -6]}>
        <Cube position={[0, 0, -6]} rotation={[0, 0, 0]} scale={[0.5, 1, 1]}>
          <Cube
            position={[0, 1, 0]}
            rotation={[0, 0.5, 0]}
            scale={[2, 0.5, 1]}
          />
        </Cube>
      </Group>
    </Scene>
  )
}

render(() => <App />, document.getElementById('app')!)
