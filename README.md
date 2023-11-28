# 🚦 signal-gl

[![GitHub package.json version (subfolder of monorepo)](https://img.shields.io/github/package-json/v/bigmistqke/signal-gl)](https://www.npmjs.com/package/@bigmistqke/signal-gl)
[![Maintained with pnpm](https://img.shields.io/badge/maintained_with-pnpm-%23cc01ff)](https://github.com/pnpm/pnpm)

`minimal` `inline` `reactive` `glsl` `auto-binding` `signals` `no boilerplate` `tag template literals`

## Overview

- [Premise](#premise)  
- [Bindings](#bindings)
- [Install](#install)
- [Use it](#use-it)
- [API](#api)
  - [`glsl`](#glsl-tag-template-literal)
  - [`attribute`](#attribute-utility)
  - [`uniform`](#uniform-utility)
  - [`<GL/>`](#gl-component)
  - [`<Program/>`](#program-component) 

## Premise

- `Minimal` abstraction
- Co-locating `js` and `glsl`
- Composition of `glsl` snippets
- Lessen boilerplate with `auto-binding` uniforms and attributes
- `Purely runtime`: no additional build tools
- Small footprint: `2.5kb minified + gzip`

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

<video alt="screenrecording first example" src="https://github.com/bigmistqke/signal.gl/assets/10504064/e306b06e-1b74-4f83-870c-f371c054b6f2">
  <img src="https://github.com/bigmistqke/signal.gl/assets/10504064/30b0c5ad-fd5d-4a58-812e-24734a43c52d"/>
</video>

```tsx
import { createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import { GL, attribute, glsl, uniform } from '@bigmistqke/signal-gl'

function App() {
  const [vertices] = createSignal(
    new Float32Array([
      -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
    ]),
    { equals: false }
  )
  const [opacity, setOpacity] = createSignal(0.5)

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
    <GL
      style={{
        width: '100vw',
        height: '100vh',
      }}
      onMouseMove={(e) => setOpacity(e.clientY / e.currentTarget.offsetHeight)}
    >
      <Program fragment={fragment} vertex={vertex} mode="TRIANGLES" />
    </GL>
  )
}

render(() => <App />, document.getElementById('app')!)
```

### Scope and Modules [[playground]](https://playground.solidjs.com/anonymous/d0770ee9-2045-464f-8b71-33493bba53d8)

<video alt="screenrecording second example" src="https://github.com/bigmistqke/signal.gl/assets/10504064/bad12fc1-45bf-4b8d-82a0-7cdb3e438a73">
  <img src="https://github.com/bigmistqke/signal.gl/assets/10504064/80b5b147-9a18-4352-a243-1778d91715e4"/>
</video>

```tsx
import { createSignal } from 'solid-js'
import { render } from 'solid-js/web'

import { GL, attribute, glsl, uniform } from '@bigmistqke/signal-gl'

function App() {
  const [cursor, setCursor] = createSignal<[number, number]>([1, 1])
  const [vertices] = createSignal(
    new Float32Array([
      -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
    ])
  )

  const [colors, setColors] = createSignal(
    new Float32Array(new Array(6 * 3).fill('').map((v) => Math.random())),
    { equals: false }
  )

  setInterval(() => {
    setColors((colors) => {
      colors[0] += 0.001
      colors[10] += 0.002

      if (colors[0] > 1) colors[0] = 0
      if (colors[10] > 1) colors[10] = 0

      return colors
    })
  })

  const module = glsl`

    // variable names can be scoped by interpolating strings: ${'string'}
    // useful in glsl-module to prevent name collisions
    float ${'getLength'}(float x, float y){
      return length(x - y);
    }

    vec4 getColor(vec3 color, vec2 coord){
      vec2 cursor = ${uniform.vec2(cursor)};

      float lengthX = ${'getLength'}(cursor.x, coord.x);
      float lengthY = ${'getLength'}(cursor.y, coord.y);

      if(lengthX < 0.25 && lengthY < 0.25){
        return vec4(1. - color, 1.0);
      }else{
        return vec4(color, 1.0);
      }
    }`

  const fragment = glsl`#version 300 es
    precision mediump float;

    // compose shaders with interpolation
    ${module}

    in vec2 v_coord; 
    in vec3 v_color;
    out vec4 outColor;

    void main() {
      outColor = getColor(v_color, v_coord);
    }`

  const vertex = glsl`#version 300 es

    out vec2 v_coord;  
    out vec3 v_color;

    void main() {
      vec2 a_coord = ${attribute.vec2(vertices)};
      v_color = ${attribute.vec3(colors)};
      v_coord = a_coord - ${uniform.vec2(cursor)};
      gl_Position = vec4(a_coord, 0, 1) ;
    }`

  return (
    <GL
      style={{
        width: '100vw',
        height: '100vh',
      }}
      onMouseMove={(e) => {
        const x = e.clientX / e.currentTarget.clientWidth - 0.5
        const y =
          (e.currentTarget.clientHeight - e.clientY) /
            e.currentTarget.clientHeight -
          0.5
        setCursor([x, y])
      }}
    >
      <Program fragment={fragment} vertex={vertex} mode="TRIANGLES" />
    </GL>
  )
}

render(() => <App />, document.getElementById('app')!)
```

## API

### `glsl`: tag template literal

- write and compose `glsl`
- interpolate and auto-bind `attributes` / `uniforms` / `glsl-snippets`

#### usage

```ts
glsl`#version 300 es
${module}
out vec2 v_coord;  
out vec3 v_color;
float ${'scoped-var'} = 0.5;
void main() {
  vec2 a_coord = ${attribute.vec2(vertices)};
  vec2 cursor = ${uniform.vec2(cursor)};
  v_coord = a_coord * ${'scoped-var'} + cursor;
  gl_Position = vec4(a_coord, 0, 1) ;
}`
```

#### return-type
```ts
type ShaderToken = {
  tokenType: 'shader'
  source: string
  bind: (
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    render: () => void,
    onRender: OnRenderFunction
  ) => void
}
```

#### allowed interpolation-types:
```ts
type Hole =
  | ReturnType<ValueOf<typeof attribute>> // glsl`${attribute.float(...)}` auto-binds a signal to an attribute
  | ReturnType<ValueOf<typeof uniform>>   // glsl`${uniform.float(...)}`   auto-bind a signal to a uniform
  | Accessor<ShaderToken>                 // glsl`${glsl`...`}`            compose shaders
  | string                                // glsl`{'scoped-var}`           scope variable name to prevent name-collisions
```

### `attribute`: utility

- create `AttributeToken` to be consumed by `glsl`

#### usage

```ts
attribute.float(Accessor<ArrayBufferView>, AttributeOptions)
attribute.int  (Accessor<ArrayBufferView>, AttributeOptions)
attribute.bool (Accessor<ArrayBufferView>, AttributeOptions)
attribute.vec2 (Accessor<ArrayBufferView>, AttributeOptions)
attribute.ivec2(Accessor<ArrayBufferView>, AttributeOptions)
attribute.bvec2(Accessor<ArrayBufferView>, AttributeOptions)
attribute.vec3 (Accessor<ArrayBufferView>, AttributeOptions)
attribute.ivec3(Accessor<ArrayBufferView>, AttributeOptions)
attribute.bvec3(Accessor<ArrayBufferView>, AttributeOptions)
attribute.vec4 (Accessor<ArrayBufferView>, AttributeOptions)
attribute.ivec4(Accessor<ArrayBufferView>, AttributeOptions)
attribute.bvec4(Accessor<ArrayBufferView>, AttributeOptions)
```

#### options-type

```ts
export type AttributeOptions = {
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

#### return-type

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

### `uniform`: utility

- create `UniformToken` to be consumed by `glsl`

#### usage

```ts
uniform.float(Accessor<number>, UniformOptions)
uniform.int  (Accessor<number>, UniformOptions)
uniform.bool (Accessor<boolean>, UniformOptions)
uniform.vec2 (Accessor<[number, number]>, UniformOptions)
uniform.ivec2(Accessor<[number, number]>, UniformOptions)
uniform.bvec2(Accessor<[boolean, boolean]>, UniformOptions)
uniform.vec3 (Accessor<[number, number, number]>, UniformOptions)
uniform.ivec3(Accessor<[number, number, number]>, UniformOptions)
uniform.bvec3(Accessor<[boolean, boolean, boolean]>, UniformOptions)
uniform.vec4 (Accessor<[number, number, number, number]>, UniformOptions)
uniform.ivec4(Accessor<[number, number, number, number]>, UniformOptions)
uniform.bvec4(Accessor<[boolean, boolean, boolean, boolean]>, UniformOptions)
```

#### options-type

```ts
export type UniformOptions = {
  name?: string
}
```

#### return-type

```ts
type UniformToken = {
  dataType: keyof Uniform
  functionName: UniformSetter
  name: string
  options: PrimitiveOptions
  tokenType: 'uniform'
  value: any
} | {
  dataType: keyof Uniform | keyof Attribute
  name: string
  options: Sampler2DOptions
  textureIndex: number
  tokenType: 'sampler2D'
  value: any
}
```

### `<GL/>`: component

- root `JSXElement`
- contains `canvas` and context-provider
- only valid children is `<Program/>`

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

### `<Program/>`: component

- sibling of `<GL/>`
- represents a `WebGLProgram`

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

## `💡` Tip

<img width="417" alt="signal-gl code with syntax highlighting" src="https://github.com/bigmistqke/signal.gl/assets/10504064/d2027993-31ac-4c88-8f7f-c0b6f51d992c">

> use in combination with tag template literal syntax highlighting.<br/>
> `vs-code` [glsl-literal syntax higlighting](https://marketplace.visualstudio.com/items?itemName=boyswan.glsl-literal)
