# 🚦 signal-gl

[![GitHub package.json version (subfolder of monorepo)](https://img.shields.io/github/package-json/v/bigmistqke/signal-gl)](https://www.npmjs.com/package/@bigmistqke/signal-gl)
[![Signal-gl bundle size](https://edge.bundlejs.com/badge?q=@bigmistqke/signal-gl@0.0.25&config={%22esbuild%22:{%22external%22:[%22solid-js%22]}})](https://bundlejs.com/?q=%40bigmistqke%2Fsignal-gl%400.0.25&config=%7B%22esbuild%22%3A%7B%22external%22%3A%5B%22solid-js%22%5D%7D%7D)
[![Maintained with pnpm](https://img.shields.io/badge/maintained_with-pnpm-%23cc01ff)](https://github.com/pnpm/pnpm)

`minimal` `inline` `reactive` `glsl` `auto-binding` `signals` `no boilerplate` `tag template literals`

## Overview

- [Premise](#premise)  
- [Bindings](#bindings)
- [Install](#install)
- [Use it](#use-it)
  - [Hello World](#hello-world-playground)
  - [More Examples](./dev/src/examples/README.md)
- [API](#api)
  - [templating](#templating) _compose shaders with autobinding attributes and uniforms_
    - [`glsl`](#glsl-tag-template-literal) _tag template literal to compose glsl_
    - [`attribute`](#attribute-template-helper) _template-helper to include attribute into `glsl`-template_
    - [`uniform`](#uniform-template-helper) _template-helper to include uniform into `glsl`-template_
  - [hooks](#hooks) _manage `WebGL2RenderingContext` and `WebGLProgram`_
    - [`createGL`](#creategl-hook) _hook managing `WebGL2RenderingContext`_
    - [`createProgram`](#createprogram-hook) _hook managing `WebGLProgram`_
    - [`createComputation`](#createcomputation-hook) _hook for gpu-computations_
  - [components](#components) _JSX wrappers around `hooks`_
    - [`<GL/>`](#gl-component) _JSX wrapper around `createGL`_
    - [`<Program/>`](#program-component) _JSX wrapper around `createProgram`_
- [Syntax Highlighting](#syntax-highlighting) 
- [Prior Art](#prior-art) 

## Premise

- `Minimal` abstraction
- Co-locating `js` and `glsl`
- Composition of `glsl` snippets
- Lessen boilerplate with `auto-binding` uniforms and attributes and `sensible` defaults
- `Purely runtime`: no additional build tools
- Small footprint: `<5kb minified + gzip`

## Bindings

Currently there are only `solid` bindings, but the dependency on `solid` is minimal. If this idea has any merit it would be trivial to make bindings for other signal implementations.

## Install

```bash
npm i @bigmistqke/signal-gl
# or
pnpm i @bigmistqke/signal-gl
# or
yarn add @bigmistqke/signal-gl
```

## Use it

### Hello World [[playground]](https://playground.solidjs.com/anonymous/72a268af-262d-4d9a-84e4-4d60c94157b3)

<video alt="screen-recording 'Hello World'-example" src="https://github.com/bigmistqke/signal.gl/assets/10504064/e306b06e-1b74-4f83-870c-f371c054b6f2">
  <img src="https://github.com/bigmistqke/signal.gl/assets/10504064/30b0c5ad-fd5d-4a58-812e-24734a43c52d"/>
</video>

```tsx
const [opacity, setOpacity] = createSignal(0.5)
const vertices = new Float32Array([
  -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
])

const fragment = glsl`#version 300 es
  precision mediump float;
  in vec2 v_coord; 
  out vec4 outColor;
  void main() {
    float opacity = ${uniform.float(opacity)};
    outColor = vec4(v_coord[0], v_coord[1], v_coord[0], opacity);
  }`

const vertex = glsl`#version 300 es
  out vec2 v_coord;  
  out vec3 v_color;
  void main() {
    vec2 a_coord = ${attribute.vec2(vertices)};
    v_coord = a_coord;
    gl_Position = vec4(a_coord, 0, 1) ;
  }`

return (
  <GL onMouseMove={(e) => setOpacity(e.clientY / e.currentTarget.offsetHeight)}>
    <Program fragment={fragment} vertex={vertex} mode="TRIANGLES" />
  </GL>
)
```

### [more examples](./dev/src/examples/README.md)

## API

## templating

### `glsl` _tag template literal_

> - write and compose `glsl`
> - interpolation [see `Hole`](#hole)
>   - auto-bind and link `attributes` / `uniforms` by interpolating [`attribute`](#attribute-utility-function) and [`uniform`](#uniform-utility-function) calls
>   - link glsl-snippets into one shader by interpolating [`glsl`](#glsl-tag-template-literals) tag template literals
>   - create scoped variable names by interpolating `strings`
> - returns [`ShaderToken`](#type-shadertoken) to be consumed by a [`<Program/>`](#program-component)

#### Usage

```ts
const module = glsl`...`

const shader = glsl`#version 300 es

${module} // module's source is inlined in shader
float ${'scoped-var'} = 0.5; // prevent naming collisions with global variables by interpolating strings

out vec2 v_coord;  
out vec3 v_color;

void main() {
  vec2 a_coord = ${attribute.vec2(vertices)}; // vertices is bound as an attribute
  vec2 cursor = ${uniform.vec2(cursor)};      // cursor is bound as a uniform
  v_coord = a_coord * ${'scoped-var'} + cursor;
  gl_Position = vec4(a_coord, 0, 1) ;
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
  | ReturnType<ValueOf<typeof uniform>>   // glsl`${uniform.float(...)}`   auto-bind a signal to a uniform
  | ReturnType<typeof glsl>               // glsl`${glsl`...`}`            compose shaders
  | string                                // glsl`{'scoped-var}`           scope variable name to prevent name-collisions
```

### `attribute` _template-helper_

> - returns [`AttributeToken`](#type-attributetoken) to be consumed by [`glsl`](#glsl-tag-template-literal)

#### Usage

```ts
// static
glsl`
  vec2 vertice = ${attribute.vec2(new Float32Array([
    -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
  ]))};
`

// dynamic
const [signal] = createSignal(new Float32Array([
  -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
]))
glsl`
  vec2 vertice = ${attribute.vec2(signal)};
`
```

attributes can also be declared outside the template

```ts
const u_vertices = attribute.vec2(new Float32Array([
  -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
]))
glsl`
  vec2 vertice = ${u_vertices};
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

> returns [`UniformToken | Sampler2DToken`](#type-uniformtoken--sampler2dtoken) to be consumed by [`glsl`](#glsl-tag-template-literal)

#### Usage

```ts
// static
glsl`
  float scale = ${uniform.float(1)};
`

// dynamic
const [signal] = createSignal(1)
glsl`
  float scale = ${uniform.float(signal)};
`
```

share a uniform between vertex and fragment shader by declaring it outside the template

```ts
const u_scale = uniform.float(1);
const vertex = glsl`
  float scale = ${u_scale};
`
const fragment = glsl`
  float scale = ${u_scale};
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

## hooks

### `createGL` _hook_

> manage the `webgl2`-context of a given `<canvas/>`-element

#### Usage
```tsx
const canvas = <canvas/>
const gl = createGL({canvas, programs: [programs]})
if(!gl) return;

// render programs to given canvas-element
createEffect(() =>gl.render());
// export the rendered result of the current program to a given TypedArray
createEffect(() => console.log(gl.read(new Float32Array(...)))); 
```

#### Signature

```ts
const createCanvas = (config: GLConfig): GLReturnType
```

#### type `GLConfig`

```ts
type GLConfig = {
  autoResize?: boolean         // default true
  canvas?: HTMLCanvasElement
  extensions?: {
    float?: boolean            // default true
    half_float?: boolean       // default false
  }
  onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
  onInit?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
  programs: ReturnType<typeof createProgram>[]
}
```

#### type `GLReturnType`

- `gl.read` has conditional default values as config
  - when output `Uint8Array` then `{ internalFormat: 'R8', format: 'RED', dataType: 'UNSIGNED_BYTE' }`
  - when output `Float32Array` then `{ internalFormat: 'R32F', format: 'RED', dataType: 'FLOAT' }`
  - else `{ internalFormat: 'R32F', format: 'RED', dataType: 'FLOAT' }`

```ts
type GLReturnType = {
  render: () => void,
  read: (
    output: Buffer,
    config: {
      width?: number
      height?: number
      internalFormat?: InternalFormat
      format?: Format
      dataType?: DataType
    }
  ) => Buffer
} 
```

### `createProgram` _hook_

> manages a `WebGLProgram` from a given vertex- and fragment-[`glsl`](#glsl-tag-template-literal)
> to use program, add it to the `programs`-property in createGL's `GLConfig`

#### Usage
```tsx
const fragment = glsl`#version 300 es
  precision mediump float;
  in vec2 v_coord; 
  out vec4 outColor;
  void main() {
    outColor = vec4(v_coord[0], v_coord[1], 0, 1);
  }`

const vertex = glsl`#version 300 es
  out vec2 v_coord;  
  out vec3 v_color;
  void main() {
    vec2 a_coord = ${attribute.vec2(vertices)};
    v_coord = a_coord;
    gl_Position = vec4(a_coord, 0, 1) ;
  }`

const program = createProgram({
  canvas,
  vertex: vertex(),
  fragment: fragment(),
  mode: 'TRIANGLES',
  count: vertices.length / 2,
})
```

#### Signature

```ts
import { createProgram } from "@bigmistqke/solid-gl"
const createProgram = (config: ProgramConfig): ProgramReturnType
```

#### type `ProgramConfig`

```ts
type ProgramConfig =
  {
    canvas: HTMLCanvasElement,
    // defaults to true
    cacheEnabled?: boolean,
    count: number
    fragment: ShaderToken,
    vertex: ShaderToken,
    onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
    onInit?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
  }
```

#### type `ProgramReturnType`

```ts
type ProgramReturnType = {
  render: () => void,
} 
```

### `createComputation` _hook_

- create a computation on the gpu with `renderbuffer`
- sensible default configs for `Uint8Array` and `Float32Array`

#### Usage

```tsx
const [input, setInput] = createSignal(new Float32Array(WIDTH * HEIGHT));
const compute = createComputation(input, (u_buffer) => glsl`
  ivec2 index = ivec2(gl_FragCoord.xy);
  vec4 value = texelFetch(${u_buffer}, index, 0);
  return sqrt(value);
`, {
  width: WIDTH,
  height: HEIGHT,
})
const memo = createMemo(compute) // Float32Array
```

#### Signature

```ts
const createComputation = (
  buffer: Buffer, 
  cb: (u_buffer: Accessor<Sampler2DToken>) => Accessor<ShaderToken>,
  config: ComputationConfig
) : Buffer
```

#### type `ComputationConfig`

```ts
type ComputationConfig = {
  dataType?: DataType
  width?: number
  height?: number
  internalFormat?: InternalFormat
  format?: Format
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

### `<GL/>` _component_

- root `JSXElement`
- represents a `canvas` and its `WebGL2RenderingContext`
- wrapper around [`createGL`](#creategl-utility-function)

#### Usage

```tsx
import { GL } from "@bigmistqke/solid-gl"
<GL {...props as GLProps}>
  ...
</GL>
```

#### Signature

```ts
const GL = (props: GLProps) => JSXElement
```

#### type `GLProps`

```ts
type GLProps =
  ComponentProps<'canvas'> & {
    onRender?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
    onInit?: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
    animate?: boolean
  }
```

### `<Program/>` _component_

- sibling of [`<GL/>`](#gl-component)
- represents a `WebGLProgram`

#### Usage

```tsx
import { Program } from "@bigmistqke/solid-gl"
<Program fragment={glsl`...`} vertex={glsl`...`} mode='TRIANGLES'/>
```

#### Signature

```ts
const Program = (props: ProgramProps) => JSXElement
```

#### type `ProgramProps

```ts
type ProgramProps = {
  fragment: Accessor<ShaderToken>
  vertex: Accessor<ShaderToken>
  mode: 'TRIANGLES' | 'LINES' | 'POINTS'
}
```

## Syntax Highlighting

_use in combination with tag template literal syntax highlighting: see [glsl-literal syntax higlighting](https://marketplace.visualstudio.com/items?itemName=boyswan.glsl-literal) for `vs-code`_

<img width="417" alt="signal-gl code with syntax highlighting" src="https://github.com/bigmistqke/signal.gl/assets/10504064/d2027993-31ac-4c88-8f7f-c0b6f51d992c">

## Prior Art

_these libraries could be of interest if you are looking for stable and well-tested webgl libraries_

- [regl](https://github.com/regl-project/regl) _functional webgl library_
- [ogl](https//github.com/oframe/ogl) _minimal webgl library_
- [twgl](https//github.com/greggman/twgl.js) _tiny webgl library_
- [four](https//github.com/CodyJasonBennett/four) _minimal webgl/webgpu alternative to three.js_
- [useGPU](https://gitlab.com/unconed/use.gpu) _declarative, reactive webgpu library + glsl/wsgl linker/treeshaker_
- [lume](https://github.com/lume/lume) _signal-driven custom html-elements for webgl/webgpu_
