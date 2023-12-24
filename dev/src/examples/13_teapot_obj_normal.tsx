import { glsl } from '@bigmistqke/signal-gl'
import { Camera, loadOBJ, Scene, Shape } from '@bigmistqke/signal-gl/world'
import { BufferArray, UniformProxy } from '@core/types'
import { createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import './index.css'

const interweave = (buffer: BufferArray, schema: (keyof UniformProxy)[]) => {
  return
}

const App = () => {
  const obj = loadOBJ('./teapot.obj')
  const [rotation, setRotation] = createSignal(0)
  setInterval(() => setRotation((r) => r + 0.01))
  return (
    <Shape
      {...obj()!}
      color={[0, 0, 1]}
      opacity={1}
      position={[0, -2, -10]}
      fragment={glsl`#version 300 es
          precision mediump float;
          in vec4 position;
          out vec4 fragColor;
          void main() {
              vec3 dpdx = dFdx(position.xyz);
              vec3 dpdy = dFdy(position.xyz);
              vec3 normal = normalize(cross(dpdx, dpdy));
              
              fragColor = vec4(normal, 1.0);
          }
        `}
    />
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
