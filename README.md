# 🚦 signal-gl

[![GitHub package.json version (subfolder of monorepo)](https://img.shields.io/github/package-json/v/bigmistqke/signal-gl)](https://www.npmjs.com/package/@bigmistqke/signal-gl)
[![Signal-gl bundle size](https://edge.bundlejs.com/badge?q=@bigmistqke/signal-gl@latest&config={%22esbuild%22:{%22external%22:[%22solid-js%22]}})](https://bundlejs.com/?q=%40bigmistqke%2Fsignal-gl%400.0.23&config=%7B%22esbuild%22%3A%7B%22external%22%3A%5B%22solid-js%22%5D%7D%7D)
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
  - [`glsl`](#glsl-tag-template-literal)
  - [`attribute`](#attribute-utility-function)
  - [`uniform`](#uniform-utility-function)
  - [`<GL/>`](#gl-component)
  - [`<Program/>`](#program-component)
- [Syntax Highlighting](#syntax-highlighting) 
- [Prior Art](#prior-art) 

## Premise

- `Minimal` abstraction
- Co-locating `js` and `glsl`
- Composition of `glsl` snippets
- Lessen boilerplate with `auto-binding` uniforms and attributes
- `Purely runtime`: no additional build tools
- Small footprint: `3kb minified + gzip`

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

### `glsl` _tag template literal_

- write and compose `glsl`
- interpolation
  - auto-bind and link `attributes` / `uniforms` by interpolating [`attribute`](#attribute-utility-function) and [`uniform`](#uniform-utility-function) calls
  - link glsl-snippets into one shader by interpolating [`glsl`](glsl-tag-template-literals) tag template literals
  - create scoped variable names by interpolating `strings`
- returns [`ShaderToken`](#return-type-shadertoken) to be consumed by a [`<Program/>`](#program-component)

#### usage

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

#### return-type: `ShaderToken`
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

##### interpolation-type
```ts
type ValueOf<T> = T[keyof T]

type Interpolation =
  | ReturnType<ValueOf<typeof attribute>> // glsl`${attribute.float(...)}` auto-binds a signal to an attribute
  | ReturnType<ValueOf<typeof uniform>>   // glsl`${uniform.float(...)}`   auto-bind a signal to a uniform
  | ReturnType<typeof glsl>               // glsl`${glsl`...`}`            compose shaders
  | string                                // glsl`{'scoped-var}`           scope variable name to prevent name-collisions
```

### `attribute` _utility-function_

- returns [`AttributeToken`](#return-type-attributetoken) to be consumed by [`glsl`](#glsl-tag-template-literal)

#### usage

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

You can also declare an attribute outside the template.

```ts
const u_vertices = attribute.vec2(new Float32Array([
  -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
]))
glsl`
  vec2 vertice = ${u_vertices};
`
```

#### signatures

```ts
type AccessorOrValue<T> = Accessor<T> | T
type Buffer =   
  | Int8Array
  | Int16Array
  | Int32Array
  | Float32Array
  | Float64Array

attribute.float ( AccessorOrValue<Buffer>, AttributeOptions )
attribute.int   ( AccessorOrValue<Buffer>, AttributeOptions )
attribute.bool  ( AccessorOrValue<Buffer>, AttributeOptions )
attribute.vec2  ( AccessorOrValue<Buffer>, AttributeOptions )
attribute.ivec2 ( AccessorOrValue<Buffer>, AttributeOptions )
attribute.bvec2 ( AccessorOrValue<Buffer>, AttributeOptions )
attribute.vec3  ( AccessorOrValue<Buffer>, AttributeOptions )
attribute.ivec3 ( AccessorOrValue<Buffer>, AttributeOptions )
attribute.bvec3 ( AccessorOrValue<Buffer>, AttributeOptions )
attribute.vec4  ( AccessorOrValue<Buffer>, AttributeOptions )
attribute.ivec4 ( AccessorOrValue<Buffer>, AttributeOptions )
attribute.bvec4 ( AccessorOrValue<Buffer>, AttributeOptions )
```

#### options-type

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

#### return-type: `AttributeToken`

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

### `uniform` _utility-function_

- returns [`UniformToken | Sampler2DToken`](#return-type-uniformtoken--sampler2dtoken) to be consumed by [`glsl`](#glsl-tag-template-literal)

#### usage

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

Share a uniform between vertex and fragment shader by declaring it outside the template.

```ts
const u_scale = uniform.float(1);
const vertex = glsl`
  float scale = ${u_scale};
`
const fragment = glsl`
  float scale = ${u_scale};
`
```

#### signatures

```ts
type AccessorOrValue<T> = Accessor<T> | T

uniform.float ( AccessorOrValue<number>,                               UniformOptions )
uniform.int   ( AccessorOrValue<number>,                               UniformOptions )
uniform.bool  ( AccessorOrValue<boolean>,                              UniformOptions )
uniform.vec2  ( AccessorOrValue<[number, number]>,                     UniformOptions )
uniform.ivec2 ( AccessorOrValue<[number, number]>,                     UniformOptions )
uniform.bvec2 ( AccessorOrValue<[boolean, boolean]>,                   UniformOptions )
uniform.vec3  ( AccessorOrValue<[number, number, number]>,             UniformOptions )
uniform.ivec3 ( AccessorOrValue<[number, number, number]>,             UniformOptions )
uniform.bvec3 ( AccessorOrValue<[boolean, boolean, boolean]>,          UniformOptions )
uniform.vec4  ( AccessorOrValue<[number, number, number, number]>,     UniformOptions )
uniform.ivec4 ( AccessorOrValue<[number, number, number, number]>,     UniformOptions )
uniform.bvec4 ( AccessorOrValue<[boolean, boolean, boolean, boolean]>, UniformOptions )
```

#### options-type: `UniformOptions`

```ts
type UniformOptions = {
  name?: string
}
```

#### return-type: `UniformToken | Sampler2DToken`

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

### `<GL/>` _component_

- root `JSXElement`
- represents a `canvas` and its `WebGL2RenderingContext`

#### usage

```tsx
<GL {...props as GLProps}>
  ...
</GL>
```

#### props-type

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

#### usage

```tsx
<Program fragment={glsl`...`} vertex={glsl`...`} mode='TRIANGLES'/>
```

#### props-type

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

_these libraries could be of interest if you are looking for something a bit more stable and well-tested_

- [regl](https://github.com/regl-project/regl): functional webgl library
- [ogl](https://github.com/oframe/ogl): minimal webgl library
- [twgl](https://github.com/greggman/twgl.js): tiny webgl library
- [four](https://github.com/CodyJasonBennett/four): minimal webgl/webgpu alternative to three.js
- [useGPU](https://gitlab.com/unconed/use.gpu): declarative, reactive webgpu library
- [lume](https://github.com/lume/lume): signal-driven custom html-elements for webgl/webgpu
