import { createSignal } from 'solid-js'
import { render } from 'solid-js/web'

import { GL } from './GL'
import { float, shader, vec2 } from './glsl'

function App() {
  const [cursor, setCursor] = createSignal<[number, number]>([1, 1])
  const [buffer, setBuffer] = createSignal<Uint8Array>(
    new Uint8Array(new Array(1024).fill('').map((v) => Math.random() * 255))
  )
  const [resolution, setResolution] = createSignal(
    window.innerWidth / window.innerHeight
  )
  const [time, setTime] = createSignal(1)
  setInterval(() => setTime((time) => time + 1), 1000 / 60)

  const fragment = shader`#version 300 es
precision mediump float;
in vec2 v_coord; 
out vec4 outColor;

void main() {
  float resolution = ${float(resolution)};
  vec2 cursor = ${vec2(cursor)};
  float lengthX = length(v_coord.x - cursor.x);
  float lengthY = length(v_coord.y - cursor.y);

  if(lengthX < 0.25 && lengthY < 0.25 * resolution){
    outColor = vec4(1,0,0,1.0);
  }else{
    outColor = vec4(0,1,0,1.0);
  }
}`

  const vertex = shader`#version 300 es
in vec2 a_coord;
out vec2 v_coord;  

void main() {
  v_coord = a_coord - ${vec2(cursor)};
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
      fragment={fragment}
      vertex={vertex}
    />
  )
}

render(() => <App />, document.getElementById('app')!)
