import { createSignal } from 'solid-js'
import { render } from 'solid-js/web'

import { GL, Program, attribute, glsl, uniform } from '@bigmistqke/signal-gl'

import './index.css'

function App() {
  const [cursor, setCursor] = createSignal<[number, number]>([1, 1])
  const [vertices] = createSignal(
    new Float32Array([
      -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
    ]),
    { equals: false }
  )
  const [colors, setColors] = createSignal(
    new Float32Array(new Array(6 * 3).fill('').map((v) => Math.random())),
    { equals: false }
  )

  setInterval(() => {
    setColors((colors) => {
      colors[0] += 0.001
      colors[10] += 0.002

      if (colors[0] > 1) colors[0] = 0
      if (colors[10] > 1) colors[10] = 0

      return colors
    })
  })

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
        return vec4(color, 1.0);
      }
    }`

  const fragment = glsl`#version 300 es
    precision mediump float;
    ${getColor}

    in vec2 v_coord; 
    in vec3 v_color;
    out vec4 outColor;

    void main() {
      outColor = getColor(v_color, v_coord);
    }`

  const vertex = glsl`#version 300 es

    out vec2 v_coord;  
    out vec3 v_color;

    void main() {
      vec2 a_coord = ${attribute.vec2(vertices)};
      v_color = ${attribute.vec3(colors)};
      v_coord = a_coord - ${uniform.vec2(cursor)};
      gl_Position = vec4(a_coord, 0, 1) ;
    }`

  return (
    <GL
      style={{
        width: '100%',
        height: '100vh',
      }}
      onMouseMove={(e) =>
        setCursor([
          e.clientX / e.currentTarget.clientWidth - 0.5,
          (e.currentTarget.clientHeight - e.clientY) /
            e.currentTarget.clientHeight -
            0.5,
        ])
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
