import { glsl, Vector3 } from '@bigmistqke/signal-gl'
import {
  Camera,
  loadOBJ,
  orbit,
  Scene,
  Shape,
} from '@bigmistqke/signal-gl/world'
import { Show } from 'solid-js'
import { render } from 'solid-js/web'
import './index.css'

const Teapot = (props: { rotation?: Vector3; position?: Vector3 }) => {
  const obj = loadOBJ('./teapot.obj')
  return (
    <Show when={obj()}>
      <Shape
        {...obj()!}
        rotation={props.rotation}
        position={props.position}
        color={[0, 0, 1]}
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
  )
}

render(
  () => (
    <Scene background={[1, 0, 0, 1]}>
      <Teapot />
      <Camera {...orbit({ target: [0, 1, 0], near: 3 })} active fov={33} />
    </Scene>
  ),
  document.getElementById('app')!
)
