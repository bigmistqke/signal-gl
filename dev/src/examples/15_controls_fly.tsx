import { glsl, Vector3 } from '@bigmistqke/signal-gl'
import { Camera, fly, loadOBJ, Scene, Shape } from '@bigmistqke/signal-gl/world'
import { For, Show } from 'solid-js'
import { render } from 'solid-js/web'
import './index.css'

const SIZE = 100

const randomPose = () => ({
  rotation: [
    Math.random() * SIZE - SIZE / 2,
    Math.random() * SIZE - SIZE / 2,
    Math.random() * SIZE - SIZE / 2,
  ] as Vector3,
  position: [
    Math.random() * SIZE - SIZE / 2,
    Math.random() * SIZE - SIZE / 2,
    Math.random() * SIZE - SIZE / 2,
  ] as Vector3,
})

const App = () => {
  const obj = loadOBJ('./teapot.obj')
  return (
    <Scene background={[1, 0, 0, 1]}>
      <For each={Array.from({ length: 1000 }).map(randomPose)}>
        {(pose) => (
          <Show when={obj()}>
            <Shape
              {...obj()!}
              rotation={pose.rotation}
              position={pose.position}
              opacity={1}
              fragment={glsl`#version 300 es
                precision mediump float;
                in vec4 view;
                out vec4 fragColor;
                void main() {
                    vec3 dpdx = dFdx(view.xyz);
                    vec3 dpdy = dFdy(view.xyz);
                    vec3 normal = normalize(cross(dpdx, dpdy));
                    fragColor = vec4(abs(normal.x), abs(normal.x), abs(normal.x), 1);
                }
              `}
            />
          </Show>
        )}
      </For>
      <Camera {...fly()} active fov={33} />
    </Scene>
  )
}

render(() => <App />, document.getElementById('app')!)
