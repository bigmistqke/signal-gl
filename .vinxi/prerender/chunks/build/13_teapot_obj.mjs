import { createComponent, mergeProps } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/web/dist/server.js';
import { g as glsl } from './XEQHI3TD-da61e201.mjs';
import { S as Scene, C as Camera, l as loadOBJ, b as Shape } from './index-ac642af0.mjs';
import { createSignal, Show } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/dist/server.js';
import './get-6158dfbd.mjs';
import 'node:crypto';
import 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/@solid-primitives+scheduled@1.4.1_solid-js@1.8.7/node_modules/@solid-primitives/scheduled/dist/index.js';
import 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/gl-matrix@3.4.3/node_modules/gl-matrix/cjs/index.js';
import 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/store/dist/server.js';

const App = () => {
  const obj = loadOBJ("./teapot.obj");
  const [rotation, setRotation] = createSignal(0);
  const loop = () => {
    requestAnimationFrame(loop);
    setRotation((r) => r + 0.01);
  };
  loop();
  return createComponent(Show, {
    get when() {
      return obj();
    },
    get children() {
      return [createComponent(Shape, mergeProps(() => obj(), {
        get rotation() {
          return [0, rotation(), 0];
        },
        color: [1, 1, 0],
        opacity: 1,
        position: [-5, -2, -10]
      })), createComponent(Shape, mergeProps(() => obj(), {
        get rotation() {
          return [0, rotation(), 0];
        },
        color: [0, 0, 1],
        opacity: 1,
        position: [0, -2, -10],
        fragment: glsl`#version 300 es
          precision mediump float;
          in vec4 clip;
          out vec4 fragColor;
          void main() {
              vec3 dpdx = dFdx(clip.xyz);
              vec3 dpdy = dFdy(clip.xyz);
              vec3 normal = normalize(cross(dpdx, dpdy));
              fragColor = vec4(vec3(abs(normal.x) + abs(normal.y)), 1);
          }
        `
      })), createComponent(Shape, mergeProps(() => obj(), {
        get rotation() {
          return [0, rotation(), 0];
        },
        color: [0, 0, 1],
        opacity: 1,
        position: [5, -2, -10],
        fragment: glsl`#version 300 es
          precision mediump float;
          in vec4 clip;
          out vec4 fragColor;
          void main() {
              vec3 dpdx = dFdx(clip.xyz);
              vec3 dpdy = dFdy(clip.xyz);
              vec3 normal = normalize(cross(dpdx, dpdy));
              fragColor = vec4(normal, 1.0);
          }
        `
      }))];
    }
  });
};
const _13_teapot_obj = () => createComponent(Scene, {
  background: [1, 0, 0, 1],
  get children() {
    return [createComponent(Camera, {
      position: [0, 0, 0],
      active: true
    }), createComponent(App, {})];
  }
});

export { _13_teapot_obj as default };
//# sourceMappingURL=13_teapot_obj.mjs.map
