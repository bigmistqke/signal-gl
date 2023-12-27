import { createComponent } from "solid-js/web";
import { u as uniform, a as attribute, g as glsl, C as Canvas, P as Program } from "./XEQHI3TD-da61e201.js";
import { createSignal, createMemo } from "solid-js";
import "./get-6158dfbd.js";
import "node:crypto";
import "@solid-primitives/scheduled";
function _05_shared_uniforms() {
  const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]);
  const [opacity, setOpacity] = createSignal(0.5);
  const [cameraPosition, setCameraPosition] = createSignal([0, 0]);
  const [zoom, setZoom] = createSignal(1);
  const transformedCameraPosition = createMemo(() => cameraPosition().map((v) => v / zoom()));
  const u_cameraPosition = uniform.vec2(transformedCameraPosition);
  const u_zoom = uniform.float(zoom);
  const u_opacity = uniform.float(opacity);
  const a_vertices = attribute.vec2(vertices);
  const fragment = glsl`#version 300 es
    precision mediump float;
    in vec2 v_coord; 
    out vec4 outColor;
    
    void main() {
      float opacity = ${u_opacity};
      vec2 scaledCoord = (v_coord - ${u_cameraPosition}) * ${u_zoom};
      outColor = vec4(scaledCoord[0], scaledCoord[1], scaledCoord[0], opacity);
    }`;
  const vertex = glsl`#version 300 es
    precision mediump float;

    out vec2 v_coord;  
    out vec3 v_color;
    
    void main() {
      vec2 a_coord = ${a_vertices};
      v_coord = a_coord + ${u_cameraPosition};
      gl_Position = vec4((a_coord - ${u_cameraPosition}) * ${u_zoom}, 0, 1);
    }`;
  return createComponent(Canvas, {
    style: {
      width: "100vw",
      height: "100vh"
    },
    onMouseMove: (e) => {
      setOpacity(1 - e.clientY / e.currentTarget.offsetHeight);
      setCameraPosition([(e.clientX / window.innerWidth - 0.5) * -2, (e.clientY / window.innerHeight - 0.5) * 2]);
    },
    onWheel: (e) => {
      e.preventDefault();
      setZoom((prevZoom) => prevZoom - e.deltaY * 0.01);
    },
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
  _05_shared_uniforms as default
};
