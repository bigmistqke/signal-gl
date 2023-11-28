import {
  batch,
  createEffect,
  type Accessor,
  type ComponentProps,
} from 'solid-js'

import type { ShaderToken } from '@core/types'
import { createProgram } from '@core/webgl'

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
