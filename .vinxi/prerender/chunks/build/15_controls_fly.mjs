import { createComponent, mergeProps } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/web/dist/server.js';
import { g as glsl } from './XEQHI3TD-da61e201.mjs';
import { l as loadOBJ, S as Scene, b as Shape, C as Camera, f as fly } from './index-ac642af0.mjs';
import { For, Show } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/dist/server.js';
import './get-6158dfbd.mjs';
import 'node:crypto';
import 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/@solid-primitives+scheduled@1.4.1_solid-js@1.8.7/node_modules/@solid-primitives/scheduled/dist/index.js';
import 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/gl-matrix@3.4.3/node_modules/gl-matrix/cjs/index.js';
import 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/store/dist/server.js';

const SIZE = 100;
const randomPose = () => ({
  rotation: [Math.random() * SIZE - SIZE / 2, Math.random() * SIZE - SIZE / 2, Math.random() * SIZE - SIZE / 2],
  position: [Math.random() * SIZE - SIZE / 2, Math.random() * SIZE - SIZE / 2, Math.random() * SIZE - SIZE / 2]
});
const _15_controls_fly = () => {
  const obj = loadOBJ("./teapot.obj");
  return createComponent(Scene, {
    background: [1, 0, 0, 1],
    get children() {
      return [createComponent(For, {
        get each() {
          return Array.from({
            length: 1e3
          }).map(randomPose);
        },
        children: (pose) => createComponent(Show, {
          get when() {
            return obj();
          },
          get children() {
            return createComponent(Shape, mergeProps(() => obj(), {
              get rotation() {
                return pose.rotation;
              },
              get position() {
                return pose.position;
              },
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
        })
      }), createComponent(Camera, mergeProps(fly, {
        active: true,
        fov: 33
      }))];
    }
  });
};

export { _15_controls_fly as default };
//# sourceMappingURL=15_controls_fly.mjs.map
