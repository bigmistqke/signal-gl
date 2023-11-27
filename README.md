# 🚦 signal-gl 

> 🏗️ work in progress / unpublished / build in the open 🏗️

`inline`, `reactive`, `glsl`, `auto-binding`, `signals`, `tag template literals`

## hello world

```tsx
import { createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import { GL, attribute, glsl, uniform } from '@bigmistqke/signal-gl/solid'

function App() {
  const [vertices] = createSignal(
    new Float32Array([ -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0 ]),
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
      vec2 a_coord = ${attribute.vec2(vertices, {
        mode: 'TRIANGLES',
      })};
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
      fragment={fragment}
      vertex={vertex}
    />
  )
}

render(() => <App />, document.getElementById('app')!)
```

https://github.com/bigmistqke/signal.gl/assets/10504064/d0b05162-ee8c-4767-b0cc-5ae703b67d89

## scope and modules

```tsx
import { createSignal } from 'solid-js'
import { render } from 'solid-js/web'

import { GL, attribute, glsl, uniform } from './signal-gl'

function App() {
  const [cursor, setCursor] = createSignal<[number, number]>([1, 1])
  const [vertices] = createSignal(new Float32Array([ -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0]))

  const getColor = glsl`
    // variable names can be scoped by interpolating strings
    // useful in glsl-module to prevent name collisions
    float ${'getLength'}(float x, float y){
      return length(x - y);
    }

    // public functions can be left unscoped
    vec4 getColor(vec3 color, vec2 coord){
      vec2 cursor = ${uniform.vec2(cursor)};

      float lengthX = ${'getLength'}(cursor.x, coord.x);
      float lengthY = ${'getLength'}(cursor.y, coord.y);

      if(lengthX < 0.25 && lengthY < 0.25){
        return vec4(1. - color, 1.0);
      }else{
        return vec4(color, 1.0);
      }
    }
    `

  const fragment = glsl`#version 300 es
    precision mediump float;
    // compose shaders with interpolation
    ${getColor}

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
      vec2 a_coord = ${attribute.vec2(vertices, {
        mode: 'TRIANGLES',
      })};
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
        const x = e.clientX / e.currentTarget.clientWidth - 0.5;
        const y = (e.currentTarget.clientHeight - e.clientY) /
            e.currentTarget.clientHeight - 0.5;
        setCursor([ x, y ])
      }}
      fragment={fragment}
      vertex={vertex}
    />
  )
}

render(() => <App />, document.getElementById('app')!)
```

https://github.com/bigmistqke/signal.gl/assets/10504064/28e4a945-d792-48df-bae4-349aefc7c723

> `💡` handy in combination with [glsl-literal syntax higlighting](https://marketplace.visualstudio.com/items?itemName=boyswan.glsl-literal)
