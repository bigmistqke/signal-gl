import { Camera, Cube, Scene } from '@bigmistqke/signal-gl/world'
import { colord, extend } from 'colord'
import namesPlugin from 'colord/plugins/names'
import {
  Accessor,
  For,
  Index,
  Show,
  batch,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  type Component,
} from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { render } from 'solid-js/web'

import { Vector3 } from '@core/types'
import './index.css'

extend([namesPlugin])

export const SIZE = 2
export const AMOUNT = 8
const DEBUG = false
export const DELAY = 125

type ValueOfObject<T> = T[keyof T]
type ValueOfArray<T extends readonly any[]> = T[number]
export type Matrix<T> = T[][]
export type Vector = [row: number, column: number]

export type Color = ValueOfObject<typeof TETROMINO_COLORS>
export type GameState = Matrix<Color | undefined>

// @prettier-ignore
const TETROMINO_SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],

  J: [
    [0, 1, 0],
    [0, 1, 0],
    [1, 1, 0],
  ],
  L: [
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 1],
  ],
}

const TETROMINO_COLORS = {
  I: 'cyan',
  O: 'yellow',
  T: 'purple',
  S: 'green',
  J: 'blue',
  Z: 'red',
  L: 'orange',
} as const

const getVectorFromColor = (name: string) => {
  const { r, g, b } = colord(name).toRgb()
  return [r / 255, g / 255, b / 255] as Vector3
}

// from https://stackoverflow.com/a/58668351/4366929
const rotateMatrix = (matrix: Matrix<number>) =>
  matrix[0].map((val, index) => matrix.map((row) => row[index]).reverse())

type TetrominoType = keyof typeof TETROMINO_SHAPES

function isEqual<T extends any[] | undefined>(a: T, b: T) {
  return a && b && a.findIndex((_, index) => a[index] !== b[index]) === -1
}

const stopwatch = (duration: number, callback: (delta: number) => void) => {
  let delta = 0
  let canceled = false
  const start = performance.now()
  const loop = () => {
    if (canceled) return
    if (delta < 1) requestAnimationFrame(loop)
    delta += (performance.now() - start) / duration
    callback(Math.min(delta, 1))
  }
  loop()
  return () => {
    canceled = true
  }
}

const tween = (start: number, end: number, delta: number) =>
  start * (1 - delta) + end * delta

function createTween<
  const T extends number | number[] | Record<string, number>
>(
  enabled: Accessor<boolean>,
  start: T,
  end: T,
  easing?: (delta: number) => number
) {
  const [delta, setDelta] = createSignal(0)

  createEffect(
    on(createMemo(enabled), (enabled) => {
      const start = delta()
      const cancel = !enabled
        ? stopwatch(1000, (delta) => setDelta(tween(start, 0, delta)))
        : stopwatch(1000, (delta) => setDelta(tween(start, 1, delta)))
      onCleanup(cancel)
    })
  )

  return createMemo(() => {
    if (Array.isArray(start))
      return start.map((value, index) =>
        tween(value, (end as any[])[index], delta())
      )
    if (typeof start === 'object')
      return Object.fromEntries(
        Object.entries(start).map(([key, value]) => [
          key,
          tween(value, (end as Record<string, number>)[key], delta()),
        ])
      )
    return tween(start, end as number, delta())
  }) as Accessor<T>
}

const Cell = (props: {
  position: Vector
  color: Vector3
  scale?: number
  opacity?: number
}) => {
  return (
    <Cube
      position={[props.position[0] - 0.25, props.position[1] - 0.25, -0.25]}
      scale={props.scale ? [props.scale, props.scale, props.scale] : undefined}
      color={props.color}
    />
  )
}

