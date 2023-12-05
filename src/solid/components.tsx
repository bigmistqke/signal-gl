import {
  JSXElement,
  children,
  createContext,
  createEffect,
  createMemo,
  onMount,
  splitProps,
  useContext,
  type Accessor,
  type ComponentProps,
} from 'solid-js'

import {
  GLToken,
  autosize,
  clear as clearGL,
  createGL,
  createProgram,
  filterProgramTokens,
} from '@core/hooks'
import type { ShaderToken } from '@core/types'

const glContext = createContext<{
  canvas: HTMLCanvasElement
  gl: WebGL2RenderingContext
  onProgramCreate?: () => void
}>()

const useGL = () => useContext(glContext)

type GLProps = ComponentProps<'canvas'> & {
  onProgramCreate?: () => void
  /* Enable/disable clear-function or provide a custom one. */
  clear?: boolean | ((gl: GLToken) => void)
  /* Enable/disable `rAF`-based animation or request fps. If disabled, render-loop will be `effect`-based. */
  animate?: boolean | number
}

export const GL = (props: GLProps) => {
  const [childrenProps, rest] = splitProps(props, ['children'])
  const canvas = (<canvas {...rest} />) as HTMLCanvasElement

  return (
    <glContext.Provider
      value={{
        canvas,
        gl: canvas.getContext('webgl2')!,
        get onProgramCreate() {
          return props.onProgramCreate
        },
      }}
    >
      {(() => {
        const childs = children(() => childrenProps.children)

        onMount(() => {
          const gl = createGL({
            canvas,
            get programs() {
              return filterProgramTokens(childs())
            },
          })

          autosize(gl)
          gl.render()

          if (!gl) return

          const clear = () => {
            if (!props.clear) return
            if (typeof props.clear === 'function') props.clear(gl)
            else clearGL(gl)
          }

          const render = () => {
            clear()
            gl.render()
          }

          const animate = () => {
            if (props.animate) requestAnimationFrame(animate)
            render()
          }
          createEffect(() => (props.animate ? animate() : createEffect(render)))
        })

        return canvas
      })()}
    </glContext.Provider>
  )
}

type ProgramProps = {
  count: number
  fragment: Accessor<ShaderToken>
  vertex: Accessor<ShaderToken>
  onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
  mode: 'TRIANGLES' | 'POINTS' | 'LINES'
  /**
   * @unstable
   * ⚠️ Caching can cause issues when used in combination with dynamic and/or conditional glsl-snippets. Only enable cache when generated source is static. ⚠️
   */
  cacheEnabled?: boolean
}

export const Program = (props: ProgramProps) => {
  const context = useGL()

  if (!context)
    throw 'context is undefined: make sure <Program/> is sibling of <GL/>'

  return createMemo(() => {
    const vertex = props.vertex()
    const fragment = props.fragment()

    return createProgram({
      canvas: context.canvas,
      fragment: fragment,
      vertex: vertex,
      mode: props.mode,
      cacheEnabled: !!props.cacheEnabled,
      onRender: props.onRender,
      count: props.count,
    })
  }) as any as JSXElement // cast to JSX
}
