# `signal-gl/world`

Game engine built on top of [`signal-gl`](../core/CORE.md)

## Overview

- Components
  - [`<Scene/>`](#scene-component) _root-component of `signal-gl/world`-tree_
  - [`<Group/>`](#group-component) _JSX to group and transform simultaneously its `signal-gl/world`-children_
  - [`<Camera/>`](#camera-component) _JSX representing the scene's clip view_
  - [`<Shape/>`](#shape-component) _`<Program/>` with default shaders_
  - [`<Cube/>`](#cube-component) _`<Shape/>` with hard-coded cube vertices_
  - [`<ColliderProvider/>`](#colliderprovider-component) _dependency injection of collider-management_
  - [`<AxisAlignedBoxCollider/>`](#axisalignedboxcollider-component) _[AABB colider](https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection)_
- Hooks
  - [`useScene`](#usescene-hook) _context-hook, only available inside `<Scene/>`_

## Components

### Scene _component_

> root-component of `signal-gl/world`

#### Usage

```tsx
import { Scene } from '@bigmistqke/signal-gl/world'
return (
  <Scene>
    ...
  </Scene>
)
```

#### type `CanvasProps` [see](../core/CORE.md/#type-canvasprops)

### Group _component_

> create a parent-child relationship by cascading model-view's matrix transformations
> aka _grouping `signal-gl/world`-objects in cyberspace_

#### Usage

```tsx
import { Scene, Group } from '@bigmistqke/signal-gl/world'
return (
  <Scene>
    <Group position={[0, 0, 5]}>
      ...
    </Group>
  </Scene>
)
```

#### type `Pose`

```ts
type Pose = {
  position: Vector3 | vec3
  rotation: Vector3 | vec3
  scale: Vector3 | vec3
  matrix: mat4
}
```

#### type `GroupProps`

```ts
type GroupProps = ParentProps<Pose>
```

### Camera _component_

> control the scene's model- and projection-view
> aka _a camera in cyberspace_

#### Usage

```tsx
import { Scene, Group } from '@bigmistqke/signal-gl/world'
return (
  <Scene>
    <Camera position={[0, 0, 5]} fov={90}/>
    ...
  </Scene>
)
```

#### Signature

```ts
(props: CameraProps) => JSXElement
```

#### type `CameraProps`

```ts
type CameraProps = ParentProps<Pose & {
  active: boolean
  fov: number
  near: number
  far: number
  realMatrix: mat4
}>
```

### Shape _component_

> a [`<Program/>`](../core/CORE.md/#program-component) 
> with a default vertex- and fragment-shader
> wrapped with a [`<Group/>`](#group-component)
> aka _a shape in cyberspace_

#### Usage

```tsx
import { Shape } from '@bigmistqke/signal-gl/world'
return (
  <Scene>
    <Shape vertices={new UInt16Array(...)} position={[0, 20, 0]}/>
    ...
  </Scene>
)
```

#### type `ShapeProps`

```ts
type ShapeProps = ParentProps<Pose & {
  fragment?: ShaderToken
  vertex?: ShaderToken
  indices: number[]
  color?: Vector3 | vec3 // [1, 1, 1]
  opacity?: number // 1
  vertices: Float32Array
  mode?: RenderMode // 'TRIANGLES'
}>
```

#### default shaders

##### vertex 

```ts
glsl`#version 300 es
  precision mediump float;
  out vec4 model;
  out vec4 view;
  out vec4 clip;
  void main(void) {
    model = ${scene.model.uniform} * vec4(${attribute.vec3(() => props.vertices)}, 1.);
    view = ${scene.view.uniform} * model;
    clip = ${scene.projection.uniform} * view;
    gl_Position = clip;
  }`
```

in the fragment-shader you have access to the following varying
- `model` _model-space_
- `view` _view-space_
- `clip` _clip-space_

##### fragment 

```ts
glsl`#version 300 es
  precision mediump float;
  out vec4 color_out;
  void main(void) {
    color_out = vec4(${uniform.vec3(() => props.color)}, ${uniform.float(() => props.opacity)});
  }`
```

### Cube _component_

> a [`<Shape/>`](#shape-component) with vertices and indices describing a cube
> aka _a cube in cyberspace_

#### Usage

```tsx
import { Shape } from '@bigmistqke/signal-gl/world'
return (
  <Scene>
    <Shape vertices={new UInt16Array(...)} position={[0, 20, 0]}/>
    ...
  </Scene>
)
```

#### type `ShapeProps`

```ts
type ShapeProps = ParentProps<Pose & {
  fragment?: ShaderToken
  vertex?: ShaderToken
  indices: number[]
  color?: Vector3 | vec3 // [1, 1, 1]
  opacity?: number // 1
  vertices: Float32Array
  mode?: RenderMode // 'TRIANGLES'
}>
```

### ColliderProvider _component_

> dependency inject collider-functionality into your `signal-gl/world`-scene

#### Usage

```tsx
import { ColliderProvider, createRaycaster, Shape } from '@bigmistqke/signal-gl/world'
const raycaster = createRaycaster()
return (
  <Scene>
    <ColliderProvider plugins={[raycaster]}>
    ...
    </ColliderProvider>
  </Scene>
)
```

#### type `ColliderProviderProps`

```ts
type ColliderPlugin = Raycaster

type ColliderProviderProps = ParentProps<{
  plugins: ColliderPlugin[]
}>
```

#### ColliderPlugins

- [createRaycaster](#createraycaster-hook)

### AxisAlignedBoxCollider _component_

> an `AABB`-collider [see](https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection#axis-aligned_bounding_boxes)

#### Usage

```tsx
import { Shape, AxisAlignedBoxCollider } from '@bigmistqke/signal-gl/world'
return (
  <Scene>
    <ColliderProvider>
      <AxisAlignedBoxCollider onEvent={({hit}) => console.log('hit?', hit)}>
        <Cube>
      </AxisAlignedBoxCollider>
    </ColliderProvider>
  </Scene>
)
```

you can also visualise `AxisAlignedBoxCollider` by assigning it a color

```tsx
import { Shape, AxisAlignedBoxCollider } from '@bigmistqke/signal-gl/world'
return (
  <Scene>
    <ColliderProvider>
      <AxisAlignedBoxCollider color={[0, 2, 0]} />
    </ColliderProvider>
  </Scene>
)
```

#### type `AxisAlignedBoxColliderProps`

```ts
type AxisAlignedBoxColliderProps = ParentProps<{
  scale?: Vector3 | vec3
  position?: Vector3 | vec3
  color?: Vector3 | vec3
  onEvent?: (event: { type: string; hit: boolean }) => void
  mode?: RenderMode
}>
```

## Hooks

### useScene _hook_

- access `signal-gl/world` state through context
- only available inside scope of a `<Scene/>`

#### Usage

```tsx
import { useScene } from "@bigmistqke/signal-gl/world"

const Object = () => {
  const scene = useScene()
  if(!scene) throw 'scene is not defined'
  console.log(scene.model.matrix)
  ...
}
```

#### SceneContext

```ts
type SceneContext = SignalGLContext & {
  projection: {
    uniform: ReturnType<typeof uniform.mat4>
    matrix: mat4
    invertedMatrix: mat4
  },
  view: {
    uniform: ReturnType<typeof uniform.mat4>
    matrix: mat4
    invertedMatrix: mat4
  },
  model: {
    uniform: ReturnType<typeof uniform.mat4>
    matrix: mat4
  },
  setView(view: mat4) : void
  setProjection(view: mat4) : void
}
```

### createRaycaster _hook_

- factory-function for a [`ColliderPlugin`](#colliderplugins)

#### Usage

```tsx
import { createRaycaster } from "@bigmistqke/signal-gl/world"

const raycaster = createRaycaster()
if(!scene) throw 'scene is not defined'
const raycaster = createRaycaster()
// raycast direction of the cursor 
// whenever the camera or any of the collider's update
createEffect(raycaster.castCursor)
return (
  // raycast from the center of the camera
  <Scene onMouseDown={raycaster.castCenter}>
    <ColliderProvider plugins={[raycaster]}>
      <AxisAlignedBoxCollider onEvent={({type, hit}) => console.log(type, hit)}/>
    </ColliderProvider>
  </Scene>
)
```


