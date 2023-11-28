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
  - [`attribute`](#attribute-utility-function)
  - [`uniform`](#uniform-utility-function)
  - [`<GL/>`](#gl-component)
  - [`<Program/>`](#program-component)
- [Tip](#user-content--tip) 

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

### Scope and Modules [[playground]](https://playground.solidjs.com/anonymous/5c0165fe-7df2-4035-8f56-b0f98454ac9a)

<video alt="screen-recording 'Scope and Modules'-example" src="https://github.com/bigmistqke/signal.gl/assets/10504064/bad12fc1-45bf-4b8d-82a0-7cdb3e438a73">
  <img src="https://github.com/bigmistqke/signal.gl/assets/10504064/80b5b147-9a18-4352-a243-1778d91715e4"/>
</video>

```tsx
const [cursor, setCursor] = createSignal<[number, number]>([1, 1]);
const [colors, setColors] = createSignal(
  new Float32Array(new Array(6 * 3).fill("").map((v) => Math.random())),
  { equals: false },
);
const vertices = new Float32Array([
  -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
]);

setInterval(() => {
  setColors((colors) => {
    colors[0] += 0.001;
    colors[0] = colors[0] % 1;
    colors[10] += 0.002;
    colors[10] = colors[0] % 1;
    return colors;
  });
});

const module = glsl`

// variable names can be scoped by interpolating strings: ${"string"}
// useful in glsl-module to prevent name collisions
float ${"getLength"}(float x, float y){ return length(x - y); }

vec4 getColor(vec3 color, vec2 coord){
  vec2 cursor = ${uniform.vec2(cursor)};
  if(
    ${"getLength"}(cursor.x, coord.x) < 0.25 && 
    ${"getLength"}(cursor.y, coord.y) < 0.25
  ){
    return vec4(1. - color, 1.0);
  }
  return vec4(color, 1.0);
}`;

const fragment = glsl`#version 300 es
precision mediump float;

// compose shaders with interpolation
// the interpolated shader-snippet is inlined completely
// so be aware for name-collisions!
${module}

in vec2 v_coord; 
in vec3 v_color;
out vec4 outColor;

void main() {
  // getColor is imported from module
  outColor = getColor(v_color, v_coord);
}`;

const vertex = glsl`#version 300 es

out vec2 v_coord;  
out vec3 v_color;

void main() {
  vec2 a_coord = ${attribute.vec2(vertices)};
  v_color = ${attribute.vec3(colors)};
  v_coord = a_coord - ${uniform.vec2(cursor)};
  gl_Position = vec4(a_coord, 0, 1) ;
}`;

const onMouseMove = (e) => {
  const x = e.clientX / e.currentTarget.clientWidth - 0.5;
  const y =
    (e.currentTarget.clientHeight - e.clientY) /
      e.currentTarget.clientHeight -
    0.5;
  setCursor([x, y]);
};

return (
  <GL style={{ width: "100vw", height: "100vh" }} onMouseMove={onMouseMove}>
    <Program fragment={fragment} vertex={vertex} mode="TRIANGLES" />
  </GL>
);```

## API

### `glsl` _tag template literal_

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

#### interpolation/hole-types:
```ts
type Hole =
  | ReturnType<ValueOf<typeof attribute>> // glsl`${attribute.float(...)}` auto-binds a signal to an attribute
  | ReturnType<ValueOf<typeof uniform>>   // glsl`${uniform.float(...)}`   auto-bind a signal to a uniform
  | Accessor<ShaderToken>                 // glsl`${glsl`...`}`            compose shaders
  | string                                // glsl`{'scoped-var}`           scope variable name to prevent name-collisions
```

### `attribute` _utility-function_

- create `AttributeToken` to be consumed by `glsl`

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

### `uniform` _utility-function_

- create `UniformToken` to be consumed by `glsl`

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

#### options-type

```ts
type UniformOptions = {
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

### `<GL/>` _component_

- root `JSXElement`
- contains `canvas` and `context-provider`
- only valid children is `<Program/>`

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

### `<Program/>`  _component_

- sibling of `<GL/>`
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

## `💡` Tip

> <img width="417" alt="signal-gl code with syntax highlighting" src="https://github.com/bigmistqke/signal.gl/assets/10504064/d2027993-31ac-4c88-8f7f-c0b6f51d992c">
>
> use in combination with tag template literal syntax highlighting.<br/>
> [glsl-literal syntax higlighting](https://marketplace.visualstudio.com/items?itemName=boyswan.glsl-literal) for `vs-code` 
