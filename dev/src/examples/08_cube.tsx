import { Canvas, Program } from '@bigmistqke/signal-gl'
import { attribute, glsl, uniform } from '@core/template'
import { mat4 } from 'gl-matrix'
import { createEffect, createSignal, untrack } from 'solid-js'
import { render } from 'solid-js/web'
import './index.css'

function App() {
  const [canvas, setCanvas] = createSignal<HTMLCanvasElement>(null!)

  const [projectionMatrix, setProjectionMatrix] = createSignal<mat4>(
    mat4.create(),
    { equals: false }
  )
  const [modelViewMatrix, setModelViewMatrix] = createSignal<mat4>(
    mat4.create(),
    { equals: false }
  )

  const render = () => {
    const _modelViewMatrix = mat4.create()

    mat4.translate(_modelViewMatrix, _modelViewMatrix, [0.0, 0.0, -6.0])
    mat4.rotate(
      _modelViewMatrix,
      _modelViewMatrix,
      performance.now() / 1_000,
      [1, 1, 1]
    )
    setModelViewMatrix(_modelViewMatrix)
    requestAnimationFrame(render)
  }

  createEffect(() => {
    if (!canvas()) return
    untrack(render)
    const _projectionMatrix = untrack(projectionMatrix)
    mat4.perspective(
      _projectionMatrix,
      (90 * Math.PI) / 180,
      canvas().clientWidth / canvas().clientHeight,
      0.1,
      100.0
    )
    setProjectionMatrix(_projectionMatrix)
  })

  const u_projectionMatrix = uniform.mat4(projectionMatrix)
  const u_modelViewMatrix = uniform.mat4(modelViewMatrix)

  const a_positions = attribute.vec3(
    new Float32Array([
      // Front face
      // Vertex 1
      -0.5, -0.5, 0.5,
      // Vertex 2
      0.5, -0.5, 0.5,
      // Vertex 2
      0.5, 0.5, 0.5,
      // Vertex 3
      -0.5, -0.5, 0.5,
      // Vertex 1
      0.5, 0.5, 0.5,
      // Vertex 3
      -0.5, 0.5, 0.5,
      // Vertex 4
      // Back face
      -0.5, -0.5, -0.5,
      // Vertex 5
      0.5, -0.5, 0.5,
      // Vertex 6
      0.5, 0.5, -0.5,
      // Vertex 7
      -0.5, -0.5, -0.5,
      // Vertex 5
      0.5, 0.5, -0.5,
      // Vertex 7
      -0.5, 0.5, -0.5,
      // Vertex 8
      // Top face
      -0.5, 0.5, -0.5,
      // Vertex 8
      0.5, 0.5, -0.5,
      // Vertex 7
      0.5, 0.5, 0.5,
      // Vertex 3
      -0.5, 0.5, -0.5,
      // Vertex 8
      0.5, 0.5, 0.5,
      // Vertex 3
      -0.5, 0.5, 0.5,
      // Vertex 4
      // Bottom face
      -0.5, -0.5, -0.5,
      // Vertex 5
      0.5, -0.5, -0.5,
      // Vertex 6
      0.5, -0.5, 0.5,
      // Vertex 2
      -0.5, -0.5, -0.5,
      // Vertex 5
      0.5, -0.5, 0.5,
      // Vertex 2
      -0.5, -0.5, 0.5,
      // Vertex 1
      // Right face
      0.5, -0.5, -0.5,
      // Vertex 6
      0.5, 0.5, -0.5,
      // Vertex 7
      0.5, 0.5, 0.5,
      // Vertex 3
      0.5, -0.5, -0.5,
      // Vertex 6
      0.5, 0.5, 0.5,
      // Vertex 3
      0.5, -0.5, 0.5,
      // Vertex 2
      // Left face
      -0.5, -0.5, -0.5,
      // Vertex 5
      -0.5, 0.5, -0.5,
      // Vertex 8
      -0.5, 0.5, 0.5,
      // Vertex 4
      -0.5, -0.5, -0.5,
      // Vertex 5
      -0.5, 0.5, 0.5,
      // Vertex 4
      -0.5, -0.5, 0.5,
      // Vertex 1
    ])
  )

  // Vertex shader program
  const vsSource = glsl`#version 300 es
out lowp vec4 vColor;
void main(void) {
    gl_Position = ${u_projectionMatrix} * ${u_modelViewMatrix} * vec4(${a_positions}, 1);
}
`

  // Fragment shader program
  const fsSource = glsl`#version 300 es
precision mediump float;
in lowp vec4 vColor;
out vec4 color;
void main(void) {
  
  color = vec4(1.,0.,0.,1.);
}
`

  return (
    <Canvas ref={setCanvas}>
      <Program
        ref={setCanvas}
        vertex={vsSource}
        fragment={fsSource}
        mode="TRIANGLES"
        count={36}
      />
    </Canvas>
  )
}

render(() => <App />, document.getElementById('app')!)
