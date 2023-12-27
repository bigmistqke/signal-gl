import {
  Canvas,
  Program,
  ShaderToken,
  attribute,
  glsl,
  uniform,
  type BufferArray,
} from '@bigmistqke/signal-gl'
import { Accessor, createSignal } from 'solid-js'

const Plane = (props: {
  vertices: BufferArray | Accessor<BufferArray>
  fragment: ShaderToken
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
      vertex={vertex}
      fragment={props.fragment}
      mode="TRIANGLES"
      count={props.vertices.length / 2}
    />
  )
}

export default function () {
  const [opacity, setOpacity] = createSignal(0.5)
  const [cursor, setCursor] = createSignal<[number, number]>([1, 1])

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
        discard;
      }
    }`

  return (
    <Canvas
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
      <Plane
        fragment={glsl`#version 300 es
          precision mediump float;
          in vec2 v_coord; 
          out vec4 outColor;
          void main() {
            float opacity = ${uniform.float(opacity)};
            outColor = vec4(v_coord[0], v_coord[1], v_coord[0], opacity);
          }`}
        vertices={
          new Float32Array([
            -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
          ])
        }
      />
      <Plane
        fragment={glsl`#version 300 es
          precision mediump float;
          ${getColor}

          in vec2 v_coord; 
          out vec4 outColor;

          void main() {
            outColor = getColor(vec3(1.0, 0.0, 0.0), v_coord);
          }`}
        vertices={
          new Float32Array([
            -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5,
          ])
        }
      />
    </Canvas>
  )
}
