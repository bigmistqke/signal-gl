# `signal-gl`

- Low-level abstraction around webgl
- Minimizing the gap between glsl and js
- First-class support for signals
  - Auto-binding uniforms/attributes
  - Renderloop as a side-effect (only re-render when needed)

## Overview

- [templating](#templating)
  - [`glsl`](#glsl-tag-template-literal) _tag template literal to compose glsl_
  - [`attribute`](#attribute-template-helper) _template-helper to include attribute into `glsl`-template_
  - [`uniform`](#uniform-template-helper) _template-helper to include uniform into `glsl`-template_
- [classes](#classes)
  - [`GLProgram`](#glprogram-class) _class for managing `WebGLProgram`_
  - [`GLStack`](#glstack-class) _class for managing multiple `Programs`_
  - [`GLTexture`](#glrendertexture-class) _class for managing `WebGLTexture`_
  - [`GLRenderBuffer`](#glrenderbuffer-class) _class for managing `WebGLFrameBuffer`_
  - [`GLRenderTexture`](#glrendertexture-class) _class for managing `GLRenderBuffer` that renders into `GLTexture`_
  - [`GLRenderTextureStack`](#glrendertexturestack-class) _class for managing `GLStack` that renders into `GLRenderTexture`_
- [hooks](#hooks)
  - [`useSignalGL`](#usesignalgl-hook) _context-hook, only available inside `<Canvas/>`_
  - [`createComputation`](#createcomputation-hook) _hook for gpu-computations_
- [components](#components)
  - [`<Canvas/>`](#gl-component) _root-component of `signal-gl`-tree_
  - [`<Program/>`](#program-component) _JSX representing `GLProgram`_
  - [`<RenderTexture/>`](#rendertexture-component) _JSX representing `GLRenderTextureStack`_

## templating

### `glsl` _tag template literal_

> write and compose `glsl` with a tag template literal
> interpolation [`Hole`](#type-hole)
>
> - auto-bind and link `attributes` / `uniforms` by interpolating [`attribute`](#attribute-component-helper) and [`uniform`](#uniform-component-helper) calls
> - link glsl-snippets into one shader by interpolating [`glsl`](#glsl-tag-template-literal) tag template literals
> - create scoped variable names by interpolating `strings`
>   returns [`ShaderToken`](#type-shadertoken) to be consumed by a [`<Program/>`](#program-component)

#### Usage

```ts
import { attribute, glsl, uniform } from "@bigmistqke/signal-gl"

const module = glsl`...`

const shader = glsl`#version 300 es

${module} // module's source is inlined in shader
float ${'scoped-var'} = 0.5 // prevent naming collisions with global variables by interpolating strings

out vec2 v_coord  
out vec3 v_color

void main() {
  // vertices is bound as an attribute
  vec2 a_coord = ${attribute.vec2(
    vertices
  )} 
  // cursor is bound as a uniform
  vec2 cursor = ${uniform.vec2(cursor)} 
  v_coord = a_coord * ${'scoped-var'} + cursor
  gl_Position = vec4(a_coord, 0, 1) 
}`
```

#### Signature

```ts
(strings: TemplateStringsArray, holes: Hole[]) : Accessor<ShaderToken>
```

#### type `ShaderToken`

```ts
type ShaderToken = Accessor<{
  tokenType: 'shader'
  source: string
  bind: (
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    render: () => void,
    onRender: OnRenderFunction
  ) => void
}>
```

#### type `Hole`

```ts
type ValueOf<T> = T[keyof T]

type Hole =
  | ReturnType<ValueOf<typeof attribute>> // glsl`${attribute.float(...)}` auto-binds a signal to an attribute
  | ReturnType<ValueOf<typeof uniform>> // glsl`${uniform.float(...)}`   auto-bind a signal to a uniform
  | ReturnType<typeof glsl> // glsl`${glsl`...`}`            compose shaders
  | string // glsl`{'scoped-var}`           scope variable name to prevent name-collisions
```

### `attribute` _template-helper_

> template-helper to include/bind a uniform into `glsl`.
> returns [`AttributeToken`](#type-attributetoken) to be consumed by [`glsl`](#glsl-tag-template-literal)

#### Usage

```ts
import { attribute, glsl } from "@bigmistqke/signal-gl"

// static
glsl`
  vec2 vertice = ${attribute.vec2(
    new Float32Array([
      -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
    ])
  )}
`

// dynamic
const [signal] = createSignal(
  new Float32Array([
    -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
  ])
)
glsl`
  vec2 vertice = ${attribute.vec2(signal)}
`
```

attributes can also be declared outside the template

```ts
import { attribute, glsl } from "@bigmistqke/signal-gl"

const u_vertices = attribute.vec2(
  new Float32Array([
    -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
  ])
)
glsl`
  vec2 vertice = ${u_vertices}
`
```

#### Signature

```ts
type AccessorOrValue<T> = Accessor<T> | T
type Buffer =
  | Int8Array
  | Int16Array
  | Int32Array
  | Float32Array
  | Float64Array

attribute.float ( AccessorOrValue<Buffer>, AttributeOptions ) : AttributeToken
attribute.int   ( AccessorOrValue<Buffer>, AttributeOptions ) : AttributeToken
attribute.bool  ( AccessorOrValue<Buffer>, AttributeOptions ) : AttributeToken
attribute.vec2  ( AccessorOrValue<Buffer>, AttributeOptions ) : AttributeToken
attribute.ivec2 ( AccessorOrValue<Buffer>, AttributeOptions ) : AttributeToken
attribute.bvec2 ( AccessorOrValue<Buffer>, AttributeOptions ) : AttributeToken
attribute.vec3  ( AccessorOrValue<Buffer>, AttributeOptions ) : AttributeToken
attribute.ivec3 ( AccessorOrValue<Buffer>, AttributeOptions ) : AttributeToken
attribute.bvec3 ( AccessorOrValue<Buffer>, AttributeOptions ) : AttributeToken
attribute.vec4  ( AccessorOrValue<Buffer>, AttributeOptions ) : AttributeToken
attribute.ivec4 ( AccessorOrValue<Buffer>, AttributeOptions ) : AttributeToken
attribute.bvec4 ( AccessorOrValue<Buffer>, AttributeOptions ) : AttributeToken
```

#### type `AttributeOptions`

```ts
type AttributeOptions = {
  name?: string
  target?:
    | 'ARRAY_BUFFER'
    | 'ELEMENT_ARRAY_BUFFER'
    | 'COPY_READ_BUFFER'
    | 'COPY_WRITE_BUFFER'
    | 'TRANSFORM_FEEDBACK_BUFFER'
    | 'UNIFORM_BUFFER'
    | 'PIXEL_PACK_BUFFER'
    | 'PIXEL_UNPACK_BUFFER'
}
```

#### type `AttributeToken`

```ts
type AttributeToken = {
  dataType: keyof Attribute
  functionName: UniformSetter
  name: string
  options: AttributeOptions
  size: number
  tokenType: 'attribute'
  value: any
}
```

### `uniform` _template-helper_

> template-helper to include/bind a uniform into `glsl`.
> returns [`UniformToken | Sampler2DToken`](#type-uniformtoken--sampler2dtoken) to be consumed by [`glsl`](#glsl-tag-template-literal)

#### Usage

```ts
import { glsl, uniform } from "@bigmistqke/signal-gl"

// static
glsl`
  float scale = ${uniform.float(1)}
`

// dynamic
const [signal] = createSignal(1)
glsl`
  float scale = ${uniform.float(signal)}
`
```

share a uniform between vertex and fragment shader by declaring it outside the template

```ts
const u_scale = uniform.float(1)
const vertex = glsl`
  float scale = ${u_scale}
`
const fragment = glsl`
  float scale = ${u_scale}
`
```

#### Signature

```ts
type AccessorOrValue<T> = Accessor<T> | T

uniform.float     ( AccessorOrValue<number>,                               UniformOptions   ) : UniformToken
uniform.int       ( AccessorOrValue<number>,                               UniformOptions   ) : UniformToken
uniform.bool      ( AccessorOrValue<boolean>,                              UniformOptions   ) : UniformToken
uniform.vec2      ( AccessorOrValue<[number, number]>,                     UniformOptions   ) : UniformToken
uniform.ivec2     ( AccessorOrValue<[number, number]>,                     UniformOptions   ) : UniformToken
uniform.bvec2     ( AccessorOrValue<[boolean, boolean]>,                   UniformOptions   ) : UniformToken
uniform.vec3      ( AccessorOrValue<[number, number, number]>,             UniformOptions   ) : UniformToken
uniform.ivec3     ( AccessorOrValue<[number, number, number]>,             UniformOptions   ) : UniformToken
uniform.bvec3     ( AccessorOrValue<[boolean, boolean, boolean]>,          UniformOptions   ) : UniformToken
uniform.vec4      ( AccessorOrValue<[number, number, number, number]>,     UniformOptions   ) : UniformToken
uniform.ivec4     ( AccessorOrValue<[number, number, number, number]>,     UniformOptions   ) : UniformToken
uniform.bvec4     ( AccessorOrValue<[boolean, boolean, boolean, boolean]>, UniformOptions   ) : UniformToken
uniform.sampler2D ( AccessorOrValue<Buffer>,                               Sampler2DOptions ) : Sampler2DToken
```

#### type `UniformOptions | Sampler2DOptions`

```ts
type UniformOptions = {
  name?: string
}

type Sampler2DOptions = UniformOptions & {
  dataType?: DataType
  width?: number
  height?: number
  type?: 'float' | 'integer'
  format?: Format
  internalFormat?: InternalFormat
  wrapS?: 'CLAMP_TO_EDGE'
  wrapT?: 'CLAMP_TO_EDGE'
  magFilter?: 'NEAREST' | 'LINEAR'
  minFilter?: 'NEAREST' | 'LINEAR'
  border?: number
}
```

#### type `UniformToken | Sampler2DToken`

```ts
type UniformToken = {
  dataType: Omit<keyof Uniform, 'sampler2D'>
  functionName: UniformSetter
  name: string
  options: PrimitiveOptions
  tokenType: 'uniform'
  value: any
}
type Sampler2DToken = {
  dataType: 'sampler2D'
  name: string
  options: Sampler2DOptions
  textureIndex: number
  tokenType: 'sampler2D'
  value: any
}
```

## Classes

### `GLProgram` _class_

> manages a `WebGLProgram` from a given vertex- and fragment-[`glsl`](#glsl-tag-template-literal)
> to use program, add it to the `programs`-property in GLStack's `GLStackConfig`

#### Usage

```tsx
import { glsl, GLProgram } from "@bigmistqke/signal-gl"

const fragment = glsl`#version 300 es
  precision mediump float
  in vec2 v_coord 
  out vec4 outColor
  void main() {
    outColor = vec4(${uniform.float(red)}, v_coord[1], 0, 1)
  }`

const vertex = glsl`#version 300 es
  out vec2 v_coord  
  out vec3 v_color
  void main() {
    vec2 a_coord = ${attribute.vec2(vertices)}
    v_coord = a_coord
    gl_Position = vec4(a_coord, 0, 1) 
  }`

const program = new GLProgram({
  canvas,
  vertex: vertex(),
  fragment: fragment(),
  mode: 'TRIANGLES',
  count: vertices.length / 2,
})

// will re-render if either `vertices` or `red` gets updates
createEffect(program.render)
```

#### Signature

```ts
class GLProgram {
  constructor(config: ProgramConfig)
  requestRender()
  render()
  read(output: BufferArray, config: Partial<TextureOptions>): BufferArray
}
```

#### type `ProgramConfig`

```ts
type ProgramConfig = {
  canvas: HTMLCanvasElement
  cacheEnabled?: boolean // true
  count: number
  fragment: ShaderToken
  vertex: ShaderToken
  mode?: RenderMode // 'TRIANGLES'
}
```

### `GLStack` _class_

> manage the `webgl2`-context of a given `<canvas/>`-element

#### Usage

```tsx
import { GLStack } from "@bigmistqke/signal-gl"

const canvas = <canvas/>
const gl = new GLStack({canvas, programs: [programs]})
if(!gl) return

// render programs to given canvas-element whenever any of its attributes/uniforms update
createEffect(gl.render)
// automatically update gl-dimensions when canvas updates
gl.autosize()
// export the rendered result of the current program to a given TypedArray
gl.read({ output: new Float32Array(...) })
```

#### Signature

```ts
class GLStack {
  constructor(config: GLStackConfig)
  requestRender()
  render()
  read(output: BufferArray, config: Partial<TextureOptions>): BufferArray
}
```

#### type `GLStackConfig`

```ts
type GLStackConfig = {
  canvas: HTMLCanvasElement
  programs: ReturnType<typeof GLProgram>[]
}
```

### Hooks

### `useSignalGL` _hook_

- access `signal-gl` state through context
- only available inside scope of a `<Canvas/>`

#### Usage

```tsx
import { useSignalGL } from "@bigmistqke/signal-gl"

const Object = () => {
  const signalgl = useSignalGL()
  if(!signalgl) throw 'signalgl is not defined'
  console.log(signalgl.canvas)
  ...
}
```

#### type `SignalGLContext`

```ts
type SignalGLContext = {
  canvas: HTMLCanvasElement
  gl: WebGL2RenderingContext
  onRender: (callback: () => void) => () => void
  onResize: (callback: () => void) => () => void
}
```

### `createComputation` _hook_

- create a computation on the gpu with `renderbuffer`
- sensible default configs for `Uint8Array` and `Float32Array`

#### Usage

```tsx
import { createComputation } from "@bigmistqke/signal-gl"

const [input, setInput] = createSignal(new Float32Array(WIDTH * HEIGHT))
const compute = createComputation(
  input,
  (u_buffer) => glsl`
    ivec2 index = ivec2(gl_FragCoord.xy)
    vec4 value = texelFetch(${u_buffer}, index, 0)
    return sqrt(value)
  `,
  {
    width: WIDTH,
    height: HEIGHT,
  }
)
const memo = createMemo(compute) // Accessor<Float32Array>
```

#### Signature

```ts
(
  buffer: Buffer,
  cb: (u_buffer: Accessor<Sampler2DToken>) => Accessor<ShaderToken>,
  config: ComputationConfig
) : Buffer
```

#### type `ComputationConfig`

```ts
type ComputationConfig = {
  dataType?: DataType // FLOAT
  width?: number // input.length
  height?: number // 1
  internalFormat?: InternalFormat // R32F
  format?: Format // RED
}
```

sensible defaults for `UInt8Array` and `Float32Array`

```ts
// UInt8Array
{
  dataType: 'UNSIGNED_BYTE',
  internalFormat: 'R8',
  format: 'RED',
}

// Float32Array
{
  dataType: 'FLOAT',
  internalFormat: 'R32F',
  format: 'RED',
}
```

## components

### `<Stack/>` _component_

- root `JSXElement`
- represents a `canvas` and its `WebGL2RenderingContext`
- wrapper around [`GLStack`](#createstack-hook)

#### Usage

```tsx
import { Canvas } from '@bigmistqke/solid-gl'
<Canvas onProgramCreate={() => console.log('program created')}>
  <Program />
</Canvas>
```

#### type `CanvasProps`

```ts
type CanvasProps = ComponentProps<'canvas'> & {
  onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
  onProgramCreate?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
  animate?: boolean
}
```

### `<Program/>` _component_

- sibling of [`<Canvas/>`](#gl-component)
- represents a `WebGLProgram`

#### Usage

```tsx
import { Program } from '@bigmistqke/solid-gl'
<Program fragment={glsl`...`} vertex={glsl`...`} mode="TRIANGLES" />
```

#### type `ProgramProps

```ts
type ProgramProps = {
  fragment: ShaderToken
  vertex: ShaderToken
  mode: 'TRIANGLES' | 'LINES' | 'POINTS'
}
```
