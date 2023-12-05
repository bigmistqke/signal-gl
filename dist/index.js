import zeptoid from 'zeptoid';
import { createContext, createEffect, mergeProps, splitProps, children, onMount, createMemo, useContext } from 'solid-js';
import { spread, createComponent, template } from 'solid-js/web';

// src/core/proxies.ts
var dataTypeToFunctionName = (dataType) => {
  switch (dataType) {
    case "float":
      return "uniform1f";
    case "int":
    case "bool":
      return "uniform1i";
    default:
      return "uniform" + // 1 | 2 | 3 | 4
      dataType[dataType.length - 1] + // b | i | f
      (dataType[0] === "b" || dataType[0] === "i" ? dataType[0] : "f") + // v
      "v";
  }
};
var uniform = new Proxy({}, {
  get(target, dataType) {
    return (...[value, options]) => ({
      dataType,
      name: "u_" + zeptoid(),
      functionName: dataTypeToFunctionName(dataType),
      tokenType: dataType === "sampler2D" ? "sampler2D" : dataType === "isampler2D" ? "isampler2D" : "uniform",
      get value() {
        return typeof value === "function" ? value() : value;
      },
      options
    });
  }
});
var attribute = new Proxy({}, {
  get(target, dataType) {
    return (...[value, options]) => {
      const size = typeof dataType === "string" ? +dataType[dataType.length - 1] : void 0;
      return {
        dataType,
        name: "a_" + zeptoid(),
        tokenType: "attribute",
        size: size && !isNaN(size) ? size : 1,
        get value() {
          return typeof value === "function" ? value() : value;
        },
        options
      };
    };
  }
});

