import {
  GL,
  Program,
  ShaderToken,
  attribute,
  glsl,
  uniform,
  type Buffer,
} from '@bigmistqke/signal-gl'
import { Accessor, createSignal } from 'solid-js'
import { render } from 'solid-js/web'

import './index.css'

const Plane = (props: {
  vertices: Buffer | Accessor<Buffer>
  fragment: Accessor<ShaderToken>
}) => {
  const vertex = glsl`#version 300 es
    out vec2 v_coord;  
    out vec3 v_color;
    void main() {
      vec2 a_coord = ${attribute.vec2(props.vertices)};
      v_coord = a_coord;
      gl_Position = vec4(a_coord, 0, 1.0);
    }`

  return (
    <Program
      cacheEnabled
      fragment={props.fragment}
      vertex={vertex}
      mode="TRIANGLES"
    />
  )
}

function App() {
  const [opacity, setOpacity] = createSignal(0.5)

  const fragment = (blue: number) => glsl`#version 300 es
   precision mediump float;
   in vec2 v_coord; 
   out vec4 outColor;
   void main() {
     float opacity = ${uniform.float(opacity)};
     float blue = ${uniform.float(blue)};
     outColor = vec4(v_coord[0], v_coord[1], blue, opacity);
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
      onProgramCreate={() => {
        console.log('created a program')
      }}
    >
      <Plane
        fragment={fragment(1)}
        vertices={
          new Float32Array([
            -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
          ])
        }
      />

      <Plane
        fragment={fragment(0.5)}
        vertices={
          new Float32Array([
            -0, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5,
          ])
        }
      />
    </GL>
  )
}

render(() => <App />, document.getElementById('app')!)
