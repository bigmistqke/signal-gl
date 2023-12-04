import { ComputeShader, createComputation, glsl } from '@bigmistqke/signal-gl'
import { createEffect, createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import './index.css'

const HEIGHT = 2048
const WIDTH = 2048

function App() {
  const [input, setInput] = createSignal(
    new Uint8Array(
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

    return value * 2.0;
  `

  const computeJs = () => input().map((v) => v * 2)

  const compute = createComputation(input, computeShader, {
    width: WIDTH,
    height: HEIGHT,
  })

  createEffect(() => {
    console.time('compute glsl')
    const glslResult = compute()
    console.timeEnd('compute glsl')

    console.time('compute js')
    const jsResult = computeJs()
    console.timeEnd('compute js')

    console.log(
      glslResult[0] === jsResult[0] ? 'SUCCESS' : 'ERROR',
      glslResult[0],
      jsResult[0]
    )
  })

  setInterval(() => {
    setInput((input) => ((input[0] = Math.floor(Math.random() * 100)), input))
  }, 1000)

  return <span></span>
}

render(() => <App />, document.getElementById('app')!)
