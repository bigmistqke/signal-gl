import { createComponent } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/web/dist/server.js';
import { g as glsl, u as uniform, C as Canvas, a as attribute, P as Program } from './XEQHI3TD-da61e201.mjs';
import { createSignal } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/dist/server.js';
import './get-6158dfbd.mjs';
import 'node:crypto';
import 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/@solid-primitives+scheduled@1.4.1_solid-js@1.8.7/node_modules/@solid-primitives/scheduled/dist/index.js';

const Plane = (props) => {
  const vertex = glsl`#version 300 es
    out vec2 v_coord;  
    out vec3 v_color;
    void main() {
      vec2 a_coord = ${attribute.vec2(props.vertices)};
      v_coord = a_coord;
      gl_Position = vec4(a_coord, 0, 1.0);
    }`;
  return createComponent(Program, {
    vertex,
    get fragment() {
      return props.fragment;
    },
    mode: "TRIANGLES",
    get count() {
      return props.vertices.length / 2;
    }
  });
};
function _02_multiple_shaders() {
  const [opacity, setOpacity] = createSignal(0.5);
  const [cursor, setCursor] = createSignal([1, 1]);
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
        discard;
      }
    }`;
  return createComponent(Canvas, {
    style: {
      width: "100vw",
      height: "100vh"
    },
    onMouseMove: (e) => {
      setOpacity(1 - e.clientY / e.currentTarget.offsetHeight);
      setCursor([2 * (e.clientX / e.currentTarget.clientWidth) - 1, 2 * ((e.currentTarget.clientHeight - e.clientY) / e.currentTarget.clientHeight) - 1]);
    },
    get children() {
      return [createComponent(Plane, {
        get fragment() {
          return glsl`#version 300 es
          precision mediump float;
          in vec2 v_coord; 
          out vec4 outColor;
          void main() {
            float opacity = ${uniform.float(opacity)};
            outColor = vec4(v_coord[0], v_coord[1], v_coord[0], opacity);
          }`;
        },
        vertices: new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1])
      }), createComponent(Plane, {
        fragment: glsl`#version 300 es
          precision mediump float;
          ${getColor}

          in vec2 v_coord; 
          out vec4 outColor;

          void main() {
            outColor = getColor(vec3(1.0, 0.0, 0.0), v_coord);
          }`,
        vertices: new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5])
      })];
    }
  });
}

export { _02_multiple_shaders as default };
//# sourceMappingURL=02_multiple_shaders-14281337.mjs.map
