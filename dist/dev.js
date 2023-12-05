import { createContext, createEffect, mergeProps, splitProps, children, onMount, createMemo, useContext } from 'solid-js';
import zeptoid from 'zeptoid';
import { spread, createComponent, template } from 'solid-js/web';

// src/core/hooks.ts

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
var createToken = (name, config, other) => mergeProps(config, { name }, other);
var bindUniformToken = (token, gl, program, onRender, effect) => {
  const location = gl.getUniformLocation(program, token.name);
  onRender(
    token.name,
    () => gl[token.functionName](location, token.value)
  );
};
var bindAttributeToken = (token, gl, program, onRender, effect) => {
  const buffer = gl.createBuffer();
  const location = gl.getAttribLocation(program, token.name);
  const glTarget = () => gl[token.options?.target || "ARRAY_BUFFER"];
  onRender(token.name, () => {
    token.value;
    gl.bindBuffer(glTarget(), buffer);
    gl.vertexAttribPointer(location, token.size, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location);
  });
  effect(() => {
    gl.bindBuffer(glTarget(), buffer);
    gl.bufferData(glTarget(), token.value, gl.STATIC_DRAW);
  });
};
var bindSampler2DToken = (token, gl, program, onRender, effect) => {
  const texture = gl.createTexture();
  const options = mergeProps(
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
  onRender(token.name, () => {
    token.value;
    gl.bindTexture(gl.TEXTURE_2D, texture);
  });
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
    } = options;
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
  });
};

// src/core/template.ts
var DEBUG = false;
var nameCacheMap = /* @__PURE__ */ new WeakMap();
var textureIndex = 0;
var glsl = function(template, ...holes) {
  return () => {
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
            bindAttributeToken(token, gl, program, onRender, glsl.effect);
            break;
          case "sampler2D":
          case "isampler2D":
            bindSampler2DToken(token, gl, program, onRender, glsl.effect);
            break;
          case "shader":
            token.bind(gl, program, onRender, render);
            break;
          case "uniform":
            bindUniformToken(token, gl, program, onRender, glsl.effect);
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
};
glsl.effect = (cb) => {
};
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

// src/core/hooks.ts
var createStack = (config) => {
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
    render: () => config.programs.forEach((program) => program.render())
  };
};
var IS_PROGRAM = Symbol("is-program");
var createProgram = (config) => {
  const ctx = config.canvas.getContext("webgl2");
  if (!ctx)
    throw "webgl2 is not supported";
  const cachedProgram = config.cacheEnabled && getProgramCache(config);
  const program = cachedProgram || createWebGLProgram(
    ctx,
    config.vertex.source.code,
    config.fragment.source.code
  );
  if (!program)
    throw `error while building program`;
  if (config.cacheEnabled)
    setProgramCache({ ...config, program });
  const updateQueue = /* @__PURE__ */ new Map();
  const addToUpdateQueue = (location, fn) => (updateQueue.set(location, fn), () => updateQueue.delete(location));
  const render = () => {
    ctx.useProgram(program);
    updateQueue.forEach((update) => update());
    config.onRender?.(ctx, program);
    ctx.drawArrays(ctx[config.mode], config.first || 0, config.count);
  };
  config.vertex.bind(ctx, program, addToUpdateQueue, render);
  config.fragment.bind(ctx, program, addToUpdateQueue, render);
  return {
    ...config,
    program,
    ctx,
    render,
    [IS_PROGRAM]: true
  };
};
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
var isProgramToken = (value) => typeof value === "object" && IS_PROGRAM in value;
var filterProgramTokens = (value) => (typeof value === "object" && Array.isArray(value) ? value : [value]).filter(isProgramToken);
var autosize = ({
  canvas,
  ctx,
  render
}) => {
  const resizeObserver = new ResizeObserver(() => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.viewport(0, 0, canvas.width, canvas.height);
    render();
  });
  resizeObserver.observe(canvas);
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
var readCache = /* @__PURE__ */ new WeakMap();
var read = (token, config) => {
  const mergedConfig = mergeProps(
    {
      format: "RGBA",
      dataType: "UNSIGNED_BYTE",
      internalFormat: "RGBA8",
      width: token.canvas.width,
      height: token.canvas.height
    },
    config
  );
  if (!readCache.get(token.ctx) || !objectsAreEqual(mergedConfig, readCache.get(token.ctx))) {
    readCache.set(token.ctx, mergedConfig);
    renderBuffer(token, mergedConfig);
  }
  clear(token);
  token.render();
  token.ctx.readPixels(
    0,
    0,
    mergedConfig.width,
    mergedConfig.height,
    token.ctx[mergedConfig.format],
    token.ctx[mergedConfig.dataType],
    mergedConfig.output
  );
  return mergedConfig.output;
};
var computationCanvas = document.createElement("canvas");
var createComputation = function(input, callback, config) {
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
precision highp float; out vec4 outColor; vec4 compute(){${callback(
    uniform.sampler2D(input, getConfig())
  )}} void main(){outColor = compute();}`;
  const program = createProgram({
    canvas: computationCanvas,
    vertex: vertex(),
    fragment: fragment(),
    mode: "TRIANGLES",
    count: 4
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
    clear(program);
    program.render();
    return read(program, getConfig());
  };
};
var _tmpl$ = /* @__PURE__ */ template(`<canvas>`);
var glContext = createContext();
var useGL = () => useContext(glContext);
var Stack = (props) => {
  const [childrenProps, rest] = splitProps(props, ["children"]);
  const canvas = (() => {
    const _el$ = _tmpl$();
    spread(_el$, rest, false, false);
    return _el$;
  })();
  return createComponent(glContext.Provider, {
    get value() {
      return {
        canvas,
        gl: canvas.getContext("webgl2"),
        get onProgramCreate() {
          return props.onProgramCreate;
        }
      };
    },
    get children() {
      return (() => {
        const childs = children(() => childrenProps.children);
        onMount(() => {
          try {
            const stack = createStack({
              canvas,
              get programs() {
                return filterProgramTokens(childs());
              }
            });
            autosize(stack);
            stack.render();
            const render = () => {
              if (props.clear) {
                if (typeof props.clear === "function")
                  props.clear(stack);
                else
                  clear(stack);
              }
              stack.render();
            };
            const animate = () => {
              if (props.animate)
                requestAnimationFrame(animate);
              render();
            };
            createEffect(() => props.animate ? animate() : createEffect(render));
          } catch (error2) {
            console.error(error2);
          }
        });
        return canvas;
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
glsl.effect = createEffect;

export { Program, Stack, attribute, autosize, clear, createComputation, createProgram, createStack, filterProgramTokens, glsl, isProgramToken, read, renderBuffer, uniform };
