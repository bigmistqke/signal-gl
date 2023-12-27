import { mergeProps, createSignal, createContext, splitProps, children, createMemo, onMount, createRenderEffect, untrack, useContext, createEffect } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/dist/server.js';
import { g as get$1 } from './get-6158dfbd.mjs';
import { spread, createComponent, memo, template } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/web/dist/server.js';
import { createScheduled, throttle } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/@solid-primitives+scheduled@1.4.1_solid-js@1.8.7/node_modules/@solid-primitives/scheduled/dist/index.js';

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
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
  const shader = gl.createShader(type === "fragment" ? gl.FRAGMENT_SHADER : gl.VERTEX_SHADER);
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
      gl.vertexAttribPointer(location, token.size, gl.FLOAT, false, token.options.stride, token.options.offset);
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
    cb == null ? void 0 : cb(buffer2);
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
      gl.texImage2D(gl.TEXTURE_2D, 0, gl[internalFormat], width, height, border, gl[format], gl[dataType], token.value);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[minFilter]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[magFilter]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[wrapS]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[wrapT]);
    gl.uniform1i(gl.getUniformLocation(program, token.name), token.textureIndex);
    requestRender();
  });
};
var dataTypeToFunctionName = (dataType) => {
  switch (dataType) {
    case "float":
      return "uniform1f";
    case "int":
    case "bool":
      return "uniform1i";
    default:
      if (dataType.includes("mat"))
        ;
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
          name: "u_" + get$1(),
          functionName: dataTypeToFunctionName(dataType),
          tokenType: dataType,
          get value() {
            return typeof value === "function" ? value() : value;
          },
          options: mergeProps({
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
          }, options),
          textureIndex: textureIndex++
        };
      }
      return {
        dataType,
        functionName: dataTypeToFunctionName(dataType),
        get value() {
          return typeof value === "function" ? value() : value;
        },
        name: "u_" + get$1(),
        options,
        tokenType: "uniform"
      };
    };
  }
});
var attribute = new Proxy({}, {
  get(target, dataType) {
    return (...[value, _options]) => {
      const options = mergeProps({
        stride: 0,
        offset: 0
      }, _options);
      const size = typeof dataType === "string" ? +dataType[dataType.length - 1] : void 0;
      return {
        buffer: buffer(value, {
          target: "ARRAY_BUFFER"
        }),
        dataType,
        name: "a_" + get$1(),
        options,
        size: size && !isNaN(size) ? size : 1,
        tokenType: "attribute"
      };
    };
  }
});
var buffer = (value, options) => ({
  name: options.name || get$1(),
  tokenType: "buffer",
  get value() {
    return typeof value === "function" ? value() : value;
  },
  options
});
var Base = class {
  constructor(_config) {
    __publicField(this, "gl");
    __publicField(this, "canvas");
    __publicField(this, "config");
    const config = mergeProps({
      background: [0, 0, 0, 1]
    }, _config);
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
      onResize == null ? void 0 : onResize(this);
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
    this.render().gl.readPixels(0, 0, _config.width, _config.height, this.gl[_config.format], this.gl[_config.dataType], output);
    return output;
  }
};
var GLProgram = class extends Base {
  constructor(_config) {
    super(_config);
    __publicField(this, "config");
    __publicField(this, "program");
    /* Map of all uniforms/attributes in this program. Gets added to during bind-stage with `addToQueue`. */
    __publicField(this, "renderQueue", /* @__PURE__ */ new Map());
    __publicField(this, "addToRenderQueue", (location, fn) => (this.renderQueue.set(location, fn), () => this.renderQueue.delete(location)));
    __publicField(this, "renderRequestSignal", createSignal(0));
    __publicField(this, "getRenderRequest", this.renderRequestSignal[0]);
    __publicField(this, "setRenderRequest", this.renderRequestSignal[1]);
    __publicField(this, "requestRender", () => {
      this.setRenderRequest((number) => (number + 1) % 1e8);
    });
    __publicField(this, "render", () => {
      var _a, _b;
      this.getRenderRequest();
      this.gl.useProgram(this.program);
      const values = this.renderQueue.values();
      for (const update of values) {
        update();
      }
      (_b = (_a = this.config).onRender) == null ? void 0 : _b.call(_a, this.gl, this.program);
      if ("indices" in this.config && this.config.indices) {
        this.gl.drawElements(this.gl[this.config.mode || "TRIANGLES"], this.config.indices.length, this.gl.UNSIGNED_SHORT, this.config.offset || 0);
      } else if ("count" in this.config) {
        this.gl.drawArrays(this.gl[this.config.mode || "TRIANGLES"], this.config.first || 0, this.config.count);
      } else {
        console.error("neither indices nor count defined");
      }
      return this;
    });
    const config = mergeProps({
      mode: "TRIANGLES",
      cacheEnabled: false,
      first: 0,
      offset: 0
    }, _config);
    this.config = config;
    if (!this.gl)
      throw "webgl2 is not supported";
    const cachedProgram = config.cacheEnabled && getProgramCache(config);
    const program = cachedProgram || createWebGLProgram(this.gl, config.vertex.source.code, config.fragment.source.code);
    if (!program)
      throw `error while building program`;
    this.program = program;
    if (config.cacheEnabled)
      setProgramCache({
        ...config,
        program: this.program
      });
    config.vertex.bind(this);
    config.fragment.bind(this);
    if ("indices" in config && config.indices) {
      const token = buffer(Array.isArray(config.indices) ? new Uint16Array(config.indices) : config.indices, {
        target: "ELEMENT_ARRAY_BUFFER"
      });
      bindBufferToken(mergeProps(this, {
        token
      }));
    }
  }
};
var isGLProgram = (value) => value instanceof GLProgram;
var filterGLPrograms = (value) => castToArray(value).filter(isGLProgram);
var filterNonGLPrograms = (value) => castToArray(value).filter((v) => !isGLProgram(v));
var programCache = /* @__PURE__ */ new WeakMap();
var getProgramCache = (config) => {
  var _a;
  return (_a = programCache.get(config.vertex.template)) == null ? void 0 : _a.get(config.fragment.template);
};
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
  constructor(config) {
    super(config);
    __publicField(this, "config");
    this.config = config;
  }
  get programs() {
    return this.config.programs;
  }
  render() {
    const programs = this.programs;
    for (const program of programs) {
      program.render();
    }
    return this;
  }
};
var GLRenderTextureStack = class extends GLStack {
  constructor(config) {
    super(config);
    __publicField(this, "texture");
    this.texture = new GLRenderTexture(this.gl, config);
  }
  render() {
    super.clear();
    this.texture.activate();
    super.render();
    this.texture.deactivate();
    return this;
  }
};
var UtilityBase = class {
  constructor(gl, config) {
    __publicField(this, "gl");
    __publicField(this, "config");
    this.gl = gl;
    this.config = config || {};
  }
};
var GLTexture = class extends UtilityBase {
  constructor(gl, config = {}) {
    super(gl, config);
    __publicField(this, "texture");
    const texture = this.gl.createTexture();
    if (!texture)
      throw "unable to create texture";
    this.texture = texture;
  }
};
var GLRenderTexture = class extends GLTexture {
  constructor(gl, config = {}) {
    super(gl, config);
    __publicField(this, "renderBuffer");
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
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.texture, 0);
  }
  deactivate() {
    this.renderBuffer.deactivate();
  }
};
var GLRenderBuffer = class extends UtilityBase {
  constructor(gl, config = {}) {
    super(gl, config);
    __publicField(this, "framebuffer");
    __publicField(this, "depthbuffer");
    __publicField(this, "colorbuffer");
    const framebuffer = gl.createFramebuffer();
    const renderbuffer = gl.createRenderbuffer();
    const depthbuffer = gl.createRenderbuffer();
    if (!framebuffer || !renderbuffer || !depthbuffer)
      throw "could not create framebuffer or renderbuffer";
    this.config = mergeProps({
      color: true,
      depth: true
    }, config);
    this.framebuffer = framebuffer;
    this.colorbuffer = renderbuffer;
    this.depthbuffer = depthbuffer;
  }
  activate() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    if (this.config.color) {
      this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.colorbuffer);
      this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.RGBA8, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
      this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.RENDERBUFFER, this.colorbuffer);
    }
    if (this.config.depth) {
      this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.depthbuffer);
      this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
      this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.depthbuffer);
    }
    return this;
  }
  deactivate() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
  }
};
var _tmpl$ = /* @__PURE__ */ template(`<canvas>`);
var internalContext = createContext();
var useInternal = () => useContext(internalContext);
var signalGLContext = createContext();
var createRenderLoop = (config) => {
  const context = useInternal();
  if (!context)
    return;
  config.stack.autosize(() => {
    var _a;
    (_a = config.onResize) == null ? void 0 : _a.call(config, config.stack);
    for (const event of context.events.onResize) {
      event();
    }
  });
  performance.now();
  const render = () => {
    var _a, _b;
    (_a = config.onBeforeRender) == null ? void 0 : _a.call(config);
    if (config.clear) {
      if (typeof config.clear === "function")
        config.clear(config.stack);
      else
        config.stack.clear();
    }
    for (const event of context.events.onResize) {
      event();
    }
    config.stack.render();
    (_b = config.onAfterRender) == null ? void 0 : _b.call(config);
  };
  const scheduled = createScheduled((fn) => throttle(fn, 1e3 / 120));
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
      createEffect(() => {
        if (scheduled())
          render();
      });
      past = void 0;
    }
  });
};
var Canvas = (props) => {
  const [childrenProps, rest] = splitProps(props, ["children"]);
  const merged = mergeProps({
    clear: true,
    background: [0, 0, 0, 1]
  }, rest);
  const canvas = (() => {
    const _el$ = _tmpl$();
    spread(_el$, rest, false, false);
    return _el$;
  })();
  const gl = canvas.getContext("webgl2");
  const events = {
    onResize: /* @__PURE__ */ new Set(),
    onRender: /* @__PURE__ */ new Set()
  };
  return createComponent(internalContext.Provider, {
    value: {
      canvas,
      events,
      gl,
      get onProgramCreate() {
        return props.onProgramCreate;
      }
    },
    get children() {
      return createComponent(signalGLContext.Provider, {
        value: {
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
        },
        get children() {
          return [memo(() => (() => {
            const childs = children(() => childrenProps.children);
            const programs = createMemo(() => filterGLPrograms(childs()));
            const other = createMemo(() => filterNonGLPrograms(childs()));
            onMount(() => {
              try {
                const stack = new GLStack({
                  canvas,
                  background: merged.background,
                  get programs() {
                    return programs();
                  }
                });
                createRenderLoop(mergeProps(merged, {
                  stack
                }));
              } catch (error2) {
                console.error(error2);
              }
            });
            return memo(other);
          })()), canvas];
        }
      });
    }
  });
};
var Program = (props) => {
  const context = useInternal();
  if (!context)
    throw "no context";
  const config = mergeProps({
    canvas: context.canvas
  }, props);
  return () => new GLProgram(config);
};
var RenderTexture = (props) => {
  const merged = mergeProps({
    clear: true
  }, props);
  const internal = useInternal();
  if (!internal)
    throw "internal context undefined";
  const childs = children(() => props.children);
  try {
    const stack = new GLRenderTextureStack({
      canvas: internal.canvas,
      get programs() {
        return filterGLPrograms(childs());
      },
      width: internal.canvas.width,
      height: internal.canvas.width
    });
    createRenderLoop(mergeProps(merged, {
      stack,
      onAfterRender: () => props.onTextureUpdate(stack.texture)
    }));
  } catch (error2) {
    console.error(error2);
  }
  return () => props.passthrough ? props.children : [];
};
var DEBUG = false;
var nameCacheMap = /* @__PURE__ */ new WeakMap();
var glsl = function(template2, ...holes) {
  const hasNameCache = nameCacheMap.has(template2);
  if (!hasNameCache)
    nameCacheMap.set(template2, []);
  const nameCache = nameCacheMap.get(template2);
  const scopedNames = /* @__PURE__ */ new Map();
  const tokens = createMemo(() => holes.map((hole, index) => {
    if (typeof hole === "function") {
      return hole();
    }
    if (typeof hole === "string") {
      const name2 = (
        // check for cache
        hasNameCache && nameCache[index] || // check for scoped names
        scopedNames.get(hole) || // create new name
        `${hole}_${get$1()}`
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
    return mergeProps(hole, {
      name
    });
  }).filter((hole) => hole !== void 0));
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
          return bindAttributeToken({
            token,
            ...data
          });
        case "sampler2D":
        case "isampler2D":
          return bindSampler2DToken({
            token,
            ...data
          });
        case "uniform":
          return bindUniformToken({
            token,
            ...data
          });
        case "shader":
          return token.bind(data);
      }
    });
  };
  return {
    get source() {
      const source = compileStrings(template2, tokens());
      DEBUG && console.log("source", source.code);
      return source;
    },
    bind,
    tokenType: "shader",
    template: template2,
    name: "s_" + get$1()
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
  var _a, _b;
  const code = [...strings.flatMap((string, index) => {
    const variable = tokens[index];
    if (variable) {
      if (variable.tokenType === "shader")
        return [string, variable.source.parts.body];
    }
    if (!variable || !("name" in variable))
      return string;
    return [string, variable.name];
  })].join("");
  const variables = Array.from(new Set(tokens.flatMap(tokenToString))).join("\n");
  const precision = (_a = code.match(/precision.*;/)) == null ? void 0 : _a[0];
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
  const version = (_b = code.match(/#version.*/)) == null ? void 0 : _b[0];
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

export { Canvas as C, GLProgram as G, Program as P, RenderTexture as R, attribute as a, GLStack as b, glsl as g, uniform as u };
//# sourceMappingURL=XEQHI3TD-da61e201.mjs.map
