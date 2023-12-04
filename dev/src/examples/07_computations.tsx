import { ComputeShader, createComputation, glsl } from '@bigmistqke/signal-gl'
import { createEffect, createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import './index.css'

function App() {
  const [inputSignal, setInputSignal] = createSignal(
    new Uint8Array([0, 1, 2, 3, 4, 5, 6]),
    {
      equals: false,
    }
  )

  const computeShader: ComputeShader = (u_buffer) => glsl`
    ivec2 index = ivec2(gl_FragCoord.xy);
    vec4 value = texelFetch(${u_buffer}, index, 0);
    return value * 2.0;
  `

  const compute = createComputation(inputSignal, computeShader)

  createEffect(() => {
    console.time('start')
    console.log('result', compute())
    console.timeEnd('end')
  })

  setTimeout(() => setInputSignal((input) => ((input[0] = 100), input)), 1000)

  return <span>{compute().join(', ')}</span>
}

render(() => <App />, document.getElementById('app')!)
