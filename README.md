# 🚦 signal.gl

[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg?style=for-the-badge&logo=pnpm)](https://pnpm.io/)

`minimal` `inline` `reactive` `glsl` `auto-binding` `signals` `no boilerplate` `tag template literals`

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

### Hello World [[playground]](https://playground.solidjs.com/anonymous/666af229-e0bc-42a8-8f7f-bd1cca6903d0)

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
      <Program fragment={fragment} vertex={vertex} mode="TRIANGLES"/>
    </GL>
  )
}

render(() => <App />, document.getElementById('app')!)
```

<video alt="screenrecording first example" src="https://github.com/bigmistqke/signal.gl/assets/10504064/e306b06e-1b74-4f83-870c-f371c054b6f2">
  <img src="https://github.com/bigmistqke/signal.gl/assets/10504064/30b0c5ad-fd5d-4a58-812e-24734a43c52d"/>
</video>

### Scope and Modules [[playground]](https://playground.solidjs.com/anonymous/d4004847-49fa-4eec-82e3-33ca08d5e0a5)

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
    // variable names can be scoped by interpolating strings
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
      <Program fragment={fragment} vertex={vertex} mode="TRIANGLES"/>
    </GL>
  )
}

render(() => <App />, document.getElementById('app')!)
```


<video alt="screenrecording second example" src="https://github.com/bigmistqke/signal.gl/assets/10504064/bad12fc1-45bf-4b8d-82a0-7cdb3e438a73">
  <img src="https://github.com/bigmistqke/signal.gl/assets/10504064/80b5b147-9a18-4352-a243-1778d91715e4"/>
</video>

## `💡` Tip

<img width="417" alt="signal-gl code with syntax highlighting" src="https://github.com/bigmistqke/signal.gl/assets/10504064/d2027993-31ac-4c88-8f7f-c0b6f51d992c">

> vs-code: [glsl-literal syntax higlighting](https://marketplace.visualstudio.com/items?itemName=boyswan.glsl-literal)
