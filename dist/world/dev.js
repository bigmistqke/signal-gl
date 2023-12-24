import { useSignalGL, uniform, Canvas, Program, glsl, attribute } from '../chunk/X5KZDYKJ.js';
import { createComponent, mergeProps, memo } from 'solid-js/web';
import { createContext, createResource, createMemo, createSignal, splitProps, mergeProps as mergeProps$1, createRenderEffect, useContext } from 'solid-js';
import { mat4, vec3 } from 'gl-matrix';

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
var modelView = (props) => {
  const gl = useSignalGL();
  if (!gl)
    throw "gl not defined";
  let modelView2 = mat4.create();
  return uniform.mat4(() => matrixFromPose(mat4.identity(modelView2), props));
};
var sceneContext = createContext();
var useScene = () => useContext(sceneContext);
var Scene = (props) => {
  const [projection, setProjection] = createSignal(mat4.create(), {
    equals: false
  });
  const [camera, setCamera] = createSignal({
    position: [0, 0, 0],
    rotation: [0, 0.1, 0],
    scale: [1, 1, 1]
  });
  const cameraPerspectiveScratch = mat4.create();
  const projectedScene = createMemo(() => matrixFromPose(projection(), camera()));
  return createComponent(Canvas, mergeProps(props, {
    onResize: ({
      canvas
    }) => {
      setProjection(mat4.perspective(cameraPerspectiveScratch, (camera().fov || 45) * Math.PI / 180, canvas.clientWidth / canvas.clientHeight, camera().near || 0.1, camera().far || 1e4));
    },
    get children() {
      return createComponent(sceneContext.Provider, {
        get value() {
          return {
            projection: uniform.mat4(projectedScene),
            setCamera
          };
        },
        get children() {
          return props.children;
        }
      });
    }
  }));
};
var Group = (props) => {
  const scene = useScene();
  if (!scene)
    throw "scene was not defined";
  const projection = uniform.mat4(() => matrixFromPose(mat4.clone(scene.projection.value), props));
  return createComponent(sceneContext.Provider, {
    get value() {
      return {
        ...scene,
        get projection() {
          return projection;
        }
      };
    },
    get children() {
      return props.children;
    }
  });
};
var Shape = (props) => {
  const [pose] = splitProps(props, ["position", "rotation", "scale"]);
  return createComponent(Group, mergeProps(pose, {
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
          out vec4 position;
          void main(void) {
            position = ${scene.projection} * vec4(${attribute.vec3(props.vertices)}, 1.);
            gl_Position = position;
          }`;
            },
            get fragment() {
              return props.fragment || glsl`#version 300 es
          precision mediump float;
          out vec4 color_out;
          void main(void) {
            color_out = vec4(${uniform.vec3(() => props.color)}, ${uniform.float(() => props.opacity)});
          }`;
            },
            mode: "TRIANGLES",
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
  const merged = mergeProps$1({
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
    opacity: 1
  }, props);
  return createComponent(Shape, merged);
};
var Camera = (props) => {
  const scene = useScene();
  if (!scene)
    throw "scene is undefined";
  const position = vec3.create();
  const rotation = vec3.create();
  const cameraProps = mergeProps$1(props, {
    get position() {
      if (!props.position)
        return void 0;
      return vec3.negate(position, props.position);
    },
    get rotation() {
      if (!props.rotation)
        return void 0;
      return vec3.negate(rotation, props.rotation);
    }
  });
  createRenderEffect(() => {
    if (!props.active)
      return;
    scene.setCamera(cameraProps);
  });
  return createComponent(Group, props);
};

export { Camera, Cube, Group, Scene, Shape, loadOBJ, modelView };
