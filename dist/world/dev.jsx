// src/world/loaders.tsx
import { createMemo, createResource } from "solid-js";
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

// src/world/index.tsx
import { mat4, vec3 } from "gl-matrix";
import {
  createContext as createContext2,
  createMemo as createMemo4,
  createRenderEffect as createRenderEffect2,
  createSignal as createSignal2,
  mergeProps as mergeProps6,
  splitProps as splitProps2,
  useContext as useContext2
} from "solid-js";

// src/core/classes.ts
import { createSignal, mergeProps as mergeProps3 } from "solid-js";

// src/core/internalUtils.ts
var castToArray = (value) => typeof value === "object" && Array.isArray(value) ? value : [value];
function createWebGLProgram(gl, vertex, fragment) {
  const program = gl.createProgram();
  var vertexShader = createWebGLShader(gl, vertex, "vertex");
  var fragmentShader = createWebGLShader(gl, fragment, "fragment");
  if (!program || !vertexShader || !fragmentShader)
    return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("error while creating program", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}
function createWebGLShader(gl, src, type) {
  const shader = gl.createShader(
    type === "fragment" ? gl.FRAGMENT_SHADER : gl.VERTEX_SHADER
  );
  if (!shader) {
    console.error(type, `error while creating shader`);
    return null;
  }
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(type, gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// src/core/template/bindings.ts
import { createRenderEffect, mergeProps, untrack } from "solid-js";
var bindUniformToken = ({
  token,
  gl,
  program,
  addToRenderQueue
}) => {
  const location = gl.getUniformLocation(program, token.name);
  const isMatrix = token.dataType.includes("mat");
  const update = isMatrix ? () => gl[token.functionName](location, false, token.value) : () => gl[token.functionName](location, token.value);
  addToRenderQueue(token.name, update);
};
var bindAttributeToken = ({
  token,
  gl,
  program,
  addToRenderQueue,
  requestRender
}) => {
  const location = gl.getAttribLocation(program, token.name);
  bindBufferToken({
    token: token.buffer,
    gl,
    addToRenderQueue,
    requestRender,
    cb: () => {
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(
        location,
        token.size,
        gl.FLOAT,
        false,
        token.options.stride,
        token.options.offset
      );
    }
  });
};
var bindBufferToken = ({
  token,
  gl,
  addToRenderQueue,
  requestRender,
  cb
}) => {
  const buffer2 = gl.createBuffer();
  addToRenderQueue(token.name, () => {
    gl.bindBuffer(gl[token.options.target], buffer2);
    cb?.(buffer2);
  });
  createRenderEffect(() => {
    gl.bindBuffer(gl[token.options.target], buffer2);
    gl.bufferData(gl[token.options.target], token.value, gl.STATIC_DRAW);
    gl.finish();
    requestRender();
  });
};
var bindSampler2DToken = ({
  token,
  gl,
  program,
  addToRenderQueue,
  requestRender
}) => {
  const isGLRenderTexture = (value) => value instanceof GLRenderTexture;
  const _texture = gl.createTexture();
  const texture = () => isGLRenderTexture(token.value) ? token.value.texture : _texture;
  addToRenderQueue(token.name, () => {
    gl.activeTexture(gl[`TEXTURE${token.textureIndex}`]);
    gl.bindTexture(gl.TEXTURE_2D, texture());
  });
  createRenderEffect(() => {
    gl.useProgram(program);
    const {
      format,
      width,
      height,
      border,
      minFilter,
      magFilter,
      wrapS,
      wrapT,
      internalFormat,
      dataType
    } = token.options;
    gl.activeTexture(gl[`TEXTURE${token.textureIndex}`]);
    gl.bindTexture(gl.TEXTURE_2D, texture());
    if (!untrack(() => isGLRenderTexture(token.value))) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl[internalFormat],
        width,
        height,
        border,
        gl[format],
        gl[dataType],
        token.value
      );
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[minFilter]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[magFilter]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[wrapS]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[wrapT]);
    gl.uniform1i(gl.getUniformLocation(program, token.name), token.textureIndex);
    requestRender();
  });
};

// src/core/template/tokens.ts
import { mergeProps as mergeProps2 } from "solid-js";
import zeptoid from "zeptoid";
var dataTypeToFunctionName = (dataType) => {
  switch (dataType) {
    case "float":
      return "uniform1f";
    case "int":
    case "bool":
      return "uniform1i";
    default:
      if (dataType.includes("mat")) {
      }
      const count = dataType[dataType.length - 1];
      if (dataType.includes("mat"))
        return `uniformMatrix${count}fv`;
      const type = dataType[0] === "b" || dataType[0] === "i" ? "i" : "f";
      return `uniform${count}${type}v`;
  }
};
var textureIndex = 0;
var uniform = new Proxy({}, {
  get(target, dataType) {
    return (...[value, options]) => {
      if (dataType === "sampler2D") {
        return {
          dataType,
          name: "u_" + zeptoid(),
          functionName: dataTypeToFunctionName(dataType),
          tokenType: dataType,
          get value() {
            return typeof value === "function" ? value() : value;
          },
          options: mergeProps2(
            {
              border: 0,
              dataType: "UNSIGNED_BYTE",
              format: "RGBA",
              height: 2,
              internalFormat: "RGBA8",
              magFilter: "NEAREST",
              minFilter: "NEAREST",
              width: 2,
              wrapS: "CLAMP_TO_EDGE",
              wrapT: "CLAMP_TO_EDGE"
            },
            options
          ),
          textureIndex: textureIndex++
        };
      }
      return {
        dataType,
        functionName: dataTypeToFunctionName(dataType),
        get value() {
          return typeof value === "function" ? value() : value;
        },
        name: "u_" + zeptoid(),
        options,
        tokenType: "uniform"
      };
    };
  }
});
var attribute = new Proxy({}, {
  get(target, dataType) {
    return (...[value, _options]) => {
      const options = mergeProps2({ stride: 0, offset: 0 }, _options);
      const size = typeof dataType === "string" ? +dataType[dataType.length - 1] : void 0;
      return {
        buffer: buffer(value, { target: "ARRAY_BUFFER" }),
        dataType,
        name: "a_" + zeptoid(),
        options,
        size: size && !isNaN(size) ? size : 1,
        tokenType: "attribute"
      };
    };
  }
});
var buffer = (value, options) => ({
  name: options.name || zeptoid(),
  tokenType: "buffer",
  get value() {
    return typeof value === "function" ? value() : value;
  },
  options
});

// src/core/classes.ts
var Base = class {
  gl;
  canvas;
  config;
  constructor(_config) {
    const config = mergeProps3(
      {
        background: [0, 0, 0, 1]
      },
      _config
    );
    this.config = config;
    this.canvas = config.canvas;
    const gl = config.canvas.getContext("webgl2");
    if (!gl)
      throw "can not get webgl2 context";
    this.gl = gl;
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.depthRange(0.2, 10);
    this.gl.clearDepth(1);
  }
  render() {
    return this;
  }
  clear() {
    this.gl.clearColor(...this.config.background);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.depthMask(true);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    return this;
  }
  autosize(onResize) {
    if (this.canvas instanceof OffscreenCanvas) {
      throw "can not autosize OffscreenCanvas";
    }
    const resizeObserver = new ResizeObserver(() => {
      if (this.canvas instanceof OffscreenCanvas) {
        throw "can not autosize OffscreenCanvas";
      }
      this.canvas.width = this.canvas.clientWidth;
      this.canvas.height = this.canvas.clientHeight;
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.clear();
      this.render();
      onResize?.(this);
    });
    resizeObserver.observe(this.canvas);
    return this;
  }
  read(output, config) {
    const _config = {
      format: "RGBA",
      dataType: "UNSIGNED_BYTE",
      internalFormat: "RGBA8",
      width: this.gl.canvas.width,
      height: this.gl.canvas.height,
      ...config
    };
    this.render().gl.readPixels(
      0,
      0,
      _config.width,
      _config.height,
      this.gl[_config.format],
      this.gl[_config.dataType],
      output
    );
    return output;
  }
};
var GLProgram = class extends Base {
  config;
  program;
  constructor(_config) {
    super(_config);
    const config = mergeProps3(
      {
        mode: "TRIANGLES",
        cacheEnabled: false,
        first: 0,
        offset: 0
      },
      _config
    );
    this.config = config;
    if (!this.gl)
      throw "webgl2 is not supported";
    const cachedProgram = config.cacheEnabled && getProgramCache(config);
    const program = cachedProgram || createWebGLProgram(
      this.gl,
      config.vertex.source.code,
      config.fragment.source.code
    );
    if (!program)
      throw `error while building program`;
    this.program = program;
    if (config.cacheEnabled)
      setProgramCache({ ...config, program: this.program });
    config.vertex.bind(this);
    config.fragment.bind(this);
    if ("indices" in config && config.indices) {
      const token = buffer(
        Array.isArray(config.indices) ? new Uint16Array(config.indices) : config.indices,
        {
          target: "ELEMENT_ARRAY_BUFFER"
        }
      );
      bindBufferToken(
        mergeProps3(this, {
          token
        })
      );
    }
  }
  /* Map of all uniforms/attributes in this program. Gets added to during bind-stage with `addToQueue`. */
  renderQueue = /* @__PURE__ */ new Map();
  addToRenderQueue = (location, fn) => (this.renderQueue.set(location, fn), () => this.renderQueue.delete(location));
  renderRequestSignal = createSignal(0);
  getRenderRequest = this.renderRequestSignal[0];
  setRenderRequest = this.renderRequestSignal[1];
  requestRender = () => {
    this.setRenderRequest((number) => (number + 1) % Number.MAX_SAFE_INTEGER);
  };
  render = () => {
    this.getRenderRequest();
    this.gl.useProgram(this.program);
    this.renderQueue.forEach((update) => update());
    this.config.onRender?.(this.gl, this.program);
    if ("indices" in this.config && this.config.indices) {
      this.gl.drawElements(
        this.gl[this.config.mode || "TRIANGLES"],
        this.config.indices.length,
        this.gl.UNSIGNED_SHORT,
        this.config.offset || 0
      );
    } else if ("count" in this.config) {
      this.gl.drawArrays(
        this.gl[this.config.mode || "TRIANGLES"],
        this.config.first || 0,
        this.config.count
      );
    } else {
      console.error("neither indices nor count defined");
    }
    return this;
  };
};
var isGLProgram = (value) => value instanceof GLProgram;
var filterGLPrograms = (value) => castToArray(value).filter(isGLProgram);
var programCache = /* @__PURE__ */ new WeakMap();
var getProgramCache = (config) => programCache.get(config.vertex.template)?.get(config.fragment.template);
var setProgramCache = ({
  vertex,
  fragment,
  program
}) => {
  if (!programCache.get(vertex.template)) {
    programCache.set(vertex.template, /* @__PURE__ */ new WeakMap());
  }
  if (!programCache.get(vertex.template).get(fragment.template)) {
    programCache.get(vertex.template).set(fragment.template, program);
  }
};
var GLStack = class extends Base {
  config;
  get programs() {
    return this.config.programs;
  }
  constructor(config) {
    super(config);
    this.config = config;
  }
  render() {
    this.programs.forEach((program) => program.render());
    return this;
  }
};
var UtilityBase = class {
  gl;
  config;
  constructor(gl, config) {
    this.gl = gl;
    this.config = config || {};
  }
};
var GLTexture = class extends UtilityBase {
  texture;
  constructor(gl, config = {}) {
    super(gl, config);
    const texture = this.gl.createTexture();
    if (!texture)
      throw "unable to create texture";
    this.texture = texture;
  }
};
var GLRenderTexture = class extends GLTexture {
  renderBuffer;
  constructor(gl, config = {}) {
    super(gl, config);
    this.renderBuffer = new GLRenderBuffer(gl, config);
  }
  activate() {
    this.renderBuffer.activate();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      // level
      this.gl[this.config.internalFormat || "RGBA8"],
      this.gl.drawingBufferWidth,
      this.gl.drawingBufferHeight,
      0,
      // border
      this.gl[this.config.format || "RGBA"],
      this.gl[this.config.dataType || "UNSIGNED_BYTE"],
      null
    );
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      this.texture,
      0
    );
  }
  deactivate() {
    this.renderBuffer.deactivate();
  }
};
var GLRenderBuffer = class extends UtilityBase {
  framebuffer;
  depthbuffer;
  colorbuffer;
  constructor(gl, config = {}) {
    super(gl, config);
    const framebuffer = gl.createFramebuffer();
    const renderbuffer = gl.createRenderbuffer();
    const depthbuffer = gl.createRenderbuffer();
    if (!framebuffer || !renderbuffer || !depthbuffer)
      throw "could not create framebuffer or renderbuffer";
    this.config = mergeProps3({ color: true, depth: true }, config);
    this.framebuffer = framebuffer;
    this.colorbuffer = renderbuffer;
    this.depthbuffer = depthbuffer;
  }
  activate() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    if (this.config.color) {
      this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.colorbuffer);
      this.gl.renderbufferStorage(
        this.gl.RENDERBUFFER,
        this.gl.RGBA8,
        this.gl.drawingBufferWidth,
        this.gl.drawingBufferHeight
      );
      this.gl.framebufferRenderbuffer(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0,
        this.gl.RENDERBUFFER,
        this.colorbuffer
      );
    }
    if (this.config.depth) {
      this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.depthbuffer);
      this.gl.renderbufferStorage(
        this.gl.RENDERBUFFER,
        this.gl.DEPTH_COMPONENT16,
        this.gl.drawingBufferWidth,
        this.gl.drawingBufferHeight
      );
      this.gl.framebufferRenderbuffer(
        this.gl.FRAMEBUFFER,
        this.gl.DEPTH_ATTACHMENT,
        this.gl.RENDERBUFFER,
        this.depthbuffer
      );
    }
    return this;
  }
  deactivate() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
  }
};

