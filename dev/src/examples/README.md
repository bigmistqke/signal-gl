# 🚦 signal-gl examples

## Overview

- [Hello World](#hello-world-playground)  
- [Scoped Variable Names and Modules](#scoped-variable-names-and-modules-playground)
- [Multiple Shaders](#scope-and-modules-playground)
- [Caching Shaders](#caching-shaders-playground)


### Hello World [[playground]](https://playground.solidjs.com/anonymous/72a268af-262d-4d9a-84e4-4d60c94157b3)

_How to import uniforms and attributes into a glsl-shader._

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

### Scoped Variable Names and Modules [[playground]](https://playground.solidjs.com/anonymous/5c0165fe-7df2-4035-8f56-b0f98454ac9a) 

_How to compose shader snippets into a single shader._

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
);
```

### Multiple shaders [[playground]](https://playground.solidjs.com/anonymous/727bdc74-cb9f-412b-a8c7-a1e7c870c789)

_How to render multiple shaders into a single image._

```tsx
const [opacity, setOpacity] = createSignal(0.5)
const [cursor, setCursor] = createSignal<[number, number]>([1, 1])

const Plane = (props: {
  vertices: Buffer | Accessor<Buffer>
  fragment: Accessor<ShaderToken>
}) => {
  const vertex = glsl`#version 300 es
    out vec2 v_coord;  
    out vec3 v_color;
    void main() {
      vec2 a_coord = ${attribute.vec2(props.vertices)};
      v_coord = a_coord;
      gl_Position = vec4(a_coord, 0, 1.0);
    }`

  return <Program vertex={vertex} fragment={props.fragment} mode="TRIANGLES" />
}

const getColor = glsl`
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
      discard;
    }
  }`

return (
  <GL
    onMouseMove={(e) => {
      setOpacity(1 - e.clientY / e.currentTarget.offsetHeight)
      setCursor([
        2 * (e.clientX / e.currentTarget.clientWidth) - 1,
        2 *
          ((e.currentTarget.clientHeight - e.clientY) /
            e.currentTarget.clientHeight) -
          1,
      ])
    }}
  >
    <Plane
      fragment={glsl`#version 300 es
        precision mediump float;
        in vec2 v_coord; 
        out vec4 outColor;
        void main() {
          float opacity = ${uniform.float(opacity)};
          outColor = vec4(v_coord[0], v_coord[1], v_coord[0], opacity);
        }`}
      vertices={
        new Float32Array([
          -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
        ])
      }
    />
    <Plane
      fragment={glsl`#version 300 es
        precision mediump float;
        ${getColor}

        in vec2 v_coord; 
        out vec4 outColor;

        void main() {
          outColor = getColor(vec3(1.0, 0.0, 0.0), v_coord);
        }`}
      vertices={
        new Float32Array([
          -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5,
        ])
      }z
    />
  </GL>
)
```

### Caching Shaders [[playground]](https://playground.solidjs.com/anonymous/6c2aa463-f3c8-4067-b050-584563be0138)

_When cacheEnabled is set to true, `<Program/>` will check if the given fragment/vertex `glsl` tag template literal has already been used to produce a webgl-program and, if it exists, will use this program instead of compiling a new one. Currently this functionality is marked as `unstable` since it does not yet work nicely with [composing shaders from snippets](#multiple-shaders-playground)_

```tsx
const Plane = (props: {d
  fragment: Accessor<ShaderToken>
  rotation?: number
  scale?: [number, number]
  position?: [number, number]
}) => {
  const vertex = glsl`#version 300 es
    out vec2 v_coord;  
    out vec3 v_color;
    void main() {
      vec2 a_coord = ${attribute.vec2(planeVertices)};
      float rotation =  ${uniform.float(() => props.rotation || 0)};
      vec2 scale =  ${uniform.vec2(() => props.scale || [1, 1])};
      vec2 translation = ${uniform.vec2(() => props.position || [0, 0])};

      // Scaling
      mat3 scaleMatrix = mat3(
          scale.x, 0, 0,
          0, scale.y, 0,
          0, 0, 1
      );

      // Convert angle to radians
      float angle = radians(rotation);
      float c = cos(angle);
      float s = sin(angle);

      // Rotation
      mat3 rotateMatrix = mat3(
          c, -s, 0,
          s, c, 0,
          0, 0, 1
      );

      // Combine transformations
      mat3 transformMatrix = rotateMatrix * scaleMatrix;

      // Apply the transformation
      a_coord = (transformMatrix * vec3(a_coord, 1.0)).xy;
      v_coord = a_coord;
      gl_Position = vec4(a_coord + translation, 1.0, 1.0);
    }`

  return (
    <Program
      cacheEnabled
      fragment={props.fragment}
      vertex={vertex}
      mode="TRIANGLES"
    />
  )
}

type Boid = {
  x: number,   y: number,  z: number
  vx: number, vy: number, vz: number
}

function updateBoids(boids: Boid[], width = 200, height = 200, deltaTime = 1) {
  for (let i = 0; i < boids.length; i++) {
    let { x, y, z, vx, vy, vz } = boids[i]!
    x += vx * deltaTime
    y += vy * deltaTime
    z += vz * deltaTime
    // Wrap around edges
    x = (x + width) % width
    y = (y + height) % height
    boids[i] = { x, y, z, vx, vy, vz }
  }
}

const AMOUNT = 20000

const [boids, setBoids] = createSignal<
  {
    x: number
    y: number
    z: number
    vx: number
    vy: number
    vz: number
  }[]
>(
  new Array(AMOUNT).fill('').map(() => ({
    x: Math.random() * 200 - 50,
    y: Math.random() * 200 - 50,
    z: Math.random() * 200 - 50,
    vx: Math.random() - 0.5,
    vy: Math.random() - 0.5,
    vz: Math.random() - 0.5,
  })),
  { equals: false }
)

const loop = () => {
  requestAnimationFrame(loop)
  updateBoids(boids())
  batch(() => setBoids((boids) => boids))
}
loop()

const fragment = (blue: number) => glsl`#version 300 es
  precision mediump float;
  in vec2 v_coord; 
  out vec4 outColor;
  void main() {
    float blue = ${uniform.float(blue)};
    outColor = vec4(v_coord[0], 0.0, blue, 0.25);
  }`

return (
  <GL onProgramCreate={() => console.log('created a program')}>
    <Index each={boids()}>
      {(boid, index) => {
        return (
          <Plane
            fragment={fragment(0.5 - index / untrack(() => boids().length))}
            scale={[0.0125, 0.0125]}
            position={[boid().x / 100 - 1, boid().y / 100 - 1]}
          />
        )
      }}
    </Index>
  </GL>
)
```