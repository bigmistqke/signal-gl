import { createComponent, mergeProps } from "solid-js/web";
import { g as glsl } from "./XEQHI3TD-da61e201.js";
import { S as Scene, C as Camera, o as orbit, l as loadOBJ, b as Shape } from "./index-ac642af0.js";
import { Show } from "solid-js";
import "./get-6158dfbd.js";
import "node:crypto";
import "@solid-primitives/scheduled";
import "gl-matrix";
import "solid-js/store";
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
export {
  _14_controls_orbit as default
};
