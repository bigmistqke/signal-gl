import { createComponent } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/web/dist/server.js';
import { C as Canvas, g as glsl, a as attribute, u as uniform, P as Program } from './XEQHI3TD-da61e201.mjs';
import { createSignal, Index, untrack, mergeProps, batch } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/dist/server.js';
import './get-6158dfbd.mjs';
import 'node:crypto';
import 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/@solid-primitives+scheduled@1.4.1_solid-js@1.8.7/node_modules/@solid-primitives/scheduled/dist/index.js';

const planeVertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1].map((v) => v / 2));
const Plane = (props) => {
  const merged = mergeProps({
    rotation: 0,
    scale: [1, 1],
    position: [0, 0]
  }, props);
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
    }`;
  return createComponent(Program, {
    cacheEnabled: true,
    get fragment() {
      return props.fragment;
    },
    vertex,
    mode: "TRIANGLES",
    get count() {
      return planeVertices.length / 2;
    }
  });
};
function updateBoids(boids, width = 200, height = 200, deltaTime = 1) {
  for (let i = 0; i < boids.length; i++) {
    let {
      x,
      y,
      z,
      vx,
      vy,
      vz
    } = boids[i];
    x += vx * deltaTime;
    y += vy * deltaTime;
    z += vz * deltaTime;
    x = (x + width) % width;
    y = (y + height) % height;
    boids[i] = {
      x,
      y,
      z,
      vx,
      vy,
      vz
    };
  }
}
const AMOUNT = 5e3;
function App() {
  const [boids, setBoids] = createSignal(new Array(AMOUNT).fill("").map(() => ({
    x: Math.random() * 200 - 50,
    y: Math.random() * 200 - 50,
    z: Math.random() * 200 - 50,
    vx: Math.random() - 0.5,
    vy: Math.random() - 0.5,
    vz: Math.random() - 0.5
  })), {
    equals: false
  });
  const loop = () => {
    requestAnimationFrame(loop);
    updateBoids(boids());
    batch(() => setBoids((boids2) => boids2));
  };
  loop();
  const fragment = (blue) => glsl`#version 300 es
   precision mediump float;
   in vec2 v_coord; 
   out vec4 outColor;
   void main() {
     float blue = ${uniform.float(blue)};
     outColor = vec4(0, 0.0, blue, 0.25);
   }`;
  return createComponent(Canvas, {
    style: {
      width: "100vw",
      height: "100vh",
      background: "black"
    },
    onProgramCreate: () => {
      console.log("created a program");
    },
    get children() {
      return createComponent(Index, {
        get each() {
          return boids();
        },
        children: (boid, index) => {
          return createComponent(Plane, {
            get fragment() {
              return fragment(0.5 - index / untrack(() => boids().length));
            },
            scale: [0.0125, 0.0125],
            get position() {
              return [boid().x / 100 - 1, boid().y / 100 - 1];
            }
          });
        }
      });
    }
  });
}

export { App as default };
//# sourceMappingURL=03_caching_shaders-f9fe47a5.mjs.map
