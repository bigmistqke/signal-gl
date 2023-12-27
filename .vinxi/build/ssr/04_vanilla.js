import { ssr, ssrHydrationKey } from "solid-js/web";
import { g as glsl, u as uniform, a as attribute, G as GLProgram, b as GLStack } from "./assets/XEQHI3TD-da61e201.js";
import { createSignal, onMount, createEffect } from "solid-js";
import "./assets/get-6158dfbd.js";
import "node:crypto";
import "@solid-primitives/scheduled";
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
    createEffect(() => gl?.render());
  });
  return ssr(_tmpl$, ssrHydrationKey());
}
export {
  _04_vanilla as default
};