const Tetromino = (props: {
  type: TetrominoType
  state: ValueOfObject<typeof TETROMINO_SHAPES>
  position: Vector
  preview?: boolean
}) => {
  const rgb = () => {
    const [r, g, b] = getVectorFromColor(TETROMINO_COLORS[props.type])
    return (props.preview ? [r * 0.5, g * 0.5, b * 0.5] : [r, g, b]) as Vector3
  }
  return (
    <For each={props.state}>
      {(row, x) => (
        <For each={row}>
          {(value, y) => (
            <Show when={value}>
              <Cell
                position={[props.position[0] + x(), props.position[1] + y()]}
                color={rgb()}
                scale={0.7}
                opacity={1}
              />
            </Show>
          )}
        </For>
      )}
    </For>
  )
}

const getTetromino = () => {
  const type = Object.keys(TETROMINO_SHAPES)[
    Math.floor(Math.random() * (Object.keys(TETROMINO_SHAPES).length - 1))
  ] as TetrominoType

  return {
    state: TETROMINO_SHAPES[type],
    type,
    position: [
      5 - Math.floor(TETROMINO_SHAPES[type].length / 2),
      TETROMINO_SHAPES[type][0].length * -1 + 20,
    ] as Vector,
  }
}

const createInitialState = () => [
  new Array(21).fill('').map((_) => 'white'),
  ...(new Array(10)
    .fill('')
    .map((_) => [
      'white',
      ...new Array(20).fill('').map((_) => undefined),
    ]) as Matrix<Color | undefined>),
  new Array(21).fill('').map((_) => 'white'),
]

