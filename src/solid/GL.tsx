import {
  batch,
  createEffect,
  type Accessor,
  type ComponentProps,
} from 'solid-js'
import type { ShaderToken } from './types'

export const GL = (
  props: ComponentProps<'canvas'> & {
    fragment: Accessor<ShaderToken>
    vertex: Accessor<ShaderToken>
    onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
    onInit?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
    animate?: boolean
  }
) => {
  let canvas: HTMLCanvasElement

  createEffect(() => {
    const gl = canvas.getContext('webgl2')!

    if (!gl) {
      console.error('webgl2 is not supported')
      return
    }

    const vertex = props.vertex()
    const fragment = props.fragment()

    /* Create Program */
    const currentProgram = createProgram(gl, vertex.source, fragment.source)

    if (!currentProgram) return

    props.onInit?.(gl, currentProgram)

    /* Observe resize-events canvas */
    const resizeObserver = new ResizeObserver(() => {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
    })
    resizeObserver.observe(canvas)

    function animate() {
      render()
      requestAnimationFrame(animate)
    }

    function render() {
      if (!currentProgram) return

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.useProgram(currentProgram)
      queue.forEach((fn) => fn())

      props.onRender?.(gl, currentProgram)
    }

    const queue: (() => void)[] = []
    const onRender = (fn: () => void) => {
      queue.push(fn)
      return () => {
        queue.splice(queue.indexOf(fn), 1)
      }
    }

    batch(() => {
      vertex.bind(gl, currentProgram, render, onRender)
      fragment.bind(gl, currentProgram, render, onRender)
      setTimeout(render, 5)
    })

    if (props.animate) animate()
  })

  return <canvas ref={canvas!} {...props} />
}

export function createProgram(
  gl: WebGLRenderingContext,
  vertex: string,
  fragment: string
) {
  const program = gl.createProgram()

  var vertexShader = createShader(gl, vertex, gl.VERTEX_SHADER)
  var fragmentShader = createShader(gl, fragment, gl.FRAGMENT_SHADER)

  if (!program || !vertexShader || !fragmentShader) return null

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)

  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('error while creating program', gl.getProgramInfoLog(program))
    return null
  }

  return program
}

function createShader(
  gl: WebGLRenderingContext,
  src: string,
  type:
    | WebGLRenderingContextBase['VERTEX_SHADER']
    | WebGLRenderingContextBase['FRAGMENT_SHADER']
) {
  const shader = gl.createShader(type)

  if (!shader) {
    console.error(`error while creating shader`)
    return null
  }

  gl.shaderSource(shader, src)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      type == gl.VERTEX_SHADER
        ? 'VERTEX'
        : 'FRAGMENT' + ` SHADER:\n ${gl.getShaderInfoLog(shader)}`
    )

    return null
  }

  return shader
}
