import {
  batch,
  createEffect,
  type Accessor,
  type ComponentProps,
} from 'solid-js'
import type { ShaderResult } from './glsl'

export const GL = (
  props: ComponentProps<'canvas'> & {
    fragment: Accessor<ShaderResult>
    vertex: Accessor<ShaderResult>
    onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
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

    batch(() => {
      vertex.bind(gl, currentProgram)
      fragment.bind(gl, currentProgram)
    })

    /* Create Vertex buffer (2 triangles) */
    let vertex_position: number
    let vertex_buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
      ]),
      gl.STATIC_DRAW
    )

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

      // Load program into GPU
      gl.useProgram(currentProgram)

      // Render geometry
      gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer)
      gl.vertexAttribPointer(vertex_position, 2, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(vertex_position)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      gl.disableVertexAttribArray(vertex_position)

      props.onRender?.(gl, currentProgram)
    }

    animate()
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
      `${
        type == gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT'
      }  SHADER:\n ${gl.getShaderInfoLog(shader)}`
    )

    return null
  }

  return shader
}
