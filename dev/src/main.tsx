import { Program, Stack, attribute, glsl, uniform } from '@bigmistqke/signal-gl'
import { mat4 } from 'gl-matrix'
import { Component, createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import './index.css'

const Cube: Component<{
  projection: mat4
  position: [number, number, number]
}> = (props) => {
  const _modelView = mat4.create()
  const [modelView, setModelView] = createSignal(
    mat4.translate(_modelView, _modelView, props.position),
    {
      equals: false,
    }
  )

  const a_positions = attribute.vec3(
    // prettier-ignore
    new Float32Array([
      // Front face
      -1, -1,  1,    1, -1,  1,    1,  1,  1,   -1,  1,  1,
      // Back face
      -1, -1, -1,   -1,  1, -1,    1,  1, -1,    1, -1, -1,
      // Top face
      -1,  1, -1,   -1,  1,  1,    1,  1,  1,    1,  1, -1,
      // Bottom face
      -1, -1, -1,    1, -1, -1,    1, -1,  1,   -1, -1,  1,
      // Right face
       1, -1, -1,    1,  1,  -1,    1,  1,  1,    1, -1,  1,
      // Left face
      -1, -1, -1,   -1, -1,  1,   -1,  1,  1,   -1,  1, -1,
    ])
  )

  const a_colors = attribute.vec3(
    // prettier-ignore
    new Float32Array([
      // Front face
      1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,
      // Back face
      1, 1, 0,   1, 1, 0,   1, 1, 0,   1, 1, 0,
      // Top face
      0, 1, 1,   0, 1, 1,   0, 1, 1,   0, 1, 1,
      // Bottom face
      0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,
      // Right face
      1, 0, 1,   1, 0, 1,   1, 0, 1,   1, 0, 1,
      // Left face
      0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,
    ])
  )

  // prettier-ignore
  const indices = [
    // Front face
    0,   1,  2,  0,  2,  3,
    // Back face
    4,   5,  6,  4,  6,  7,
    // Top face
    8,   9, 10,  8, 10, 11,
    // Bottom face
    12, 13, 14, 12, 14, 15,
    // Right face
    16, 17, 18, 16, 18, 19,
    // Left face
    20, 21, 22, 20, 22, 23,
  ]

  const render = () => (
    setModelView((matrix) => mat4.rotate(matrix, matrix, 0.05, [1, 1, 1])),
    requestAnimationFrame(render)
  )
  render()
  return (
    <>
      <Program
        // prettier-ignore
        vertex={
          glsl`#version 300 es
          precision mediump float;
          out vec3 color_in;
          void main(void) {
            color_in = ${a_colors};
            gl_Position = ${uniform.mat4(props.projection)} * ${uniform.mat4(modelView)} * vec4(${a_positions}, 1.);
          }`
        }
        // prettier-ignore
        fragment={
          glsl`#version 300 es
          precision mediump float;
          in vec3 color_in;
          out vec4 color_out;
          void main(void) {
            color_out = vec4(color_in, 1.);
          }`
        }
        mode="TRIANGLES"
        indices={indices}
        cacheEnabled
      />
    </>
  )
}

function App() {
  const [canvas, setCanvas] = createSignal<HTMLCanvasElement>(null!)
  const [projection, setProjection] = createSignal(mat4.create(), {
    equals: false,
  })

  const onResize = () => {
    setProjection(
      mat4.perspective(
        mat4.create(),
        (45 * Math.PI) / 180,
        canvas().clientWidth / canvas().clientHeight,
        0.1,
        10000.0
      )
    )
  }

  return (
    <Stack ref={setCanvas} onResize={onResize}>
      <Cube projection={projection()} position={[0, 0, -10]} />
      <Cube projection={projection()} position={[0, -2, -5]} />
    </Stack>
  )
}

render(() => <App />, document.getElementById('app')!)
