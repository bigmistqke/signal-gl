import { createComponent } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/web/dist/server.js';
import { createEffect } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/dist/server.js';
import { createStore, reconcile } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/store/dist/server.js';
import { g as glsl, u as uniform, a as attribute, C as Canvas, P as Program } from './XEQHI3TD-da61e201.mjs';
import './get-6158dfbd.mjs';
import 'node:crypto';
import 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/@solid-primitives+scheduled@1.4.1_solid-js@1.8.7/node_modules/@solid-primitives/scheduled/dist/index.js';

function _06_game_of_life() {
  const gameOfLife = createGameOfLife();
  const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]);
  const fragment = glsl`#version 300 es
    precision lowp float;
    in vec2 vTexCoord; 
    out vec4 outColor;

    void main() {
     outColor = texture(${uniform.sampler2D(gameOfLife, {
    format: "LUMINANCE",
    internalFormat: "LUMINANCE",
    dataType: "UNSIGNED_BYTE",
    width: X,
    height: Y
  })}, vTexCoord * 0.5 + 0.5);
    }
  `;
  const vertex = glsl`#version 300 es
  out vec2 vTexCoord;

  void main() {
    vTexCoord = ${attribute.vec2(vertices)};
    gl_Position = vec4(vTexCoord, 0, 1);
  }
`;
  return createComponent(Canvas, {
    get children() {
      return createComponent(Program, {
        fragment,
        vertex,
        mode: "TRIANGLES",
        count: 6
      });
    }
  });
}
const createMatrix = (x, y) => new Array(x).fill("").map(() => new Array(y).fill("").map(() => Math.random() > 0.75 ? 255 : 0));
const X = 4 * 4;
const Y = 4 * 4;
const createGameOfLife = () => {
  const [matrix, setMatrix] = createStore(createMatrix(X, Y));
  const calculateAmountOfLivingNeigbors = (matrix2, x, y) => {
    let amount = 0;
    const directions = [-1, 0, 1];
    directions.forEach((_x) => directions.forEach((_y) => {
      var _a;
      if (_x === 0 && _y === 0)
        return;
      ((_a = matrix2[x + _x]) == null ? void 0 : _a[y + _y]) && amount++;
    }));
    return amount;
  };
  const evaluateCell = (matrix2, x, y) => {
    var _a;
    const cell = (_a = matrix2[x]) == null ? void 0 : _a[y];
    const amount = calculateAmountOfLivingNeigbors(matrix2, x, y);
    if (cell && (amount === 2 || amount === 3)) {
      return 255;
    }
    if (!cell && amount === 3) {
      return 255;
    }
    return 0;
  };
  const evaluateMatrix = (current) => {
    const next = [];
    for (let x = 0; x < current.length; x++) {
      const row = current[x];
      next.push([]);
      for (let y = 0; y < row.length; y++) {
        next[x][y] = evaluateCell(current, x, y);
      }
    }
    return next;
  };
  createEffect(() => {
    setInterval(() => {
      setMatrix(reconcile(evaluateMatrix(matrix)));
    }, 1e3);
  });
  return () => new Uint8Array(matrix.flat(1));
};

export { _06_game_of_life as default };
//# sourceMappingURL=06_game_of_life-1aa3b827.mjs.map
