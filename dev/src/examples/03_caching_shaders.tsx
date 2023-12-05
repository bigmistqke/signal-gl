import {
  GL,
  Program,
  attribute,
  glsl,
  uniform,
  type ShaderToken,
} from '@bigmistqke/signal-gl'
import {
  Index,
  batch,
  createSignal,
  mergeProps,
  untrack,
  type Accessor,
} from 'solid-js'
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
  const merged = mergeProps(
    {
      rotation: 0,
      scale: [1, 1] as [number, number],
      position: [0, 0] as [number, number],
    },
    props
  )

  const vertex = glsl`#version 300 es
    out vec2 v_coord;  
    out vec3 v_color;
    void main() {
      vec2 a_coord = ${attribute.vec2(planeVertices)};
      float rotation =  ${uniform.float(() => merged.rotation)};
      vec2 scale =  ${uniform.vec2(() => merged.scale)};
      vec2 translation = ${uniform.vec2(() => merged.position)};

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
      count={planeVertices.length / 2}
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
  for (let i = 0; i < boids.length; i++) {
    let { x, y, z, vx, vy, vz } = boids[i]!
    x += vx * deltaTime
    y += vy * deltaTime
    z += vz * deltaTime
    // Wrap around edges
    x = (x + width) % width
    y = (y + height) % height
    boids[i] = { x, y, z, vx, vy, vz }
  }
}

const AMOUNT = 5000

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
    })),
    { equals: false }
  )

  const loop = () => {
    requestAnimationFrame(loop)
    updateBoids(boids())
    batch(() => setBoids((boids) => boids))
  }
  loop()

  const fragment = (blue: number) => glsl`#version 300 es
   precision mediump float;
   in vec2 v_coord; 
   out vec4 outColor;
   void main() {
     float blue = ${uniform.float(blue)};
     outColor = vec4(0, 0.0, blue, 0.25);
   }`

  return (
    <GL
      style={{
        width: '100vw',
        height: '100vh',
        background: 'black',
      }}
      onProgramCreate={() => {
        console.log('created a program')
      }}
    >
      <Index each={boids()}>
        {(boid, index) => {
          return (
            <Plane
              fragment={fragment(0.5 - index / untrack(() => boids().length))}
              scale={[0.0125, 0.0125]}
              position={[boid().x / 100 - 1, boid().y / 100 - 1]}
            />
          )
        }}
      </Index>
    </GL>
  )
}

render(() => <App />, document.getElementById('app')!)
