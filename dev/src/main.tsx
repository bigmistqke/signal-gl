import {
  GL,
  Program,
  ShaderToken,
  attribute,
  glsl,
  uniform,
} from '@bigmistqke/signal-gl'
import { Accessor, Index, batch, createSignal, untrack } from 'solid-js'
import { render } from 'solid-js/web'

import './index.css'
const planeVertices = new Float32Array(
  [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0].map(
    (v) => v / 2
  )
)
const Plane = (props: {
  fragment: Accessor<ShaderToken>
  rotation?: number
  scale?: [number, number]
  position?: [number, number]
}) => {
  const vertex = glsl`#version 300 es
    out vec2 v_coord;  
    out vec3 v_color;
    void main() {
      vec2 a_coord = ${attribute.vec2(planeVertices)};
      float rotation =  ${uniform.float(() => props.rotation || 0)};
      vec2 scale =  ${uniform.vec2(() => props.scale || [1, 1])};
      vec2 translation = ${uniform.vec2(() => props.position || [0, 0])};

      // Scaling
      mat3 scaleMatrix = mat3(
          scale.x, 0, 0,
          0, scale.y, 0,
          0, 0, 1
      );

      // Convert angle to radians
      float angle = radians(rotation);
      float c = cos(angle);
      float s = sin(angle);

      // Rotation
      mat3 rotateMatrix = mat3(
          c, -s, 0,
          s, c, 0,
          0, 0, 1
      );

      // Combine transformations
      mat3 transformMatrix = rotateMatrix * scaleMatrix;

      // Apply the transformation
      a_coord = (transformMatrix * vec3(a_coord, 1.0)).xy;
      v_coord = a_coord;
      gl_Position = vec4(a_coord + translation, 1.0, 1.0);
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

type Boid = {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
}

function updateBoids(boids: Boid[], width = 200, height = 200, deltaTime = 1) {
  return boids.map((boid) => {
    let { x, y, z, vx, vy, vz } = boid
    x += vx * deltaTime
    y += vy * deltaTime
    z += vz * deltaTime
    // Wrap around edges
    x = (x + width) % width
    y = (y + height) % height
    return { x, y, z, vx, vy, vz }
  })
}

const AMOUNT = 1000

function App() {
  const [boids, setBoids] = createSignal<
    {
      x: number
      y: number
      z: number
      vx: number
      vy: number
      vz: number
    }[]
  >(
    new Array(AMOUNT).fill('').map(() => ({
      x: Math.random() * 200 - 50,
      y: Math.random() * 200 - 50,
      z: Math.random() * 200 - 50,
      vx: Math.random() - 0.5,
      vy: Math.random() - 0.5,
      vz: Math.random() - 0.5,
    }))
  )

  setInterval(() => batch(() => setBoids((boids) => updateBoids(boids))), 10)

  const fragment = (blue: number) => glsl`#version 300 es
   precision mediump float;
   in vec2 v_coord; 
   out vec4 outColor;
   void main() {
     float blue = ${uniform.float(blue)};
     outColor = vec4(v_coord[0], v_coord[1], blue, 0.5);
   }`

  return (
    <GL
      style={{
        width: '100vw',
        height: '100vh',
      }}
      onProgramCreate={() => {
        console.log('created a program')
      }}
    >
      <Index each={boids()}>
        {(boid, index) => {
          return (
            <Plane
              fragment={fragment(index / untrack(() => boids().length))}
              scale={[0.03, 0.03]}
              position={[boid().x / 100 - 1, boid().y / 100 - 1]}
            />
          )
        }}
      </Index>
    </GL>
  )
}

render(() => <App />, document.getElementById('app')!)
