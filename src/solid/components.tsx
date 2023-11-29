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

import type { ShaderToken } from '@core/types'
import { createGL, createProgram } from '@core/webgl'

const glContext = createContext<{
  canvas: HTMLCanvasElement
  gl: WebGL2RenderingContext
  onProgramCreate?: () => void
}>()

const useGL = () => useContext(glContext)

type GLProps = ComponentProps<'canvas'> & {
  onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
  onProgramCreate?: () => void
  onInit?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
  animate?: boolean
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
        const programs = children(() => childrenProps.children)

        onMount(() => {
          const gl = createGL({
            canvas,
            get programs() {
              return programs() as any[]
            },
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

        return canvas
      })()}
    </glContext.Provider>
  )
}

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
    })
  }) as any as JSXElement // cast to JSX
}
