import {
  children,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onMount,
  splitProps,
  useContext,
  type Accessor,
  type ComponentProps,
} from 'solid-js'

import type { ShaderToken } from '@core/types'
import { createGL, createProgram } from '@core/webgl'

const glContext = createContext<{
  gl: WebGL2RenderingContext
  onProgramCreate?: () => void
}>()

const useGL = () => useContext(glContext)

export const GL = (
  props: ComponentProps<'canvas'> & {
    onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
    onProgramCreate?: () => void
    onInit?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
    animate?: boolean
  }
) => {
  const [childrenProps, rest] = splitProps(props, ['children'])
  const [canvas, setCanvas] = createSignal<HTMLCanvasElement | undefined>()

  return (
    <glContext.Provider
      value={{
        get gl() {
          return canvas()?.getContext('webgl2')!
        },
        get onProgramCreate() {
          return props.onProgramCreate
        },
      }}
    >
      {(() => {
        const memoChildren = children(() => childrenProps.children)

        onMount(() => {
          const _canvas = canvas()

          if (!_canvas) return

          const gl = createGL({
            canvas: _canvas,
            programs: memoChildren() as any[],
          })

          if (!gl) return

          const animate = () => {
            if (props.animate) requestAnimationFrame(animate)
            gl.render()
          }

          createEffect(() =>
            props.animate ? animate() : createEffect(gl.render)
          )
        })

        return <canvas ref={setCanvas} {...rest} />
      })()}
    </glContext.Provider>
  )
}

const programCache: WeakMap<
  TemplateStringsArray,
  WeakMap<TemplateStringsArray, WebGLProgram>
> = new WeakMap()

type ProgramProps = {
  fragment: Accessor<ShaderToken>
  vertex: Accessor<ShaderToken>
  onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
  onInit?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
  mode: 'TRIANGLES' | 'POINTS' | 'LINES'
  /**
   * @unstable
   * ⚠️ Caching can cause issues when used in combination with dynamic and/or conditional glsl-snippets. Only enable cache when generated source is static. ⚠️
   */
  cacheEnabled?: boolean
}

export const Program = (props: ProgramProps) => {
  const context = useGL()

  createEffect(() => {
    if (!context) {
      console.error(
        'context is undefined: make sure <Program/> is sibling of <GL/>'
      )
    }
  })

  return createMemo(() => {
    if (!context?.gl) return

    const vertex = props.vertex()
    const fragment = props.fragment()

    return createProgram({
      gl: context.gl,
      fragment: fragment,
      vertex: vertex,
      mode: props.mode,
      cacheEnabled: !!props.cacheEnabled,
      onRender: props.onRender,
    })
  })
}