// src/core/compilation.ts
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
function createWebGLProgram(gl, vertex, fragment) {
  const program = gl.createProgram();
  var vertexShader = createWebGLShader(gl, vertex, gl.VERTEX_SHADER);
  var fragmentShader = createWebGLShader(gl, fragment, gl.FRAGMENT_SHADER);
  if (!program || !vertexShader || !fragmentShader)
    return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("error while creating program", gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}
function createWebGLShader(gl, src, type) {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error(`error while creating shader`);
    return null;
  }
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      (type == gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT") + ` SHADER:
 ${gl.getShaderInfoLog(shader)}`
    );
    return null;
  }
  return shader;
}

// src/core/utils.ts
function objectsAreEqual(a, b) {
  return a && b && Object.keys(a).every((key) => b[key] === a[key]);
}
var textureConfigFromTypedArrayMap = /* @__PURE__ */ new Map();
textureConfigFromTypedArrayMap.set(Uint8Array, {
  format: "RED",
  internalFormat: "R8",
  dataType: "UNSIGNED_BYTE"
});
textureConfigFromTypedArrayMap.set(Float32Array, {
  format: "RED",
  internalFormat: "R32F",
  dataType: "FLOAT"
});
var getTextureConfigFromTypedArray = (buffer) => textureConfigFromTypedArrayMap.get(buffer.constructor);

// src/core/vanilla.ts
var createGL = (config) => {
  const ctx = config.canvas.getContext("webgl2");
  if (!ctx)
    throw "webgl2 is not supported";
  if (config?.extensions?.float !== false) {
    ctx.getExtension("EXT_color_buffer_float");
  }
  if (config?.extensions?.half_float) {
    ctx.getExtension("EXT_color_buffer_half_float");
  }
  return {
    ...config,
    ctx,
    render: () => config.programs.forEach((program) => program.render()),
    cache: {
      previousReadConfig: {}
    }
  };
};
var autosize = (gl) => {
  const resizeObserver = new ResizeObserver(() => {
    gl.canvas.width = gl.canvas.clientWidth;
    gl.canvas.height = gl.canvas.clientHeight;
    gl.ctx.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.render();
  });
  resizeObserver.observe(gl.canvas);
};
var clear = ({ ctx }) => {
  ctx.clearColor(0, 0, 0, 1);
  ctx.clearDepth(1);
  ctx.enable(ctx.DEPTH_TEST);
  ctx.depthFunc(ctx.LEQUAL);
  ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);
};
var renderBuffer = ({ ctx }, { internalFormat, width, height }) => {
  const framebuffer = ctx.createFramebuffer();
  ctx.bindFramebuffer(ctx.FRAMEBUFFER, framebuffer);
  const renderBuffer2 = ctx.createRenderbuffer();
  ctx.bindRenderbuffer(ctx.RENDERBUFFER, renderBuffer2);
  ctx.renderbufferStorage(ctx.RENDERBUFFER, ctx[internalFormat], width, height);
  ctx.framebufferRenderbuffer(
    ctx.FRAMEBUFFER,
    ctx.COLOR_ATTACHMENT0,
    ctx.RENDERBUFFER,
    renderBuffer2
  );
  ctx.finish();
};
var read = (gl, config) => {
  const mergedConfig = mergeProps(
    {
      format: "RGBA",
      dataType: "UNSIGNED_BYTE",
      internalFormat: "RGBA8",
      width: gl.canvas.width,
      height: gl.canvas.height
    },
    config
  );
  if (!objectsAreEqual(mergedConfig, gl.cache.previousReadConfig)) {
    gl.cache.previousReadConfig = mergedConfig;
    renderBuffer(gl, mergedConfig);
  }
  clear(gl);
  gl.render();
  gl.ctx.readPixels(
    0,
    0,
    mergedConfig.width,
    mergedConfig.height,
    gl.ctx[mergedConfig.format],
    gl.ctx[mergedConfig.dataType],
    mergedConfig.output
  );
  return mergedConfig.output;
};
var IS_PROGRAM = Symbol("is-program");
var createProgram = (config) => {
  const gl = config.canvas.getContext("webgl2");
  if (!gl)
    throw "webgl2 is not supported";
  const cachedProgram = config.cacheEnabled && getProgramCache(config);
  const program = cachedProgram || createWebGLProgram(
    gl,
    config.vertex.source.code,
    config.fragment.source.code
  );
  if (!program)
    throw `error while building program`;
  if (config.cacheEnabled)
    setProgramCache({ ...config, program });
  const queue = /* @__PURE__ */ new Map();
  const addToQueue = (location, fn) => (queue.set(location, fn), () => queue.delete(location));
  const render = () => {
    if (!program || !gl)
      return;
    gl.useProgram(program);
    queue.forEach((fn) => fn());
    config.onRender?.(gl, program);
    gl.drawArrays(gl[config.mode], config.first || 0, config.count);
  };
  config.vertex.bind(gl, program, addToQueue, render);
  config.fragment.bind(gl, program, addToQueue, render);
  return {
    config,
    program,
    render,
    [IS_PROGRAM]: true
  };
};
var isProgramToken = (value) => typeof value === "object" && IS_PROGRAM in value;
var filterProgramTokens = (value) => (typeof value === "object" && Array.isArray(value) ? value : [value]).filter(isProgramToken);
var programCache = /* @__PURE__ */ new WeakMap();
var getProgramCache = (config) => programCache.get(config.vertex.template)?.get(config.fragment.template);
var setProgramCache = (config) => {
  if (!programCache.get(config.vertex.template)) {
    programCache.set(config.vertex.template, /* @__PURE__ */ new WeakMap());
  }
  if (!programCache.get(config.vertex.template).get(config.fragment.template)) {
    programCache.get(config.vertex.template).set(config.fragment.template, config.program);
  }
};
var _tmpl$ = /* @__PURE__ */ template(`<canvas>`);
var glContext = createContext();
var useGL = () => useContext(glContext);
var GL = (props) => {
  const [childrenProps, rest] = splitProps(props, ["children"]);
  const canvas2 = (() => {
    const _el$ = _tmpl$();
    spread(_el$, rest, false, false);
    return _el$;
  })();
  return createComponent(glContext.Provider, {
    get value() {
      return {
        canvas: canvas2,
        gl: canvas2.getContext("webgl2"),
        get onProgramCreate() {
          return props.onProgramCreate;
        }
      };
    },
    get children() {
      return (() => {
        const childs = children(() => childrenProps.children);
        onMount(() => {
          const gl = createGL({
            canvas: canvas2,
            get programs() {
              return filterProgramTokens(childs());
            }
          });
          autosize(gl);
          gl.render();
          if (!gl)
            return;
          const animate = () => {
            if (props.animate)
              requestAnimationFrame(animate);
            gl.render();
          };
          createEffect(() => {
            props.animate ? animate() : createEffect(() => {
              gl.render();
            });
          });
        });
        return canvas2;
      })();
    }
  });
};
var Program = (props) => {
  const context = useGL();
  if (!context)
    throw "context is undefined: make sure <Program/> is sibling of <GL/>";
  return createMemo(() => {
    const vertex = props.vertex();
    const fragment = props.fragment();
    return createProgram({
      canvas: context.canvas,
      fragment,
      vertex,
      mode: props.mode,
      cacheEnabled: !!props.cacheEnabled,
      onRender: props.onRender,
      count: props.count
    });
  });
};
var createToken = (name, config, other) => mergeProps(config, { name }, other);
var bindUniformToken = (token, gl, program, onRender) => {
  const location = gl.getUniformLocation(program, token.name);
  onRender(location, () => {
    gl[token.functionName](location, token.value);
  });
};
var bindAttributeToken = (token, gl, program, onRender) => {
  const target = token.options?.target;
  const buffer = gl.createBuffer();
  const glTarget = target ? gl[target] : gl.ARRAY_BUFFER;
  const location = gl.getAttribLocation(program, token.name);
  onRender(location, () => {
    gl.bindBuffer(glTarget, buffer);
    gl.bufferData(glTarget, token.value, gl.STATIC_DRAW);
    gl.vertexAttribPointer(location, token.size, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location);
  });
};
var bindSampler2DToken = (token, gl, program, effect, render) => {
  effect(() => {
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
    } = mergeProps(
      {
        internalFormat: "RGBA",
        width: 2,
        height: 1,
        border: 0,
        format: "RGBA",
        dataType: "UNSIGNED_BYTE",
        minFilter: "NEAREST",
        magFilter: "NEAREST",
        wrapS: "CLAMP_TO_EDGE",
        wrapT: "CLAMP_TO_EDGE"
      },
      token.options
    );
    gl.useProgram(program);
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + token.textureIndex);
    gl.bindTexture(gl.TEXTURE_2D, texture);
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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[minFilter]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[magFilter]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[wrapS]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[wrapT]);
    gl.uniform1i(gl.getUniformLocation(program, token.name), token.textureIndex);
    render();
  });
};

// src/core/template.ts
var DEBUG = false;
var nameCacheMap = /* @__PURE__ */ new WeakMap();
var textureIndex = 0;
var createGlsl = (effect) => (template, ...holes) => () => {
  const hasNameCache = nameCacheMap.has(template);
  if (!hasNameCache)
    nameCacheMap.set(template, []);
  const nameCache = nameCacheMap.get(template);
  const scopedNames = /* @__PURE__ */ new Map();
  const tokens = holes.map((hole, index) => {
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
      console.error("id was not found for hole:", hole, "with index", index);
    }
    switch (hole.tokenType) {
      case "attribute":
      case "uniform":
        return createToken(name, hole);
      case "isampler2D":
      case "sampler2D":
        return createToken(name, hole, {
          textureIndex: textureIndex++
        });
    }
  }).filter((hole) => hole !== void 0);
  const bind = (gl, program, onRender, render) => {
    gl.useProgram(program);
    tokens.forEach((token) => {
      switch (token.tokenType) {
        case "attribute":
          bindAttributeToken(token, gl, program, onRender);
          break;
        case "sampler2D":
        case "isampler2D":
          bindSampler2DToken(token, gl, program, effect, render);
          break;
        case "shader":
          token.bind(gl, program, onRender, render);
          break;
        case "uniform":
          bindUniformToken(token, gl, program, onRender);
          break;
      }
    });
  };
  return {
    get source() {
      const source = compileStrings(template, tokens);
      DEBUG && console.log("source", source.code);
      return source;
    },
    bind,
    tokenType: "shader",
    template
  };
};
var glsl = createGlsl(createEffect);

// src/solid/createComputation.ts
var canvas = document.createElement("canvas");
var createComputation = (input, callback, config) => {
  let output;
  let bufferType = input().constructor;
  const getConfig = () => mergeProps(
    {
      internalFormat: "R32F",
      format: "RED",
      width: input().length,
      height: 1,
      dataType: "FLOAT",
      output
    },
    getTextureConfigFromTypedArray(input()),
    config
  );
  const a_vertices = attribute.vec2(
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])
  );
  const vertex = glsl`#version 300 es
void main(){gl_Position = vec4(${a_vertices}, 0.0, 1.0);}`;
  const fragment = glsl`#version 300 es
precision highp float;
out vec4 outColor;
vec4 compute(){${callback(uniform.sampler2D(input, getConfig()))}}
void main(){outColor = compute();}`;
  const program = createProgram({
    canvas,
    vertex: vertex(),
    fragment: fragment(),
    mode: "TRIANGLES",
    count: 4
  });
  const gl = createGL({
    canvas,
    programs: [program]
  });
  const updateOutput = () => {
    if (input().constructor !== output?.constructor) {
      bufferType = input().constructor;
      output = new bufferType(input().length);
    } else if (input().length !== output?.length) {
      output = new bufferType(input().length);
    }
  };
  updateOutput();
  return () => {
    updateOutput();
    gl.render();
    return read(gl, getConfig());
  };
};

export { GL, Program, attribute, autosize, clear, createComputation, createGL, createProgram, filterProgramTokens, glsl, isProgramToken, read, renderBuffer, uniform };
