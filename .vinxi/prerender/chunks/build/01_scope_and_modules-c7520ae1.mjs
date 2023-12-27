import { createComponent } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/web/dist/server.js';
import { createSignal } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/dist/server.js';
import { g as glsl, u as uniform, a as attribute, C as Canvas, P as Program } from './XEQHI3TD-da61e201.mjs';
import './get-6158dfbd.mjs';
import 'node:crypto';
import 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/@solid-primitives+scheduled@1.4.1_solid-js@1.8.7/node_modules/@solid-primitives/scheduled/dist/index.js';

function _01_scope_and_modules() {
  const [cursor, setCursor] = createSignal([1, 1]);
  const [vertices] = createSignal(new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]), {
    equals: false
  });
  const [colors, setColors] = createSignal(new Float32Array(new Array(6 * 3).fill("").map((v) => Math.random())), {
    equals: false
  });
  setInterval(() => {
    setColors((colors2) => {
      colors2[0] += 1e-3;
      colors2[10] += 2e-3;
      if (colors2[0] > 1)
        colors2[0] = 0;
      if (colors2[10] > 1)
        colors2[10] = 0;
      return colors2;
    });
  });
  const getColor = glsl`
    float ${"getLength"}(float x, float y){
      return length(x - y);
    }

    vec4 getColor(vec3 color, vec2 coord){
      vec2 cursor = ${uniform.vec2(cursor)};

      float lengthX = ${"getLength"}(cursor.x, coord.x);
      float lengthY = ${"getLength"}(cursor.y, coord.y);

      if(lengthX < 0.25 && lengthY < 0.25){
        return vec4(1. - color, 1.0);
      }else{
        return vec4(color, 1.0);
      }
    }`;
  const fragment = glsl`#version 300 es
    precision mediump float;
    ${getColor}

    in vec2 v_coord; 
    in vec3 v_color;
    out vec4 outColor;

    void main() {
      outColor = getColor(v_color, v_coord);
    }`;
  const vertex = glsl`#version 300 es

    out vec2 v_coord;  
    out vec3 v_color;

    void main() {
      vec2 a_coord = ${attribute.vec2(vertices)};
      v_color = ${attribute.vec3(colors)};
      v_coord = a_coord - ${uniform.vec2(cursor)};
      gl_Position = vec4(a_coord, 0, 1) ;
    }`;
  return createComponent(Canvas, {
    style: {
      width: "100%",
      height: "100vh"
    },
    onMouseMove: (e) => setCursor([e.clientX / e.currentTarget.clientWidth - 0.5, (e.currentTarget.clientHeight - e.clientY) / e.currentTarget.clientHeight - 0.5]),
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

export { _01_scope_and_modules as default };
//# sourceMappingURL=01_scope_and_modules-c7520ae1.mjs.map
