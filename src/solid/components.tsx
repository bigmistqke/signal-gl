import {
  JSXElement,
  Setter,
  children,
  createContext,
  createEffect,
  createMemo,
  mergeProps,
  onMount,
  splitProps,
  useContext,
  type Accessor,
  type ComponentProps,
} from 'solid-js'

import {
  ProgramToken,
  StackToken,
  autosize,
  clear,
  createProgram,
  createStack,
  filterProgramTokens,
} from '@core/hooks'
import type { ShaderToken } from '@core/types'

const glContext = createContext<{
  canvas: HTMLCanvasElement
  gl: WebGL2RenderingContext
  onProgramCreate?: () => void
}>()

const useGL = () => useContext(glContext)

const mount = (config: {
  token: ProgramToken | StackToken
  clear: undefined | boolean | ((token: ProgramToken | StackToken) => void)
  animate: undefined | boolean
}) => {
  autosize(config.token)
  config.token.render()

  const render = () => {
    if (config.clear) {
      if (typeof config.clear === 'function') config.clear(config.token)
      else clear(config.token)
    }
    config.token.render()
  }

  const animate = () => {
    if (config.animate) requestAnimationFrame(animate)
    render()
  }
  createEffect(() => (config.animate ? animate() : createEffect(render)))
}

type StackProps = ComponentProps<'canvas'> & {
  onProgramCreate?: () => void
  /* Enable/disable clear-function or provide a custom one. */
  clear?: boolean | ((gl: StackToken) => void)
  /* Enable/disable `rAF`-based animation or request fps. If disabled, render-loop will be `effect`-based. */
  animate?: boolean | number
}
export const Stack = (props: StackProps) => {
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
          try {
            const stack = createStack({
              canvas,
              get programs() {
                return filterProgramTokens(childs())
              },
            })
            autosize(stack)
            stack.render()

            const render = () => {
              if (props.clear) {
                if (typeof props.clear === 'function') props.clear(stack)
                else clear(stack)
              }
              stack.render()
            }

            const animate = () => {
              if (props.animate) requestAnimationFrame(animate)
              render()
            }
            createEffect(() =>
              props.animate ? animate() : createEffect(render)
            )
          } catch (error) {
            console.error(error)
          }
        })

        return canvas
      })()}
    </glContext.Provider>
  )
}

type ProgramProps = {
  count: number
  fragment: Accessor<ShaderToken>
  /** if defined `gl.drawElements` else `gl.drawArrays` */
  indices?: number[] | Uint16Array
  onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
  ref?: Setter<HTMLCanvasElement>
  vertex: Accessor<ShaderToken>
  mode: 'TRIANGLES' | 'POINTS' | 'LINES'
  /**
   * @unstable
   * ⚠️ Caching can cause issues when used in combination with dynamic and/or conditional glsl-snippets. Only enable cache when generated source is static. ⚠️
   */
  cacheEnabled?: boolean
}

export const Program = (props: ProgramProps) => {
  const context = useGL()
  if (!context) throw 'no context'
  const [shader, rest] = splitProps(props, ['vertex', 'fragment'])
  const config = mergeProps(
    {
      canvas: context.canvas,
      get fragment() {
        return shader.fragment()
      },
      get vertex() {
        return shader.vertex()
      },
    },
    rest
  )
  return createMemo(() => createProgram(config)) as any as JSXElement // cast to JSX
}
