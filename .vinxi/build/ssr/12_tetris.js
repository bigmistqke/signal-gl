import { createComponent, mergeProps } from "solid-js/web";
import { S as Scene, C as Camera, a as Cube } from "./assets/index-ac642af0.js";
import { extend, colord } from "colord";
import namesPlugin from "colord/plugins/names";
import { createSignal, createMemo, on, Index, Show, For, batch } from "solid-js";
import { createStore, produce } from "solid-js/store";
import "gl-matrix";
import "./assets/get-6158dfbd.js";
import "node:crypto";
import "@solid-primitives/scheduled";
extend([namesPlugin]);
const TETROMINO_SHAPES = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  J: [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
  L: [[0, 1, 0], [0, 1, 0], [0, 1, 1]]
};
const TETROMINO_COLORS = {
  I: "cyan",
  O: "yellow",
  T: "purple",
  S: "green",
  J: "blue",
  Z: "red",
  L: "orange"
};
const getVectorFromColor = (name) => {
  const {
    r,
    g,
    b
  } = colord(name).toRgb();
  return [r / 255, g / 255, b / 255];
};
const rotateMatrix = (matrix) => matrix[0].map((val, index) => matrix.map((row) => row[index]).reverse());
const Cell = (props) => {
  return createComponent(Cube, {
    get position() {
      return [props.position[0] - 0.25, props.position[1] - 0.25, -0.25];
    },
    get scale() {
      return props.scale ? [props.scale, props.scale, props.scale] : void 0;
    },
    get color() {
      return props.color;
    }
  });
};
const Tetromino = (props) => {
  const rgb = () => {
    const [r, g, b] = getVectorFromColor(TETROMINO_COLORS[props.type]);
    return props.preview ? [r * 0.5, g * 0.5, b * 0.5] : [r, g, b];
  };
  return createComponent(For, {
    get each() {
      return props.state;
    },
    children: (row, x) => createComponent(For, {
      each: row,
      children: (value, y) => createComponent(Show, {
        when: value,
        get children() {
          return createComponent(Cell, {
            get position() {
              return [props.position[0] + x(), props.position[1] + y()];
            },
            get color() {
              return rgb();
            },
            scale: 0.7,
            opacity: 1
          });
        }
      })
    })
  });
};
const getTetromino = () => {
  const type = Object.keys(TETROMINO_SHAPES)[Math.floor(Math.random() * (Object.keys(TETROMINO_SHAPES).length - 1))];
  return {
    state: TETROMINO_SHAPES[type],
    type,
    position: [5 - Math.floor(TETROMINO_SHAPES[type].length / 2), TETROMINO_SHAPES[type][0].length * -1 + 20]
  };
};
const createInitialState = () => [new Array(21).fill("").map((_) => "white"), ...new Array(10).fill("").map((_) => ["white", ...new Array(20).fill("").map((_2) => void 0)]), new Array(21).fill("").map((_) => "white")];
const App = () => {
  const [board, setBoard] = createStore(createInitialState());
  const [score, setScore] = createSignal(0);
  const [level, setLevel] = createSignal(1);
  const [currentTetromino, setCurrentTetromino] = createStore(getTetromino());
  const getDroppedOffset = (tetromino = currentTetromino) => {
    let offset = 0;
    while (true) {
      if (getCollisions({
        ...tetromino,
        offset: [0, offset - 1]
      })) {
        break;
      }
      offset--;
    }
    return offset;
  };
  const dropCurrentTetromino = () => {
    const offset = getDroppedOffset();
    setCurrentTetromino("position", 1, (y) => y + offset);
    addCurrentTetrominoToBoard();
    phases.evaluate();
  };
  const rotate = () => {
    const matrix = rotateMatrix(currentTetromino.state);
    if (!getCollisions({
      state: matrix
    })) {
      setCurrentTetromino("state", matrix);
    }
  };
  const translate = (direction) => {
    const collision = getCollisions({
      offset: direction
    });
    if (!collision) {
      setCurrentTetromino("position", 0, (value) => value + direction[0]);
      setCurrentTetromino("position", 1, (value) => value + direction[1]);
    }
  };
  createSignal(true);
  const getCollisions = (config) => {
    let collision = false;
    const state = config?.state || currentTetromino.state;
    const initialPosition = config?.position ? config.position : currentTetromino.position;
    const position = config?.offset ? [initialPosition[0] + config.offset[0], initialPosition[1] + config.offset[1]] : initialPosition;
    for (let x = 0; x < state.length; x++) {
      const row = state[x];
      for (let y = 0; y < row.length; y++) {
        const value = row[y];
        if (value) {
          const next = board[x + position[0]]?.[y + position[1]];
          if (next) {
            collision = true;
            break;
          }
        }
      }
    }
    return collision;
  };
  const wait = (delay = 1e3) => new Promise((resolve) => setTimeout(resolve, delay));
  const addNextCurrentTetromino = () => {
    const tetromino = getTetromino();
    if (!getCollisions(tetromino)) {
      setCurrentTetromino(getTetromino());
    }
  };
  const addCurrentTetrominoToBoard = () => {
    for (let x = 0; x < currentTetromino.state.length; x++) {
      const row = currentTetromino.state[x];
      for (let y = 0; y < row.length; y++) {
        if (row[y])
          setBoard(x + currentTetromino.position[0], y + currentTetromino.position[1], TETROMINO_COLORS[currentTetromino.type]);
      }
    }
  };
  const updateScoreFromMatches = (matches) => {
    const formula = () => {
      switch (matches) {
        case 1:
          return 100 * level();
        case 2:
          return 300 * level();
        case 3:
          return 500 * level();
        case 4:
          return 800 * level();
        default:
          return 0;
      }
    };
    setScore((score2) => score2 + formula());
  };
  const evaluateState = async () => {
    if (getCollisions({
      offset: [0, -1]
    })) {
      addCurrentTetrominoToBoard();
      addNextCurrentTetromino();
    }
    const matches = [];
    board[0].slice(1).forEach((type, _y) => {
      let y = _y + 1;
      let tetris = true;
      for (let x = 0; x < board.length; x++) {
        if (board[x][y] && type)
          continue;
        tetris = false;
        break;
      }
      if (tetris)
        matches.push(y);
    });
    matches.forEach((y) => {
      batch(() => {
        for (let x = board.length - 2; x > 0; x--) {
          setBoard(x, y, void 0);
        }
      });
    });
    matches.reverse();
    if (matches.length > 0)
      updateScoreFromMatches(matches.length);
    await wait(125);
    batch(() => {
      for (let x = 1; x < board.length - 1; x++) {
        setBoard(x, produce((column) => {
          matches.forEach((y) => {
            column.splice(y, 1);
            column.push(void 0);
          });
        }));
      }
    });
  };
  const phases = (() => {
    let phase = "Translate";
    let time = performance.now();
    const translate2 = () => {
      time = performance.now();
      phase = "Evaluate";
      if (!getCollisions({
        offset: [0, -1]
      })) {
        setCurrentTetromino("position", 1, (x) => x - 1);
      }
    };
    const evaluate = () => {
      time = performance.now();
      phase = "Translate";
      evaluateState();
    };
    return {
      update: () => {
        if (performance.now() - time > 125) {
          if (phase === "Evaluate") {
            evaluate();
          } else {
            translate2();
          }
        }
      },
      translate: translate2,
      evaluate
    };
  })();
  const previewTetromino = createMemo(on(getDroppedOffset, (offset) => ({
    ...currentTetromino,
    position: [currentTetromino.position[0], currentTetromino.position[1] + offset]
  })));
  let initialized = false;
  window.addEventListener("keydown", (e) => {
    if (!initialized) {
      initialized = true;
      setInterval(() => phases.update(), 1e3 / 60);
    }
    switch (e.code) {
      case "ArrowUp":
        rotate();
        break;
      case "ArrowLeft":
        translate([-1, 0]);
        break;
      case "ArrowRight":
        translate([1, 0]);
        break;
      case "ArrowDown":
        translate([0, -1]);
        break;
      case "Space":
        dropCurrentTetromino();
        break;
    }
  });
  return [createComponent(Index, {
    each: board,
    children: (row, x) => createComponent(Index, {
      get each() {
        return row();
      },
      children: (color, y) => createComponent(Show, {
        get when() {
          return color();
        },
        children: (color2) => createComponent(Cell, {
          scale: 0.7,
          get color() {
            return getVectorFromColor(color2());
          },
          position: [x, y]
        })
      })
    })
  }), createComponent(Tetromino, currentTetromino), createComponent(Tetromino, mergeProps(previewTetromino, {
    preview: true
  }))];
};
function _12_tetris() {
  return createComponent(Scene, {
    get children() {
      return [createComponent(Camera, {
        position: [5, 10, 90],
        rotation: [0, 0, 0],
        active: true,
        fov: 15
      }), createComponent(App, {})];
    }
  });
}
export {
  _12_tetris as default
};
