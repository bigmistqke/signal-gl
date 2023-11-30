import { attribute, GL, glsl, Program, uniform } from '@bigmistqke/signal-gl'
import { createMemo, createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import './index.css'

function App() {
  const vertices = new Float32Array([
    -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
  ])

  const [opacity, setOpacity] = createSignal(0.5)
  const [cameraPosition, setCameraPosition] = createSignal<[number, number]>([
    0, 0,
  ])
  const [zoom, setZoom] = createSignal(1.0)

  const transformedCameraPosition = createMemo(
    () => cameraPosition().map((v) => v / zoom()) as [number, number]
  )
  const u_cameraPosition = uniform.vec2(transformedCameraPosition)
  const u_zoom = uniform.float(zoom)
  const u_opacity = uniform.float(opacity)
  const a_vertices = attribute.vec2(vertices)

  const fragment = glsl`#version 300 es
    precision mediump float;
    in vec2 v_coord; 
    out vec4 outColor;
    
    void main() {
      float opacity = ${u_opacity};
      vec2 scaledCoord = (v_coord - ${u_cameraPosition}) * ${u_zoom};
      outColor = vec4(scaledCoord[0], scaledCoord[1], scaledCoord[0], opacity);
    }`

  const vertex = glsl`#version 300 es
    precision mediump float;

    out vec2 v_coord;  
    out vec3 v_color;
    
    void main() {
      vec2 a_coord = ${a_vertices};
      v_coord = a_coord + ${u_cameraPosition};
      gl_Position = vec4((a_coord - ${u_cameraPosition}) * ${u_zoom}, 0, 1);
    }`

  return (
    <GL
      style={{
        width: '100vw',
        height: '100vh',
      }}
      onMouseMove={(e) => {
        setOpacity(1 - e.clientY / e.currentTarget.offsetHeight)
        setCameraPosition([
          (e.clientX / window.innerWidth - 0.5) * -2,
          (e.clientY / window.innerHeight - 0.5) * 2,
        ])
      }}
      onWheel={(e) => {
        e.preventDefault()
        // Adjust the zoom level based on the mouse wheel input
        setZoom((prevZoom) => prevZoom - e.deltaY * 0.01)
      }}
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
