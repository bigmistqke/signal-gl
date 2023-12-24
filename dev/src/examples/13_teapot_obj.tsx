import { glsl } from '@bigmistqke/signal-gl'
import { Camera, loadOBJ, Scene, Shape } from '@bigmistqke/signal-gl/world'
import { createSignal, Show } from 'solid-js'
import { render } from 'solid-js/web'
import './index.css'

const App = () => {
  const obj = loadOBJ('./teapot.obj')
  const [rotation, setRotation] = createSignal(0)
  const loop = () => {
    requestAnimationFrame(loop)
    setRotation((r) => r + 0.01)
  }
  loop()
  return (
    <Show when={obj()}>
      <Shape
        {...obj()!}
        rotation={[0, rotation(), 0]}
        color={[1, 1, 0]}
        opacity={1}
        position={[-5, -2, -10]}
      />
      <Shape
        {...obj()!}
        rotation={[0, rotation(), 0]}
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
              fragColor = vec4(vec3(abs(normal.x) + abs(normal.y)), 1);
          }
        `}
      />
      <Shape
        {...obj()!}
        rotation={[0, rotation(), 0]}
        color={[0, 0, 1]}
        opacity={1}
        position={[5, -2, -10]}
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
    </Show>
  )
}

render(
  () => (
    <Scene background={[1, 0, 0, 1]}>
      <Camera position={[0, 0, 0]} active />
      <App />
    </Scene>
  ),
  document.getElementById('app')!
)
