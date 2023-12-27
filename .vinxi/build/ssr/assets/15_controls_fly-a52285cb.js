import { createComponent, mergeProps } from "solid-js/web";
import { g as glsl } from "./XEQHI3TD-da61e201.js";
import { l as loadOBJ, S as Scene, b as Shape, C as Camera, f as fly } from "./index-ac642af0.js";
import { For, Show } from "solid-js";
import "./get-6158dfbd.js";
import "node:crypto";
import "@solid-primitives/scheduled";
import "gl-matrix";
import "solid-js/store";
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
export {
  _15_controls_fly as default
};
