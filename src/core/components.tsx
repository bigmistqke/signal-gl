import {
  Component,
  JSX,
  JSXElement,
  ParentProps,
  Setter,
  children,
  createContext,
  createEffect,
  createMemo,
  mergeProps,
  onMount,
  splitProps,
  useContext,
  type ComponentProps,
} from 'solid-js'

import {
  GLProgram,
  GLProgramConfig,
  GLRenderTexture,
  GLRenderTextureStack,
  GLStack,
  filterGLPrograms,
} from './classes'
import type { RenderMode, ShaderToken, Vector4 } from './types'

/* CONTEXT */

const internalContext = createContext<{
  canvas: HTMLCanvasElement
  gl: WebGL2RenderingContext
  onProgramCreate?: () => void
  events: {
    onResize: Set<() => void>
    onRender: Set<() => void>
  }
}>()
const useInternal = () => useContext(internalContext)

const signalGLContext = createContext<{
  canvas: HTMLCanvasElement
  gl: WebGL2RenderingContext
  onRender: (callback: () => void) => () => void
  onResize: (callback: () => void) => () => void
}>()
export const useSignalGL = () => useContext(signalGLContext)

/* UTILS */

const createRenderLoop = (
  config: CanvasProps & {
    stack: GLStack
  }
) => {
  const context = useInternal()

  if (!context) return

  config.stack.autosize(() => {
    config.onResize?.(config.stack)
    context.events.onResize.forEach((fn) => fn())
  })

  const render = () => {
    /* if (config.clear) {
      if (typeof config.clear === 'function') config.clear(config.stack)
      else config.stack.clear()
    } */

    config.stack.clear()
    config.onRender?.()
    context.events.onRender.forEach((fn) => fn())
    config.stack.render()
  }

  let past: number | undefined
  const animate = () => {
    if (!config.animate) return
    if (config.animate !== true) {
      let now = Date.now()
      if (!past || now - past > config.animate) {
        render()
        past = now
      }
    } else {
      render()
    }
    requestAnimationFrame(animate)
  }
  createEffect(() => {
    if (config.animate) {
      setTimeout(animate)
    } else {
      createEffect(render)
      past = undefined
    }
  })
}

/* CANVAS */

type StackProps = {
  onRender?: () => void
  onResize?: (token: GLStack) => void
  onProgramCreate?: () => void
  /* Enable/disable clear-function or provide a custom one. */
  clear?: boolean | ((gl: GLStack) => void)
  /* Enable/disable `rAF`-based animation or request fps. If disabled, render-loop will be `effect`-based. */
  animate?: boolean | number
  background?: Vector4
}

type CanvasProps = ComponentProps<'canvas'> & StackProps

/** Root-element containing `<canvas/>` and `GLStack`. */
export const Canvas = (props: CanvasProps) => {
  const [childrenProps, rest] = splitProps(props, ['children'])
  const merged = mergeProps({ clear: true }, rest)
  const canvas = (<canvas {...rest} />) as HTMLCanvasElement
  const gl = canvas.getContext('webgl2')!

  const events = {
    onResize: new Set<() => void>(),
    onRender: new Set<() => void>(),
  }

  return (
    <internalContext.Provider
      value={{
        canvas,
        events,
        gl,
        get onProgramCreate() {
          return props.onProgramCreate
        },
      }}
    >
      <signalGLContext.Provider
        value={{
          canvas,
          gl,
          onRender: (callback: () => void) => {
            events.onRender.add(callback)
            return () => events.onRender.delete(callback)
          },
          onResize: (callback: () => void) => {
            events.onResize.add(callback)
            return () => events.onResize.delete(callback)
          },
        }}
      >
        {(() => {
          const childs = children(() => childrenProps.children)
          const programs = createMemo(() => filterGLPrograms(childs()))
          onMount(() => {
            try {
              const stack = new GLStack({
                canvas,
                background: props.background,
                get programs() {
                  return programs()
                },
              })
              createRenderLoop(mergeProps(merged, { stack }))
            } catch (error) {
              console.error(error)
            }
          })

          return canvas
        })()}
      </signalGLContext.Provider>
    </internalContext.Provider>
  )
}

/* PROGRAM */

interface ProgramPropsBase {
  fragment: ShaderToken
  onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
  ref?: Setter<HTMLCanvasElement>
  vertex: ShaderToken
  buffer?: any
  /**
   * default "TRIANGLES"
   */
  mode?: RenderMode
  /**
   * @unstable
   * ⚠️ Caching can cause issues when used in combination with dynamic and/or conditional glsl-snippets. Only enable cache when generated source is static. ⚠️
   */
  cacheEnabled?: boolean
}

/* Program rendered with gl.drawElements */
interface ArrayProgramProps extends ProgramPropsBase {
  count: number
}

/* Program rendered with gl.drawArray */
interface ElementProgramProps extends ProgramPropsBase {
  indices: number[] | Uint16Array
}

type ProgramProps = ArrayProgramProps | ElementProgramProps

/** JSX-wrapper around `GLProgram`. */
export const Program = (props: ProgramProps) => {
  const context = useInternal()
  if (!context) throw 'no context'
  const config = mergeProps(
    {
      canvas: context.canvas,
    },
    props
  )
  return (() => new GLProgram(config as GLProgramConfig)) as any as JSXElement // cast to JSX
}

/** JSX-wrapper around `GLRenderTextureStack`. */
export const RenderTexture: Component<
  ParentProps<StackProps> & {
    onTextureUpdate: (texture: GLRenderTexture) => void
    passthrough?: boolean
  }
> = (props) => {
  const merged = mergeProps({ clear: true }, props)

  const internal = useInternal()
  if (!internal) throw 'internal context undefined'

  const childs = children(() => props.children)

  try {
    const stack = new GLRenderTextureStack({
      canvas: internal.canvas,
      get programs() {
        return filterGLPrograms(childs())
      },
      width: internal.canvas.width,
      height: internal.canvas.width,
    })
    createRenderLoop(
      mergeProps(merged, {
        stack,
        onRender: () => {
          props.onTextureUpdate(stack.texture)
          props.onRender?.()
        },
      })
    )
  } catch (error) {
    console.error(error)
  }

  return (() =>
    props.passthrough ? props.children : <></>) as any as JSX.Element
}
