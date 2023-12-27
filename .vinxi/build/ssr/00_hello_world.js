import { createComponent } from "solid-js/web";
import { g as glsl, u as uniform, a as attribute, C as Canvas, P as Program } from "./assets/XEQHI3TD-da61e201.js";
import { createSignal } from "solid-js";
import "./assets/get-6158dfbd.js";
import "node:crypto";
import "@solid-primitives/scheduled";
function _00_hello_world() {
  const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]);
  const [opacity, setOpacity] = createSignal(0.5);
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
  return createComponent(Canvas, {
    onMouseMove: (e) => setOpacity(1 - e.clientY / e.currentTarget.offsetHeight),
    get children() {
      return createComponent(Program, {
        fragment,
        vertex,
        mode: "TRIANGLES",
        get count() {
          return vertices.length / 2;
        }
      });
    }
  });
}
export {
  _00_hello_world as default
};
