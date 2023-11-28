import { attribute, GL, glsl, Program, uniform } from '@bigmistqke/signal-gl'
import { createSignal } from 'solid-js'
import { render } from 'solid-js/web'

import './index.css'

function App() {
  const [vertices] = createSignal(
    new Float32Array([
      -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
    ])
  )

  const [vertices2] = createSignal(
    new Float32Array([
      -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5,
    ])
  )
  const [opacity, setOpacity] = createSignal(0.5)
  const [cursor, setCursor] = createSignal<[number, number]>([1, 1])

  const fragment = glsl`#version 300 es
    precision mediump float;
    in vec2 v_coord; 
    out vec4 outColor;
    void main() {
      float opacity = ${uniform.float(opacity)};
      outColor = vec4(v_coord[0], v_coord[1], v_coord[0], opacity);
    }`

  const getColor = glsl`
    float ${'getLength'}(float x, float y){
      return length(x - y);
    }

    vec4 getColor(vec3 color, vec2 coord){
      vec2 cursor = ${uniform.vec2(cursor)};

      float lengthX = ${'getLength'}(cursor.x, coord.x);
      float lengthY = ${'getLength'}(cursor.y, coord.y);

      if(lengthX < 0.25 && lengthY < 0.25){
        return vec4(1. - color, 1.0);
      }else{
        return vec4(vec3(0.0), 0.0);
      }
    }`

  const fragment2 = glsl`#version 300 es
    precision mediump float;
    ${getColor}

    in vec2 v_coord; 
    out vec4 outColor;

    void main() {
      outColor = getColor(vec3(1.0, 0.0, 0.0), v_coord);
    }`

  const vertex = glsl`#version 300 es
    out vec2 v_coord;  
    out vec3 v_color;
    void main() {
      vec2 a_coord = ${attribute.vec2(vertices)};
      v_coord = a_coord;
      gl_Position = vec4(a_coord, 0, 1) ;
    }`

  const vertex2 = glsl`#version 300 es
    out vec2 v_coord;  
    out vec3 v_color;
    void main() {
      vec2 a_coord = ${attribute.vec2(vertices2)};
      v_coord = a_coord;
      gl_Position = vec4(a_coord, 1, 1) ;
    }`

  return (
    <GL
      style={{
        width: '100vw',
        height: '100vh',
      }}
      onMouseMove={(e) => {
        setOpacity(1 - e.clientY / e.currentTarget.offsetHeight)
        setCursor([
          2 * (e.clientX / e.currentTarget.clientWidth) - 1,
          2 *
            ((e.currentTarget.clientHeight - e.clientY) /
              e.currentTarget.clientHeight) -
            1,
        ])
      }}
    >
      <Program fragment={fragment} vertex={vertex} mode="TRIANGLES" />
      <Program fragment={fragment2} vertex={vertex2} mode="TRIANGLES" />
    </GL>
  )
}

render(() => <App />, document.getElementById('app')!)
