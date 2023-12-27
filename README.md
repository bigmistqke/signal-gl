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
  - [`signal-gl`](/src/core/CORE.md) _low level abstraction around webgl_
  - [`signal-gl/world`](/src/world/WORLD.md)  _game engine built on top of `signal-gl`_
- [Syntax Highlighting](#syntax-highlighting) 
- [Prior Art](#prior-art) 

## Premise

- `Minimal` abstraction
- Minimizing gap between `js` and `glsl`
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
  <Stack onMouseMove={(e) => setOpacity(e.clientY / e.currentTarget.offsetHeight)}>
    <Program fragment={fragment} vertex={vertex} mode="TRIANGLES" />
  </Stack>
)
```

### [more examples](./dev/src/examples/README.md)

## API

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
