import { createComponent } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/web/dist/server.js';
import { u as uniform, a as attribute, g as glsl, C as Canvas, P as Program } from './XEQHI3TD-da61e201.mjs';
import { mat4 } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/gl-matrix@3.4.3/node_modules/gl-matrix/cjs/index.js';
import { createSignal, createEffect, untrack } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/dist/server.js';
import './get-6158dfbd.mjs';
import 'node:crypto';
import 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/@solid-primitives+scheduled@1.4.1_solid-js@1.8.7/node_modules/@solid-primitives/scheduled/dist/index.js';

function _08_cube() {
  const [canvas, setCanvas] = createSignal(null);
  const [projectionMatrix, setProjectionMatrix] = createSignal(mat4.create(), {
    equals: false
  });
  const [modelViewMatrix, setModelViewMatrix] = createSignal(mat4.create(), {
    equals: false
  });
  const render = () => {
    const _modelViewMatrix = mat4.create();
    mat4.translate(_modelViewMatrix, _modelViewMatrix, [0, 0, -6]);
    mat4.rotate(_modelViewMatrix, _modelViewMatrix, performance.now() / 1e3, [1, 1, 1]);
    setModelViewMatrix(_modelViewMatrix);
    requestAnimationFrame(render);
  };
  createEffect(() => {
    if (!canvas())
      return;
    untrack(render);
    const _projectionMatrix = untrack(projectionMatrix);
    mat4.perspective(_projectionMatrix, 90 * Math.PI / 180, canvas().clientWidth / canvas().clientHeight, 0.1, 100);
    setProjectionMatrix(_projectionMatrix);
  });
  const u_projectionMatrix = uniform.mat4(projectionMatrix);
  const u_modelViewMatrix = uniform.mat4(modelViewMatrix);
  const a_positions = attribute.vec3(new Float32Array([
    // Front face
    // Vertex 1
    -0.5,
    -0.5,
    0.5,
    // Vertex 2
    0.5,
    -0.5,
    0.5,
    // Vertex 2
    0.5,
    0.5,
    0.5,
    // Vertex 3
    -0.5,
    -0.5,
    0.5,
    // Vertex 1
    0.5,
    0.5,
    0.5,
    // Vertex 3
    -0.5,
    0.5,
    0.5,
    // Vertex 4
    // Back face
    -0.5,
    -0.5,
    -0.5,
    // Vertex 5
    0.5,
    -0.5,
    0.5,
    // Vertex 6
    0.5,
    0.5,
    -0.5,
    // Vertex 7
    -0.5,
    -0.5,
    -0.5,
    // Vertex 5
    0.5,
    0.5,
    -0.5,
    // Vertex 7
    -0.5,
    0.5,
    -0.5,
    // Vertex 8
    // Top face
    -0.5,
    0.5,
    -0.5,
    // Vertex 8
    0.5,
    0.5,
    -0.5,
    // Vertex 7
    0.5,
    0.5,
    0.5,
    // Vertex 3
    -0.5,
    0.5,
    -0.5,
    // Vertex 8
    0.5,
    0.5,
    0.5,
    // Vertex 3
    -0.5,
    0.5,
    0.5,
    // Vertex 4
    // Bottom face
    -0.5,
    -0.5,
    -0.5,
    // Vertex 5
    0.5,
    -0.5,
    -0.5,
    // Vertex 6
    0.5,
    -0.5,
    0.5,
    // Vertex 2
    -0.5,
    -0.5,
    -0.5,
    // Vertex 5
    0.5,
    -0.5,
    0.5,
    // Vertex 2
    -0.5,
    -0.5,
    0.5,
    // Vertex 1
    // Right face
    0.5,
    -0.5,
    -0.5,
    // Vertex 6
    0.5,
    0.5,
    -0.5,
    // Vertex 7
    0.5,
    0.5,
    0.5,
    // Vertex 3
    0.5,
    -0.5,
    -0.5,
    // Vertex 6
    0.5,
    0.5,
    0.5,
    // Vertex 3
    0.5,
    -0.5,
    0.5,
    // Vertex 2
    // Left face
    -0.5,
    -0.5,
    -0.5,
    // Vertex 5
    -0.5,
    0.5,
    -0.5,
    // Vertex 8
    -0.5,
    0.5,
    0.5,
    // Vertex 4
    -0.5,
    -0.5,
    -0.5,
    // Vertex 5
    -0.5,
    0.5,
    0.5,
    // Vertex 4
    -0.5,
    -0.5,
    0.5
    // Vertex 1
  ]));
  const vsSource = glsl`#version 300 es
out lowp vec4 vColor;
void main(void) {
    gl_Position = ${u_projectionMatrix} * ${u_modelViewMatrix} * vec4(${a_positions}, 1);
}
`;
  const fsSource = glsl`#version 300 es
precision mediump float;
in lowp vec4 vColor;
out vec4 color;
void main(void) {
  
  color = vec4(1.,0.,0.,1.);
}
`;
  return createComponent(Canvas, {
    get children() {
      return createComponent(Program, {
        vertex: vsSource,
        fragment: fsSource,
        mode: "TRIANGLES",
        count: 36
      });
    }
  });
}

export { _08_cube as default };
//# sourceMappingURL=08_cube.mjs.map