// src/core/components.tsx
import {
  children,
  createContext,
  createEffect,
  createMemo as createMemo2,
  mergeProps as mergeProps4,
  onMount,
  splitProps,
  useContext
} from "solid-js";
var internalContext = createContext();
var useInternal = () => useContext(internalContext);
var signalGLContext = createContext();
var useSignalGL = () => useContext(signalGLContext);
var createRenderLoop = (config) => {
  const context = useInternal();
  if (!context)
    return;
  config.stack.autosize(() => {
    config.onResize?.(config.stack);
    context.events.onResize.forEach((fn) => fn());
  });
  const render = () => {
    config.stack.clear();
    config.onRender?.();
    context.events.onRender.forEach((fn) => fn());
    config.stack.render();
  };
  let past;
  const animate = () => {
    if (!config.animate)
      return;
    if (config.animate !== true) {
      let now = Date.now();
      if (!past || now - past > config.animate) {
        render();
        past = now;
      }
    } else {
      render();
    }
    requestAnimationFrame(animate);
  };
  createEffect(() => {
    if (config.animate) {
      setTimeout(animate);
    } else {
      createEffect(render);
      past = void 0;
    }
  });
};
var Canvas = (props) => {
  const [childrenProps, rest] = splitProps(props, ["children"]);
  const merged = mergeProps4({ clear: true }, rest);
  const canvas = <canvas {...rest} />;
  const gl = canvas.getContext("webgl2");
  const events = {
    onResize: /* @__PURE__ */ new Set(),
    onRender: /* @__PURE__ */ new Set()
  };
  return <internalContext.Provider
    value={{
      canvas,
      events,
      gl,
      get onProgramCreate() {
        return props.onProgramCreate;
      }
    }}
  ><signalGLContext.Provider
    value={{
      canvas,
      gl,
      onRender: (callback) => {
        events.onRender.add(callback);
        return () => events.onRender.delete(callback);
      },
      onResize: (callback) => {
        events.onResize.add(callback);
        return () => events.onResize.delete(callback);
      }
    }}
  >{(() => {
    const childs = children(() => childrenProps.children);
    const programs = createMemo2(() => filterGLPrograms(childs()));
    onMount(() => {
      try {
        const stack = new GLStack({
          canvas,
          background: props.background,
          get programs() {
            return programs();
          }
        });
        createRenderLoop(mergeProps4(merged, { stack }));
      } catch (error2) {
        console.error(error2);
      }
    });
    return canvas;
  })()}</signalGLContext.Provider></internalContext.Provider>;
};
var Program = (props) => {
  const context = useInternal();
  if (!context)
    throw "no context";
  const config = mergeProps4(
    {
      canvas: context.canvas
    },
    props
  );
  return () => new GLProgram(config);
};