const App: Component = () => {
  const [board, setBoard] = createStore<Matrix<Color | undefined>>(
    createInitialState()
  ) //createInitialState())
  const [score, setScore] = createSignal(0)
  const [level, setLevel] = createSignal(1)

  const [currentTetromino, setCurrentTetromino] = createStore<{
    type: TetrominoType
    state: Matrix<number>
    position: Vector
  }>(getTetromino())

  const getDroppedOffset = (tetromino = currentTetromino) => {
    let offset = 0
    while (true) {
      if (getCollisions({ ...tetromino, offset: [0, offset - 1] })) {
        break
      }
      offset--
    }
    return offset
  }

  const dropCurrentTetromino = () => {
    const offset = getDroppedOffset()
    setCurrentTetromino('position', 1, (y) => y + offset)
    addCurrentTetrominoToBoard()
    phases.evaluate()
  }
  const rotate = () => {
    const matrix = rotateMatrix(currentTetromino.state)
    if (!getCollisions({ state: matrix })) {
      setCurrentTetromino('state', matrix)
    }
  }

  const translate = (direction: Vector) => {
    const collision = getCollisions({
      offset: direction,
    })
    if (!collision) {
      setCurrentTetromino('position', 0, (value) => value + direction[0])
      setCurrentTetromino('position', 1, (value) => value + direction[1])
    }
  }

  const [playing, setPlaying] = createSignal(true)

  const getCollisions = (config?: {
    state?: Matrix<number>
    offset?: Vector
    position?: Vector
  }) => {
    let collision = false
    const state = config?.state || currentTetromino.state
    const initialPosition = config?.position
      ? config.position
      : currentTetromino.position
    const position = config?.offset
      ? ([
          initialPosition[0] + config.offset[0],
          initialPosition[1] + config.offset[1],
        ] as Vector)
      : initialPosition

    for (let x = 0; x < state.length; x++) {
      const row = state[x]
      for (let y = 0; y < row.length; y++) {
        const value = row[y]
        if (value) {
          const next = board[x + position[0]]?.[y + position[1]]
          if (next) {
            collision = true
            break
          }
        }
      }
    }
    return collision
  }

  const wait = (delay = 1000) =>
    new Promise((resolve) => setTimeout(resolve, delay))

  const addNextCurrentTetromino = () => {
    const tetromino = getTetromino()
    if (!getCollisions(tetromino)) {
      setCurrentTetromino(getTetromino())
    }
  }

  const addCurrentTetrominoToBoard = () => {
    for (let x = 0; x < currentTetromino.state.length; x++) {
      const row = currentTetromino.state[x]
      for (let y = 0; y < row.length; y++) {
        if (row[y])
          setBoard(
            x + currentTetromino.position[0],
            y + currentTetromino.position[1],
            TETROMINO_COLORS[currentTetromino.type]
          )
      }
    }
  }

  const updateScoreFromMatches = (matches: number) => {
    const formula = () => {
      switch (matches) {
        case 1:
          return 100 * level()
        case 2:
          return 300 * level()
        case 3:
          return 500 * level()
        case 4:
          return 800 * level()
        default:
          return 0
      }
    }

    setScore((score) => score + formula())
  }

  const evaluateState = async () => {
    // check if current tetrimino touches the ground or any of the state
    if (getCollisions({ offset: [0, -1] })) {
      // if so add to current tetromino to the board
      addCurrentTetrominoToBoard()
      // and add a new current tetromino
      addNextCurrentTetromino()
    }

    // check if there are any lines made
    const matches: number[] = []
    // skip first line because it is ground
    board[0].slice(1).forEach((type, _y) => {
      let y = _y + 1
      let tetris = true
      for (let x = 0; x < board.length; x++) {
        if (board[x][y] && type) continue
        tetris = false
        break
      }
      if (tetris) matches.push(y)
    })

    // remove lines
    matches.forEach((y) => {
      batch(() => {
        // ignore first and last index bc they are walls
        for (let x = board.length - 2; x > 0; x--) {
          setBoard(x, y, undefined)
        }
      })
    })

    // reverse matches in-place otherwise splicing wouldn't work properly
    matches.reverse()

    if (matches.length > 0) updateScoreFromMatches(matches.length)

    await wait(125)

    // drop blocks
    batch(() => {
      for (let x = 1; x < board.length - 1; x++) {
        setBoard(
          x,
          produce((column) => {
            matches.forEach((y) => {
              column.splice(y, 1)
              column.push(undefined)
            })
          })
        )
      }
    })
  }

  const phases = (() => {
    let phase: 'Evaluate' | 'Translate' = 'Translate'
    let time = performance.now()

    const translate = () => {
      time = performance.now()
      phase = 'Evaluate'
      if (!getCollisions({ offset: [0, -1] })) {
        setCurrentTetromino('position', 1, (x) => x - 1)
      }
    }

    const evaluate = () => {
      time = performance.now()
      phase = 'Translate'
      evaluateState()
    }

    return {
      update: () => {
        if (performance.now() - time > 125) {
          if (phase === 'Evaluate') {
            evaluate()
          } else {
            translate()
          }
        }
      },
      translate,
      evaluate,
    }
  })()

  const previewTetromino = createMemo(
    on(getDroppedOffset, (offset) => ({
      ...currentTetromino,
      position: [
        currentTetromino.position[0],
        currentTetromino.position[1] + offset,
      ] satisfies Vector,
    }))
  )

  let initialized = false
  window.addEventListener('keydown', (e) => {
    if (!initialized) {
      initialized = true
      setInterval(() => phases.update(), 1000 / 60)
    }
    switch (e.code) {
      case 'ArrowUp':
        rotate()
        break
      case 'ArrowLeft':
        translate([-1, 0])
        break
      case 'ArrowRight':
        translate([1, 0])
        break
      case 'ArrowDown':
        translate([0, -1])
        break
      case 'Space':
        dropCurrentTetromino()
        break
    }
  })

  return (
    <>
      <Index each={board}>
        {(row, x) => (
          <Index each={row()}>
            {(color, y) => (
              <Show when={color()}>
                {(color) => (
                  <Cell
                    scale={0.7}
                    color={getVectorFromColor(color())}
                    position={[x, y]}
                  />
                )}
              </Show>
            )}
          </Index>
        )}
      </Index>
      <Tetromino {...currentTetromino} />
      <Tetromino {...previewTetromino()} preview />
    </>
  )
}

render(
  () => (
    <Scene style={{ width: '100vw', height: '100vh' }}>
      <Camera position={[5, 10, 90]} rotation={[0, 0, 0]} active fov={15} />
      <App />
    </Scene>
  ),
  document.getElementById('app')!
)
