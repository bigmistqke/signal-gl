import { mergeProps, createContext, createSignal, useContext, splitProps, children, createMemo, onMount, createRenderEffect, createEffect, untrack } from 'solid-js';
import zeptoid from 'zeptoid';
import { spread, createComponent, template } from 'solid-js/web';

// src/core/classes.ts
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
var dataTypeToFunctionName = (dataType) => {
  switch (dataType) {
    case "float":
      return "uniform1f";
    case "int":
    case "bool":
      return "uniform1i";
    default:
      if (dataType.includes("mat")) ;
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
          options: mergeProps(
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
      const options = mergeProps({ stride: 0, offset: 0 }, _options);
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

// src/core/utils.ts
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

// src/core/classes.ts
var Base = class {
  gl;
  canvas;
  constructor(config) {
    this.canvas = config.canvas;
    const gl = config.canvas.getContext("webgl2");
    if (!gl)
      throw "can not get webgl2 context";
    this.gl = gl;
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.depthRange(0.2, 10);
    this.gl.clearDepth(1);
  }
  render() {
    return this;
  }
  clear() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.depthMask(true);
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
    const config = mergeProps(
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
        mergeProps(this, {
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
var GLRenderTextureStack = class extends GLStack {
  texture;
  constructor(config) {
    super(config);
    this.texture = new GLRenderTexture(this.gl, config);
  }
  render() {
    this.texture.activate();
    super.clear();
    super.render();
    this.texture.deactivate();
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
var GLRenderTexture = class extends UtilityBase {
  renderBuffer;
  texture;
  constructor(gl, config = {}) {
    super(gl, config);
    this.renderBuffer = new GLRenderBuffer(gl, config);
    const texture = this.gl.createTexture();
    if (!texture)
      throw "unable to render texture";
    this.texture = texture;
  }
  activate() {
    if (!this.gl) {
      console.error("this.gl is undefined");
      return;
    }
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
    this.config = mergeProps({ color: true, depth: true }, config);
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
var _tmpl$ = /* @__PURE__ */ template(`<canvas>`);
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
var Stack = (props) => {
  const [childrenProps, rest] = splitProps(props, ["children"]);
  const merged = mergeProps({
    clear: true
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
          return (() => {
            const childs = children(() => childrenProps.children);
            const programs = createMemo(() => filterGLPrograms(childs()));
            onMount(() => {
              try {
                const stack = new GLStack({
                  canvas,
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
            return canvas;
          })();
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
      onRender: () => {
        props.onTextureUpdate(stack.texture);
        props.onRender?.();
      }
    }));
  } catch (error2) {
    console.error(error2);
  }
  return [];
};
var DEBUG = true;
var nameCacheMap = /* @__PURE__ */ new WeakMap();
var glsl = function(template, ...holes) {
  const hasNameCache = nameCacheMap.has(template);
  if (!hasNameCache)
    nameCacheMap.set(template, []);
  const nameCache = nameCacheMap.get(template);
  const scopedNames = /* @__PURE__ */ new Map();
  const tokens = createMemo(
    () => holes.map((hole, index) => {
      if (typeof hole === "function") {
        return hole();
      }
      if (typeof hole === "string") {
        const name2 = (
          // check for cache
          hasNameCache && nameCache[index] || // check for scoped names
          scopedNames.get(hole) || // create new name
          `${hole}_${zeptoid()}`
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
      return mergeProps(hole, { name });
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
    name: "s_" + zeptoid()
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

export { GLProgram, GLRenderBuffer, GLRenderTexture, GLRenderTextureStack, GLStack, Program, RenderTexture, Stack, attribute, buffer, compileStrings, filterGLPrograms, glsl, isGLProgram, uniform, useSignalGL };
