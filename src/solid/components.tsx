import {
  JSXElement,
  batch,
  children,
  createContext,
  createEffect,
  createSignal,
  onMount,
  splitProps,
  useContext,
  type Accessor,
  type ComponentProps,
} from 'solid-js'

import type { ShaderToken } from '@core/types'
import { createProgram } from '@core/webgl'

const glContext = createContext<{
  gl: WebGL2RenderingContext
  render?: () => void
}>()

const useGL = () => useContext(glContext)

export const GL = (
  props: ComponentProps<'canvas'> & {
    onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
    onInit?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
    animate?: boolean
  }
) => {
  const [childrenProps, rest] = splitProps(props, ['children'])
  const [canvas, setCanvas] = createSignal<HTMLCanvasElement | undefined>()
  const [renderFunction, setRenderFunction] = createSignal<() => void>()

  return (
    <glContext.Provider
      value={{
        get gl() {
          return canvas()?.getContext('webgl2')!
        },
        get render() {
          return renderFunction()
        },
      }}
    >
      {(() => {
        const memoChildren = children(() => childrenProps.children)

        onMount(() => {
          const _canvas = canvas()

          if (!_canvas) return

          const gl = _canvas.getContext('webgl2')

          if (!gl) {
            console.error('webgl2 is not supported')
            return
          }

          /* Observe resize-events canvas */
          const resizeObserver = new ResizeObserver(() => {
            _canvas.width = _canvas.clientWidth
            _canvas.height = _canvas.clientHeight
            gl.viewport(0, 0, _canvas.width, _canvas.height)
          })
          resizeObserver.observe(_canvas)

          if (!props.animate) setTimeout(render, 0)
        })

        function animate() {
          render()
          requestAnimationFrame(animate)
        }

        function render() {
          const _canvas = canvas()
          const gl = _canvas?.getContext('webgl2')
          if (!_canvas || !gl) return

          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

          const childs = memoChildren()
          if (!childs) return

          if (Array.isArray(childs)) {
            childs.forEach((child) => {
              if (child && typeof child === 'object' && 'render' in child) {
                ;(child as any).render()
              }
            })
          } else {
            if (typeof childs === 'object' && 'render' in childs) {
              ;(childs as any).render?.()
            }
          }
        }

        setRenderFunction(() => render)

        createEffect(() => (props.animate ? animate() : createEffect(render)))

        return <canvas ref={setCanvas} {...rest} />
      })()}
    </glContext.Provider>
  )
}

let id = 0
export const Program = (props: {
  fragment: Accessor<ShaderToken>
  vertex: Accessor<ShaderToken>
  onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
  onInit?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
  mode: 'TRIANGLES' | 'POINTS' | 'LINES'
}) => {
  const _id = id++
  const context = useGL()
  const [renderFunction, setRenderFunction] = createSignal<() => any>()

  const queue: (() => void)[] = []
  const onRender = (fn: () => void) => {
    queue.push(fn)
    return () => {
      queue.splice(queue.indexOf(fn), 1)
    }
  }

  const renderFactory =
    (gl: WebGL2RenderingContext, program: WebGLProgram) => () => {
      if (!program || !gl) return

      gl.useProgram(program)
      queue.forEach((fn) => fn())

      props.onRender?.(gl, program)

      gl.drawArrays(gl[props.mode], 0, 6)
    }

  createEffect(() => {
    if (!context) {
      console.error(
        'context is= undefined: make sure Program is sibling of GL.'
      )
    }
  })

  createEffect(() => {
    const gl = context?.gl

    if (!gl || !context.render) return

    const vertex = props.vertex()
    const fragment = props.fragment()

    const program = createProgram(gl, vertex.source, fragment.source)

    if (!program) return

    props.onInit?.(gl, program)

    const render = renderFactory(gl, program)

    batch(() => {
      vertex.bind(gl, program, context.render!, onRender)
      fragment.bind(gl, program, context.render!, onRender)
    })

    setRenderFunction(() => render)
  })

  return {
    get render() {
      return renderFunction()
    },
  } as any as JSXElement
}
