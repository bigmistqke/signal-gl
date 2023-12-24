import { Camera, loadOBJ, Scene, Shape } from '@bigmistqke/signal-gl/world'
import { createSignal, Suspense } from 'solid-js'
import { render } from 'solid-js/web'
import './index.css'

const App = () => {
  const obj = loadOBJ('./teapot.obj')
  const [rotation, setRotation] = createSignal(0)
  setInterval(() => setRotation((r) => r + 0.01))
  return (
    <Suspense>
      <Shape
        {...obj()!}
        rotation={[0, rotation(), 0]}
        color={[0, 0, 1]}
        opacity={1}
        position={[0, -2, -10]}
      />
    </Suspense>
  )
}

render(
  () => (
    <Scene>
      <Camera position={[0, 0, 0]} active />
      <App />
    </Scene>
  ),
  document.getElementById('app')!
)