// src/core/template/glsl.ts
import { createMemo as createMemo3, mergeProps as mergeProps5 } from "solid-js";
import zeptoid2 from "zeptoid";
var DEBUG = true;
var nameCacheMap = /* @__PURE__ */ new WeakMap();
var glsl = function(template, ...holes) {
  const hasNameCache = nameCacheMap.has(template);
  if (!hasNameCache)
    nameCacheMap.set(template, []);
  const nameCache = nameCacheMap.get(template);
  const scopedNames = /* @__PURE__ */ new Map();
  const tokens = createMemo3(
    () => holes.map((hole, index) => {
      if (typeof hole === "function") {
        return hole();
      }
      if (typeof hole === "string") {
        const name2 = (
          // check for cache
          hasNameCache && nameCache[index] || // check for scoped names
          scopedNames.get(hole) || // create new name
          `${hole}_${zeptoid2()}`
        );
        if (!scopedNames.has(hole))
          scopedNames.set(hole, name2);
        if (!hasNameCache || !nameCache[index])
          nameCache[index] = name2;
        return {
          name: name2,
          tokenType: "scope"
        };
      }
      const name = hasNameCache && nameCache[index] || hole.name;
      if (!hasNameCache)
        nameCache[index] = name;
      if (DEBUG && !name) {
        console.error(
          "id was not found for hole:",
          hole,
          "with index",
          index
        );
      }
      return mergeProps5(hole, { name });
    }).filter((hole) => hole !== void 0)
  );
  const bind = ({
    gl,
    program,
    addToRenderQueue,
    requestRender
  }) => {
    gl.useProgram(program);
    const data = {
      gl,
      program,
      addToRenderQueue,
      requestRender
    };
    const visitedTokens = /* @__PURE__ */ new Set();
    tokens().forEach((token) => {
      if (visitedTokens.has(token.name))
        return;
      visitedTokens.add(token.name);
      switch (token.tokenType) {
        case "attribute":
          return bindAttributeToken({ token, ...data });
        case "sampler2D":
        case "isampler2D":
          return bindSampler2DToken({ token, ...data });
        case "uniform":
          return bindUniformToken({ token, ...data });
        case "shader":
          return token.bind(data);
      }
    });
  };
  return {
    get source() {
      const source = compileStrings(template, tokens());
      DEBUG && console.log("source", source.code);
      return source;
    },
    bind,
    tokenType: "shader",
    template,
    name: "s_" + zeptoid2()
  };
};
var tokenToString = (token) => {
  switch (token.tokenType) {
    case "shader":
      return token.source.parts.variables;
    case "attribute":
      return `in ${token.dataType} ${token.name};`;
    case "uniform":
    case "sampler2D":
      return `uniform ${token.dataType} ${token.name};`;
    case "isampler2D":
      return `uniform highp ${token.dataType} ${token.name};`;
  }
};
var compileStrings = (strings, tokens) => {
  const code = [
    ...strings.flatMap((string, index) => {
      const variable = tokens[index];
      if (variable) {
        if (variable.tokenType === "shader")
          return [string, variable.source.parts.body];
      }
      if (!variable || !("name" in variable))
        return string;
      return [string, variable.name];
    })
  ].join("");
  const variables = Array.from(new Set(tokens.flatMap(tokenToString))).join(
    "\n"
  );
  const precision = code.match(/precision.*;/)?.[0];
  if (precision) {
    const [version2, body2] = code.split(/precision.*;/);
    return {
      code: [version2, precision, variables, body2].join("\n"),
      parts: {
        version: version2,
        precision,
        variables,
        body: body2
      }
    };
  }
  const version = code.match(/#version.*/)?.[0];
  const [pre, after] = code.split(/#version.*/);
  const body = after || pre;
  return {
    code: [version, variables, body].join("\n"),
    parts: {
      version,
      variables,
      body
    }
  };
};

// src/core/types.ts
var error = Symbol();

// src/world/index.tsx
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
var sceneContext = createContext2();
var useScene = () => useContext2(sceneContext);
var Scene = (props) => {
  const [projection, setProjection] = createSignal2(mat4.create(), {
    equals: false
  });
  const [camera, setCamera] = createSignal2({
    position: [0, 0, 0],
    rotation: [0, 0.1, 0],
    scale: [1, 1, 1]
  });
  const cameraPerspectiveScratch = mat4.create();
  const projectedScene = createMemo4(
    () => matrixFromPose(projection(), camera())
  );
  return <><Canvas
    {...props}
    onResize={({ canvas }) => {
      setProjection(
        mat4.perspective(
          cameraPerspectiveScratch,
          (camera().fov || 45) * Math.PI / 180,
          canvas.clientWidth / canvas.clientHeight,
          camera().near || 0.1,
          camera().far || 1e4
        )
      );
    }}
  ><sceneContext.Provider
    value={{
      projection: uniform.mat4(projectedScene),
      setCamera
    }}
  >{props.children}</sceneContext.Provider></Canvas></>;
};
var Group = (props) => {
  const scene = useScene();
  if (!scene)
    throw "scene was not defined";
  const projection = uniform.mat4(
    () => matrixFromPose(mat4.clone(scene.projection.value), props)
  );
  return <sceneContext.Provider
    value={{
      ...scene,
      get projection() {
        return projection;
      }
    }}
  >{props.children}</sceneContext.Provider>;
};
var Shape = (props) => {
  const [pose] = splitProps2(props, ["position", "rotation", "scale"]);
  return <Group {...pose}>
    {props.children}
    {(() => {
      const scene = useScene();
      if (!scene)
        throw "scene not defined";
      return <Program
        vertex={props.vertex || glsl`#version 300 es
          precision mediump float;
          out vec4 position;
          void main(void) {
            position = ${scene.projection} * vec4(${attribute.vec3(props.vertices)}, 1.);
            gl_Position = position;
          }`}
        fragment={props.fragment || glsl`#version 300 es
          precision mediump float;
          out vec4 color_out;
          void main(void) {
            color_out = vec4(${uniform.vec3(() => props.color)}, ${uniform.float(() => props.opacity)});
          }`}
        mode="TRIANGLES"
        indices={props.indices}
        cacheEnabled
      />;
    })()}
  </Group>;
};
var Cube = (props) => {
  const merged = mergeProps6({
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
  return <Shape {...merged} />;
};
var Camera = (props) => {
  const scene = useScene();
  if (!scene)
    throw "scene is undefined";
  const position = vec3.create();
  const rotation = vec3.create();
  const cameraProps = mergeProps6(props, {
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
  createRenderEffect2(() => {
    if (!props.active)
      return;
    scene.setCamera(cameraProps);
  });
  return <Group {...props} />;
};
export {
  Camera,
  Cube,
  Group,
  Scene,
  Shape,
  loadOBJ,
  modelView
};
