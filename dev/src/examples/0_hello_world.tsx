import { attribute, GL, glsl, Program, uniform } from '@bigmistqke/signal-gl'
import { createSignal } from 'solid-js'
import { render } from 'solid-js/web'

import './index.css'

function App() {
  const [vertices] = createSignal(
    new Float32Array([
      -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
    ]),
    { equals: false }
  )
  const [opacity, setOpacity] = createSignal(0.5)

  const fragment = glsl`#version 300 es
    precision mediump float;
    in vec2 v_coord; 
    out vec4 outColor;
    void main() {
      float opacity = ${uniform.float(opacity)};
      outColor = vec4(v_coord[0], v_coord[1], v_coord[0], opacity);
    }`

  const vertex = glsl`#version 300 es
    out vec2 v_coord;  
    out vec3 v_color;
    void main() {
      vec2 a_coord = ${attribute.vec2(vertices)};
      v_coord = a_coord;
      gl_Position = vec4(a_coord, 0, 1) ;
    }`

  return (
    <GL
      style={{
        width: '100vw',
        height: '100vh',
      }}
      onMouseMove={(e) =>
        setOpacity(1 - e.clientY / e.currentTarget.offsetHeight)
      }
    >
      <Program
        fragment={fragment}
        vertex={vertex}
        mode="TRIANGLES"
        count={vertices.length / 2}
      />
    </GL>
  )
}

render(() => <App />, document.getElementById('app')!)
