import { ssr, ssrHydrationKey } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/web/dist/server.js';
import { g as glsl, u as uniform, a as attribute, G as GLProgram, b as GLStack } from './XEQHI3TD-da61e201.mjs';
import { createSignal, onMount, createEffect } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/dist/server.js';
import './get-6158dfbd.mjs';
import 'node:crypto';
import 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/@solid-primitives+scheduled@1.4.1_solid-js@1.8.7/node_modules/@solid-primitives/scheduled/dist/index.js';

const _tmpl$ = ["<canvas", "></canvas>"];
function _04_vanilla() {
  const [opacity, setOpacity] = createSignal(0.5);
  const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]);
  const fragment = glsl`#version 300 es
  precision mediump float;
  in vec2 v_coord; 
  out vec4 outColor;
  void main() {
    float opacity = ${uniform.float(opacity)};
    outColor = vec4(v_coord[0], v_coord[1], v_coord[0], opacity);
  }`;
  const vertex = glsl`#version 300 es
  out vec2 v_coord;  
  out vec3 v_color;
  void main() {
    vec2 a_coord = ${attribute.vec2(vertices)};
    v_coord = a_coord;
    gl_Position = vec4(a_coord, 0, 1) ;
  }`;
  let canvas;
  onMount(() => {
    const program = new GLProgram({
      canvas,
      vertex,
      fragment,
      mode: "TRIANGLES",
      count: vertices.length / 2
    });
    const gl = new GLStack({
      canvas,
      programs: [program]
    });
    createEffect(() => gl == null ? void 0 : gl.render());
  });
  return ssr(_tmpl$, ssrHydrationKey());
}

export { _04_vanilla as default };
//# sourceMappingURL=04_vanilla-515e9c92.mjs.map
