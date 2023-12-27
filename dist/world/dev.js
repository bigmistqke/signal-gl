import { Canvas, useSignalGL, uniform, Program, glsl, attribute } from '../chunk/XZHIF4PQ.js';
import { createComponent, memo, mergeProps as mergeProps$1 } from 'solid-js/web';
import { vec3, mat4, quat } from 'gl-matrix';
import { createContext, createSignal, untrack, createEffect, mapArray, mergeProps, onCleanup, Show, useContext, createMemo, createResource, batch } from 'solid-js';
import { createStore } from 'solid-js/store';

var directionFromCursor = ({
  cursor,
  projection,
  view
}) => {
  const direction = vec3.create();
  const viewProjection = mat4.create();
  mat4.multiply(viewProjection, projection, view);
  mat4.invert(viewProjection, viewProjection);
  vec3.transformMat4(direction, [...cursor, 1], viewProjection);
  return vec3.normalize(direction, direction);
};

// src/world/colliders.tsx
var collidersContext = createContext();
var useColliders = () => useContext(collidersContext);
var ColliderProvider = (props) => {
  const [colliders, setColliders] = createSignal(/* @__PURE__ */ new Set());
  return createComponent(collidersContext.Provider, {
    value: {
      get colliders() {
        return colliders();
      },
      addCollider: (collider) => {
        setColliders((c) => c.add(collider));
        return () => untrack(() => colliders().delete(collider));
      }
    },
    get children() {
      return [memo(() => (() => {
        createEffect(mapArray(() => props.plugins || [], (plugin) => plugin.initialize()));
        return null;
      })()), memo(() => props.children)];
    }
  });
};
var createRaycaster = () => {
  const [_colliders, setColliders] = createSignal(/* @__PURE__ */ new Set());
  const [_spaces, setSpaces] = createSignal();
  const cursor = [0, 0];
  const cast = (origin, direction) => {
    const colliders = _colliders();
    if (!colliders)
      return;
    for (const collider of colliders) {
      if (collider.intersects(origin, direction)) {
        collider.onEvent?.({
          type: "raycast",
          hit: true
        });
      } else {
        collider.onEvent?.({
          type: "raycast",
          hit: false
        });
      }
    }
  };
  return {
    initialize() {
      const scene2 = useScene();
      const colliders = useColliders();
      if (!scene2)
        throw "scene is undefined";
      if (!colliders)
        throw "colliders is undefined";
      setSpaces(scene2);
      setColliders(colliders.colliders);
      scene2.canvas.addEventListener("mousemove", (e) => {
        cursor[0] = 2 * e.clientX / scene2.canvas.width - 1;
        cursor[1] = 1 - 2 * e.clientY / scene2.canvas.height;
      });
    },
    cast,
    castCenter() {
      const colliders = _colliders();
      const spaces = _spaces();
      if (!colliders || !spaces)
        return;
      const view = spaces.view.matrix;
      const direction = vec3.fromValues(-view[2], -view[6], -view[10]);
      vec3.normalize(direction, direction);
      const origin = vec3.transformMat4(vec3.create(), [0, 0, 0], spaces.view.invertedMatrix);
      cast(origin, direction);
    },
    castCursor() {
      const spaces = _spaces();
      if (!spaces)
        return void 0;
      const direction = directionFromCursor({
        cursor,
        projection: spaces.projection.matrix,
        view: spaces.view.matrix
      });
      const origin = vec3.transformMat4(vec3.create(), [0, 0, 0], spaces.view.invertedMatrix);
      cast(origin, direction);
    }
  };
};
var AxisAlignedBoxCollider = (props) => {
  const scene = useScene();
  if (!scene)
    throw "scene undefined";
  const colliders = useColliders();
  if (!colliders)
    throw "collidersContext undefined";
  const merged = mergeProps({
    scale: [1, 1, 1],
    position: [0, 0, 0]
  }, props);
  const tMin = [0, 0, 0];
  const tMax = [0, 0, 0];
  let boxMin = [0, 0, 0];
  let boxMax = [0, 0, 0];
  const unsubscribe = colliders.addCollider({
    intersects: (position, direction) => {
      for (let i = 0; i < 3; i++) {
        boxMin[i] = merged.position[i] - 0.5 * merged.scale[i];
        boxMax[i] = merged.position[i] + 0.5 * merged.scale[i];
      }
      const origin = mat4.getTranslation(vec3.create(), scene.model.matrix);
      vec3.add(boxMax, boxMax, origin);
      vec3.add(boxMin, boxMin, origin);
      for (let i = 0; i < 3; i++) {
        const invDir = 1 / direction[i];
        const t1 = (boxMin[i] - position[i]) * invDir;
        const t2 = (boxMax[i] - position[i]) * invDir;
        tMin[i] = Math.min(t1, t2);
        tMax[i] = Math.max(t1, t2);
      }
      const tNear = Math.max(tMin[0], tMin[1], tMin[2]);
      const tFar = Math.min(tMax[0], tMax[1], tMax[2]);
      if (tNear > tFar || tFar < 0) {
        return false;
      }
      return true;
    },
    get onEvent() {
      return props.onEvent;
    }
  });
  onCleanup(unsubscribe);
  return [createComponent(Show, {
    get when() {
      return props.color;
    },
    get children() {
      return createComponent(Cube, {
        get mode() {
          return props.mode || "LINES";
        },
        get color() {
          return props.color;
        }
      });
    }
  }), createComponent(Group, mergeProps$1(merged, {
    get children() {
      return props.children;
    }
  }))];
};
var matrixFromPose = (matrix, pose) => {
  if (pose.position)
    mat4.translate(matrix, matrix, pose.position);
  if (pose.rotation) {
    mat4.rotate(matrix, matrix, pose.rotation[0], [1, 0, 0]);
    mat4.rotate(matrix, matrix, pose.rotation[1], [0, 1, 0]);
    mat4.rotate(matrix, matrix, pose.rotation[2], [0, 0, 1]);
  }
  if (pose.scale)
    mat4.scale(matrix, matrix, pose.scale);
  return matrix;
};
var sceneContext = createContext();
var useScene = () => useContext(sceneContext);
var Scene = (props) => {
  const [projection, setProjection] = createSignal(mat4.create(), {
    equals: false
  });
  const [view, setView] = createSignal(mat4.create(), {
    equals: false
  });
  const model = mat4.create();
  const _invertedProjection = mat4.create();
  const _invertedView = mat4.create();
  return createComponent(Canvas, mergeProps$1(props, {
    get children() {
      return (() => {
        const signalgl = useSignalGL();
        if (!signalgl)
          throw `signalgl is undefined`;
        return createComponent(sceneContext.Provider, {
          get value() {
            return mergeProps(signalgl, {
              projection: {
                uniform: uniform.mat4(projection),
                get matrix() {
                  return projection();
                },
                get invertedMatrix() {
                  return mat4.invert(_invertedProjection, projection());
                }
              },
              view: {
                uniform: uniform.mat4(view),
                get matrix() {
                  return view();
                },
                get invertedMatrix() {
                  return mat4.invert(_invertedView, view());
                }
              },
              model: {
                uniform: uniform.mat4(model),
                matrix: model
              },
              setView,
              setProjection
            });
          },
          get children() {
            return props.children;
          }
        });
      })();
    }
  }));
};
var Group = (props) => {
  const scene = useScene();
  if (!scene)
    throw "scene was not defined";
  const matrix = createMemo(() => props.matrix ? props.matrix : matrixFromPose(mat4.clone(scene.model.matrix), props));
  return createComponent(sceneContext.Provider, {
    get value() {
      return mergeProps(scene, {
        model: {
          uniform: uniform.mat4(matrix),
          get matrix() {
            return matrix();
          }
        }
      });
    },
    get children() {
      return props.children;
    }
  });
};
var Shape = (props) => {
  return createComponent(Group, mergeProps$1(props, {
    get children() {
      return [memo(() => props.children), memo(() => (() => {
        const scene = useScene();
        if (!scene)
          throw "scene not defined";
        return createComponent(
          Program,
          {
            get vertex() {
              return props.vertex || glsl`#version 300 es
          precision mediump float;
          out vec4 model;
          out vec4 view;
          out vec4 clip;
          void main(void) {
            model = ${scene.model.uniform} * vec4(${attribute.vec3(props.vertices)}, 1.);
            view = ${scene.view.uniform} * model;
            clip = ${scene.projection.uniform} * view;
            gl_Position = clip;
          }`;
            },
            get fragment() {
              return props.fragment || glsl`#version 300 es
          precision mediump float;
          out vec4 color_out;
          void main(void) {
            color_out = vec4(${uniform.vec3(() => props.color || [0, 0, 0])}, ${uniform.float(() => props.opacity)});
          }`;
            },
            get mode() {
              return props.mode || "TRIANGLES";
            },
            get indices() {
              return props.indices;
            },
            cacheEnabled: true
          }
        );
      })())];
    }
  }));
};
var Cube = (props) => {
  const merged = mergeProps({
    vertices: new Float32Array([
      // Front face
      -0.5,
      -0.5,
      0.5,
      0.5,
      -0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      -0.5,
      0.5,
      0.5,
      // Back face
      -0.5,
      -0.5,
      -0.5,
      -0.5,
      0.5,
      -0.5,
      0.5,
      0.5,
      -0.5,
      0.5,
      -0.5,
      -0.5,
      // Top face
      -0.5,
      0.5,
      -0.5,
      -0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      -0.5,
      // Bottom face
      -0.5,
      -0.5,
      -0.5,
      0.5,
      -0.5,
      -0.5,
      0.5,
      -0.5,
      0.5,
      -0.5,
      -0.5,
      0.5,
      // Right face
      0.5,
      -0.5,
      -0.5,
      0.5,
      0.5,
      -0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      -0.5,
      0.5,
      // Left face
      -0.5,
      -0.5,
      -0.5,
      -0.5,
      -0.5,
      0.5,
      -0.5,
      0.5,
      0.5,
      -0.5,
      0.5,
      -0.5
    ]),
    indices: [
      // Front face
      0,
      1,
      2,
      0,
      2,
      3,
      // Back face
      4,
      5,
      6,
      4,
      6,
      7,
      // Top face
      8,
      9,
      10,
      8,
      10,
      11,
      // Bottom face
      12,
      13,
      14,
      12,
      14,
      15,
      // Right face
      16,
      17,
      18,
      16,
      18,
      19,
      // Left face
      20,
      21,
      22,
      20,
      22,
      23
    ],
    color: [1, 1, 1],
    opacity: 1,
    mode: "TRIANGLES"
  }, props);
  return createComponent(Shape, merged);
};
var Camera = (props) => {
  const scene = useScene();
  if (!scene)
    throw "scene is undefined";
  const projection = mat4.create();
  const view = mat4.create();
  const perspective = mergeProps({
    fov: 45,
    near: 0.1,
    far: 1e4
  }, props);
  const updatePerspective = () => {
    if (!props.active)
      return;
    scene.setProjection(mat4.perspective(projection, perspective.fov * Math.PI / 180, scene.canvas.clientWidth / scene.canvas.clientHeight, perspective.near, perspective.far));
  };
  createEffect(() => {
    if (!props.active)
      return;
    window.addEventListener("resize", updatePerspective);
    updatePerspective();
    onCleanup(() => window.removeEventListener("resize", updatePerspective));
  });
  createEffect(() => {
    if (!props.active)
      return;
    mat4.identity(view);
    mat4.multiply(view, scene.model.matrix, matrixFromPose(view, props));
    if (props.matrix)
      mat4.multiply(view, view, props.matrix);
    mat4.invert(view, view);
    if (props.realMatrix)
      mat4.multiply(view, view, props.realMatrix);
    scene.setView(view);
  });
  return createComponent(Group, props);
};
var orbit = (_config) => {
  const config = mergeProps({
    target: [0, 0, 0],
    up: [0, 1, 0],
    near: 0,
    far: 50
  }, _config);
  const [rotation, setRotation] = createSignal([0, 0], {
    equals: false
  });
  const [radius, setRadius] = createSignal(10);
  const _matrix = mat4.create();
  const matrix = () => {
    const [theta, phi] = rotation();
    const eye = [radius() * Math.sin(theta) * Math.cos(phi), radius() * Math.sin(phi), radius() * Math.cos(theta) * Math.cos(phi)];
    const target = config.target;
    const up = [0, 1, 0];
    mat4.lookAt(_matrix, eye, target, up);
    return _matrix;
  };
  let start;
  const onMouseDown = (e) => {
    start = {
      x: e.clientX,
      y: e.clientY
    };
    const onMouseUp = (e2) => window.removeEventListener("mousemove", onMouseMove);
    const onMouseMove = (e2) => {
      const now = {
        x: e2.clientX,
        y: e2.clientY
      };
      const delta = {
        x: start.x - now.x,
        y: start.y - now.y
      };
      start = now;
      setRotation((rotation2) => [rotation2[0] + delta.x / 200, rotation2[1] - delta.y / 200]);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };
  window.addEventListener("mousedown", onMouseDown);
  const onWheel = (e) => {
    setRadius((radius2) => Math.min(config.far, Math.max(config.near, radius2 + e.deltaY / 10)));
    e.preventDefault();
  };
  window.addEventListener("wheel", onWheel, {
    passive: false
  });
  onCleanup(() => {
    window.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("wheel", onWheel);
  });
  return {
    get realMatrix() {
      return matrix();
    }
  };
};
var fly = () => {
  const scene = useScene();
  if (!scene)
    throw "scene is undefined";
  const [position, setPosition] = createSignal([0, 0, 6], {
    equals: false
  });
  const [rotation, setRotation] = createSignal(quat.create(), {
    equals: false
  });
  const [keys, setKeys] = createStore({});
  let keysPressed = createMemo(() => Object.values(keys).find((v) => v));
  let last;
  {
    const speed = 0.05;
    const front = vec3.create();
    const right = vec3.create();
    const up = vec3.create();
    const moveDirection = vec3.create();
    const direction = {
      x: 0,
      y: 0
    };
    const temp = quat.create();
    const pitch = quat.create();
    const yaw = quat.create();
    const xAxis = [1, 0, 0];
    const yAxis = [0, 1, 0];
    const sensitivity = 0.0125;
    const loop = (now) => {
      batch(() => {
        if (keysPressed()) {
          if (last) {
            const delta = now - last;
            setPosition((position2) => {
              vec3.set(front, 0, 0, -1);
              vec3.transformQuat(front, front, rotation());
              vec3.set(right, 1, 0, 0);
              vec3.transformQuat(right, right, rotation());
              vec3.set(up, -1, 0, 0);
              vec3.transformQuat(up, up, rotation());
              vec3.set(moveDirection, 0, 0, 0);
              if (keys.KeyW)
                vec3.add(moveDirection, moveDirection, front);
              if (keys.KeyS)
                vec3.subtract(moveDirection, moveDirection, front);
              if (keys.KeyA)
                vec3.subtract(moveDirection, moveDirection, right);
              if (keys.KeyD)
                vec3.add(moveDirection, moveDirection, right);
              vec3.normalize(moveDirection, moveDirection);
              vec3.scale(moveDirection, moveDirection, speed * delta / 10);
              vec3.add(position2, position2, moveDirection);
              return position2;
            });
          }
          last = now;
        } else {
          last = void 0;
        }
        setRotation((rotation2) => {
          quat.identity(pitch);
          quat.setAxisAngle(pitch, xAxis, -direction.y * sensitivity);
          quat.identity(yaw);
          quat.setAxisAngle(yaw, yAxis, -direction.x * sensitivity);
          quat.identity(temp);
          quat.multiply(temp, yaw, temp);
          quat.multiply(temp, temp, pitch);
          quat.normalize(temp, temp);
          return quat.multiply(rotation2, rotation2, temp);
        });
      });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    document.addEventListener("mousemove", (event) => {
      direction.x = event.clientX / scene.canvas.width - 0.5;
      direction.y = event.clientY / scene.canvas.height - 0.5;
    });
    document.addEventListener("keydown", (event) => setKeys(event.code, true));
    document.addEventListener("keyup", (event) => setKeys(event.code, false));
  }
  const matrix = mat4.create();
  return {
    get matrix() {
      return mat4.fromRotationTranslation(matrix, rotation(), position());
    }
  };
};
var loadOBJ = (url) => {
  const [resource] = createResource(() => fetch(url).then((v) => v.text()));
  const obj = createMemo(() => {
    const data = resource();
    if (!data)
      return void 0;
    const result = {
      vertices: [],
      indices: []
    };
    data.split("\n").forEach((line) => {
      const [prefix, ..._data] = line.split(" ");
      const data2 = _data.map((v) => +v);
      switch (prefix) {
        case "v":
          return result.vertices.push(...data2);
        case "f":
          return result.indices.push(...data2.map((v) => v - 1));
      }
    });
    return {
      vertices: new Float32Array(result.vertices),
      indices: result.indices
    };
  });
  return obj;
};

export { AxisAlignedBoxCollider, Camera, ColliderProvider, Cube, Group, Scene, Shape, createRaycaster, directionFromCursor, fly, loadOBJ, orbit, useScene };
