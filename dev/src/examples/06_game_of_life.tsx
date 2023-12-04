import { createEffect } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'
import { render } from 'solid-js/web'

import { GL, Program, attribute, glsl, uniform } from '@bigmistqke/signal-gl'

type Matrix<T = any> = T[][]

function App() {
  const gameOfLife = createGameOfLife()

  const vertices = new Float32Array([
    -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
  ])

  const fragment = glsl`#version 300 es
    precision lowp float;
    in vec2 vTexCoord; 
    out vec4 outColor;

    void main() {
     outColor = texture(${uniform.sampler2D(gameOfLife, {
       format: 'LUMINANCE',
       width: X,
       height: Y,
     })}, vTexCoord * 0.5);
    }
  `

  const vertex = glsl`#version 300 es
  out vec2 vTexCoord;

  void main() {
    vTexCoord = ${attribute.vec2(vertices)};
    gl_Position = vec4(vTexCoord, 0, 1);
  }
`

  return (
    <>
      <GL>
        <Program
          fragment={fragment}
          vertex={vertex}
          mode="TRIANGLES"
          count={6}
        />
      </GL>
    </>
  )
}

const createMatrix = (x: number, y: number): Matrix<0 | 255> =>
  new Array(x)
    .fill('')
    .map(() =>
      new Array(y).fill('').map(() => (Math.random() > 0.75 ? 255 : 0))
    )

const X = 4 * 4
const Y = 4 * 4

const createGameOfLife = () => {
  const [matrix, setMatrix] = createStore<Matrix<0 | 255>>(createMatrix(X, Y))

  const calculateAmountOfLivingNeigbors = (
    matrix: Matrix<0 | 255>,
    x: number,
    y: number
  ) => {
    let amount = 0
    const directions = [-1, 0, 1]
    directions.forEach((_x) =>
      directions.forEach((_y) => {
        if (_x === 0 && _y === 0) return
        matrix[x + _x]?.[y + _y] && amount++
      })
    )
    return amount
  }

  const evaluateCell = (
    matrix: Matrix<0 | 255>,
    x: number,
    y: number
  ): 0 | 255 => {
    const cell = matrix[x]?.[y]

    const amount = calculateAmountOfLivingNeigbors(matrix, x, y)

    // 1. Any live cell with two or three live neighbours survives.
    if (cell && (amount === 2 || amount === 3)) {
      return 255
    }
    // 2. Any dead cell with three live neighbours becomes a live cell.
    if (!cell && amount === 3) {
      return 255
    }

    // 3. All other live cells die in the next generation. Similarly, all other dead cells stay dead.
    return 0
  }

  const evaluateMatrix = (current: Matrix<0 | 255>) => {
    const next: Matrix<0 | 255> = []
    for (let x = 0; x < current.length; x++) {
      const row = current[x]!
      next.push([])
      for (let y = 0; y < row.length; y++) {
        next[x]![y] = evaluateCell(current, x, y)
      }
    }
    return next
  }

  let interval: ReturnType<typeof setInterval> | undefined
  createEffect(() => {
    interval = setInterval(() => {
      setMatrix(reconcile(evaluateMatrix(matrix)))
    }, 1000)
  })

  return () => new Uint8Array(matrix.flat(1))
}

render(() => <App />, document.getElementById('app')!)
