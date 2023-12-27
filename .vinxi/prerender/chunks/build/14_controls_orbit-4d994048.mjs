import { createComponent, mergeProps } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/web/dist/server.js';
import { g as glsl } from './XEQHI3TD-da61e201.mjs';
import { S as Scene, C as Camera, o as orbit, l as loadOBJ, b as Shape } from './index-ac642af0.mjs';
import { Show } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/dist/server.js';
import './get-6158dfbd.mjs';
import 'node:crypto';
import 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/@solid-primitives+scheduled@1.4.1_solid-js@1.8.7/node_modules/@solid-primitives/scheduled/dist/index.js';
import 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/gl-matrix@3.4.3/node_modules/gl-matrix/cjs/index.js';
import 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/store/dist/server.js';

const Teapot = (props) => {
  const obj = loadOBJ("./teapot.obj");
  return createComponent(Show, {
    get when() {
      return obj();
    },
    get children() {
      return createComponent(Shape, mergeProps(() => obj(), {
        get rotation() {
          return props.rotation;
        },
        get position() {
          return props.position;
        },
        color: [0, 0, 1],
        opacity: 1,
        fragment: glsl`#version 300 es
          precision mediump float;
          in vec4 view;
          out vec4 fragColor;
          void main() {
              vec3 dpdx = dFdx(view.xyz);
              vec3 dpdy = dFdy(view.xyz);
              vec3 normal = normalize(cross(dpdx, dpdy));
              fragColor = vec4(abs(normal.x), abs(normal.x), abs(normal.x), 1);
          }
        `
      }));
    }
  });
};
const _14_controls_orbit = () => createComponent(Scene, {
  background: [1, 0, 0, 1],
  get children() {
    return [createComponent(Teapot, {}), createComponent(Camera, mergeProps(() => orbit({
      target: [0, 1, 0],
      near: 3
    }), {
      active: true,
      fov: 33
    }))];
  }
});

export { _14_controls_orbit as default };
//# sourceMappingURL=14_controls_orbit-4d994048.mjs.map
