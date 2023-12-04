import { ComputeShader, createComputation, glsl } from '@bigmistqke/signal-gl'
import { createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import './index.css'

const HEIGHT = 2048
const WIDTH = 2048

function App() {
  const [input, setInput] = createSignal(
    new Float32Array(
      new Array(WIDTH * HEIGHT)
        .fill('')
        .map((v, index) => Math.floor(Math.random() * 100))
    ),
    {
      equals: false,
    }
  )

  const computeShader: ComputeShader = (u_buffer) => glsl`
    ivec2 index = ivec2(gl_FragCoord.xy);
    vec4 value = texelFetch(${u_buffer}, index, 0);
    return sqrt(sqrt(sqrt(sqrt(value) * sqrt(value)) * sqrt(sqrt(value) * sqrt(value))) * sqrt(sqrt(sqrt(value) * sqrt(value)) * sqrt(sqrt(value) * sqrt(value)))) 
     * sqrt(sqrt(sqrt(sqrt(value) * sqrt(value)) * sqrt(sqrt(value) * sqrt(value))) * sqrt(sqrt(sqrt(value) * sqrt(value)) * sqrt(sqrt(value) * sqrt(value)))) ;
  `

  const computeGlsl = createComputation(input, computeShader, {
    width: WIDTH,
    height: HEIGHT,
  })

  // absurd calculation
  // maybe it gets compiled away idk ¯\_(ツ)_/¯
  const calc = (value: number) =>
    Math.sqrt(
      Math.sqrt(
        Math.sqrt(Math.sqrt(value) * Math.sqrt(value)) *
          Math.sqrt(Math.sqrt(value) * Math.sqrt(value))
      ) *
        Math.sqrt(
          Math.sqrt(Math.sqrt(value) * Math.sqrt(value)) *
            Math.sqrt(Math.sqrt(value) * Math.sqrt(value))
        )
    ) *
    Math.sqrt(
      Math.sqrt(
        Math.sqrt(Math.sqrt(value) * Math.sqrt(value)) *
          Math.sqrt(Math.sqrt(value) * Math.sqrt(value))
      ) *
        Math.sqrt(
          Math.sqrt(Math.sqrt(value) * Math.sqrt(value)) *
            Math.sqrt(Math.sqrt(value) * Math.sqrt(value))
        )
    )

  let output = new Float32Array(input().map((v) => v))
  const computeJs = () => {
    const values = input()
    for (let i = 0; i < values.length; i++) {
      output[i] = calc(values[i]!)
    }
    return output
  }

  const computeJs2 = () => input().map((value) => calc(value))

  setInterval(() => {
    console.time('compute glsl')
    setInput((input) => ((input[0] = Math.floor(Math.random() * 100)), input))
    const glslResult = computeGlsl()
    console.timeEnd('compute glsl')

    console.time('compute js')
    const jsResult = computeJs()
    console.timeEnd('compute js')

    console.time('compute js2')
    const jsResult2 = computeJs2()
    console.timeEnd('compute js2')

    console.log(
      glslResult[0] === jsResult[0] && jsResult[0] === jsResult2[0]
        ? 'SUCCESS'
        : 'ERROR',
      glslResult[0],
      jsResult[0],
      jsResult2[0],
      input()[0]
    )
  }, 1000)

  /* setInterval(() => {
    setInput(
      (input) => (
        (input = input.map(() => Math.floor(Math.random() * 100))), input
      )
    )
  }, 1000) */

  return <span></span>
}

render(() => <App />, document.getElementById('app')!)
