import { Billboard, Camera, Scene, fly } from '@bigmistqke/signal-gl/world'
import { For, createSignal } from 'solid-js'
import { render } from 'solid-js/web'

import { Vector3, glsl, uniform } from '@bigmistqke/signal-gl'
import './index.css'

const randomVector3 = (size = 50) =>
  [
    Math.random() * size - size / 2,
    Math.random() * size - size / 2,
    Math.random() * size - size / 2,
  ] as Vector3

const randomBillboard = () => ({
  position: randomVector3(),
  color: randomVector3(3),
  scale: Math.random(),
})

const [time, setTime] = createSignal(0)

const loop = (now: number) => {
  requestAnimationFrame(loop)
  setTime(now)
}
requestAnimationFrame(loop)

render(() => {
  return (
    <Scene background={[...randomVector3(3), 1]}>
      <Camera active position={[0, 0, 10]} {...fly()} />
      <For each={Array.from({ length: 1000 }).map(randomBillboard)}>
        {({ position, color, scale }) => (
          <Billboard
            position={position.map(
              (v, i) => v + Math.sin(((time() / position[i]) * scale) / 1000)
            )}
            color={color}
            scale={[scale, scale, scale]}
            // prettier-ignore
            fragment={glsl`#version 300 es
              precision mediump float;
              out vec4 color_out;
              in vec2 uv;
              void main(void) {
                float radius = distance(uv, vec2(0.5, 0.5));
                if(radius > 0.5){
                  discard;
                }else{
                  vec3 color = ${uniform.vec3(() => color)};
                  float x = sin(color.x + ${uniform.float(time)} * ${uniform.float(scale)} / 1000.) / 2. + 0.5;
                  float y = cos(color.y + ${uniform.float(time)} * ${uniform.float(scale)} / 1000.) / 2. + 0.5;
                  float z = cos(color.z + ${uniform.float(time)} * ${uniform.float(scale)} / 1000.) / 2. + 0.5;

                  color_out = vec4(x, y, z, 0.5);
                }
              }`}
          />
        )}
      </For>
    </Scene>
  )
}, document.getElementById('app')!)
