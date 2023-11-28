import { createComponent, use, spread, template } from 'solid-js/web';
import { createContext, splitProps, createSignal, children, onMount, createEffect, batch, useContext, mergeProps, on } from 'solid-js';
import zeptoid2 from 'zeptoid';

// src/core/webgl.ts
var dataTypeToFunctionName = (dataType) => {
  switch (dataType) {
    case "float":
      return "uniform1f";
    case "int":
      return "uniform1i";
    case "bool":
      return "uniform1i";
    default:
      return "uniform" + dataType[dataType.length - 1] + (dataType[0] === "b" ? "b" : dataType[0] === "i" ? "i" : "f") + "v";
  }
};
var resolveToken = (token) => {
  switch (token.tokenType) {
    case "shader":
      return token.source;
    case "attribute":
      return `in ${token.dataType} ${token.name};`;
    case "uniform":
      return `uniform ${token.dataType} ${token.name};`;
  }
};
var compileStrings = (strings, variables) => {
  const source = [
    ...strings.flatMap((string, index) => {
      const variable = variables[index];
      if (!variable)
        return string;
      return "name" in variable ? [string, variable.name] : string;
    })
  ].join("");
  const precision = source.match(/precision.*;/)?.[0];
  if (precision) {
    const [pre2, after2] = source.split(/precision.*;/);
    return [
      pre2,
      precision,
      variables.flatMap((variable) => resolveToken(variable)).join("\n"),
      after2
    ].join("\n");
  }
  const version = source.match(/#version.*/)?.[0];
  const [pre, after] = source.split(/#version.*/);
  return [
    version,
    variables.flatMap((variable) => resolveToken(variable)).join("\n"),
    after || pre
  ].join("\n");
};
function createProgram(gl, vertex, fragment) {
  const program = gl.createProgram();
  var vertexShader = createShader(gl, vertex, gl.VERTEX_SHADER);
  var fragmentShader = createShader(gl, fragment, gl.FRAGMENT_SHADER);
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
function createShader(gl, src, type) {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error(`error while creating shader`);
    return null;
  }
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      type == gl.VERTEX_SHADER ? "VERTEX" : `FRAGMENT SHADER:
 ${gl.getShaderInfoLog(shader)}`
    );
    return null;
  }
  return shader;
}

// src/core/proxies.ts
var uniform = new Proxy({}, {
  get(target, dataType) {
    return (...[value, options]) => ({
      dataType,
      functionName: dataTypeToFunctionName(dataType),
      tokenType: dataType === "sampler2D" ? "sampler2D" : "uniform",
      get value() {
        return value();
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
        tokenType: "attribute",
        size: size && !isNaN(size) ? size : 1,
        get value() {
          return value();
        },
        options
      };
    };
  }
});
var _tmpl$ = /* @__PURE__ */ template(`<canvas>`);
var glContext = createContext();
var useGL = () => useContext(glContext);
var GL = (props) => {
  const [childrenProps, rest] = splitProps(props, ["children"]);
  const [canvas, setCanvas] = createSignal();
  return createComponent(glContext.Provider, {
    value: {
      get gl() {
        return canvas()?.getContext("webgl2");
      }
    },
    get children() {
      return (() => {
        const memoChildren = children(() => childrenProps.children);
        onMount(() => {
          const _canvas = canvas();
          if (!_canvas)
            return;
          const gl = _canvas.getContext("webgl2");
          if (!gl) {
            console.error("webgl2 is not supported");
            return;
          }
          const resizeObserver = new ResizeObserver(() => {
            _canvas.width = _canvas.clientWidth;
            _canvas.height = _canvas.clientHeight;
            gl.viewport(0, 0, _canvas.width, _canvas.height);
          });
          resizeObserver.observe(_canvas);
        });
        function animate() {
          render();
          requestAnimationFrame(animate);
        }
        function render() {
          const childs = memoChildren();
          if (!childs)
            return;
          if (Array.isArray(childs)) {
            childs.forEach((child) => {
              if (child && typeof child === "object" && "render" in child) {
                child.render();
              }
            });
          } else {
            if (typeof childs === "object" && "render" in childs) {
              childs.render?.();
            }
          }
        }
        createEffect(() => props.animate ? animate() : void 0);
        return (() => {
          const _el$ = _tmpl$();
          use(setCanvas, _el$);
          spread(_el$, rest, false, false);
          return _el$;
        })();
      })();
    }
  });
};
var Program = (props) => {
  const context = useGL();
  const [renderFunction, setRenderFunction] = createSignal();
  const queue = [];
  const onRender = (fn) => {
    queue.push(fn);
    return () => {
      queue.splice(queue.indexOf(fn), 1);
    };
  };
  const renderFactory = (gl, program) => () => {
    if (!program || !gl)
      return;
    gl.useProgram(program);
    queue.forEach((fn) => fn());
    props.onRender?.(gl, program);
    gl.drawArrays(gl[props.mode], 0, 6);
  };
  createEffect(() => {
    if (!context) {
      console.error("context is= undefined: make sure Program is sibling of GL.");
    }
  });
  createEffect(() => {
    const gl = context?.gl;
    if (!gl)
      return;
    const vertex = props.vertex();
    const fragment = props.fragment();
    const program = createProgram(gl, vertex.source, fragment.source);
    if (!program)
      return;
    props.onInit?.(gl, program);
    const render = renderFactory(gl, program);
    batch(() => {
      vertex.bind(gl, program, render, onRender);
      fragment.bind(gl, program, render, onRender);
    });
    setRenderFunction(() => render);
  });
  return {
    get render() {
      return renderFunction();
    }
  };
};
var createToken = (id, config, other) => mergeProps(
  config,
  {
    name: `${config.options?.name || ""}_${id}`
  },
  other
);
var createScopedToken = (scopedVariables, value) => {
  if (!scopedVariables.has(value)) {
    scopedVariables.set(value, {
      name: `${value}_${zeptoid2()}`,
      tokenType: "scope",
      options: {
        name: value
      }
    });
  }
  return scopedVariables.get(value);
};
var bindUniformToken = (token, gl, program, render) => {
  const location = gl.getUniformLocation(program, token.name);
  createEffect(
    on(
      () => token.value,
      () => setTimeout(() => gl[token.functionName](location, token.value), 0)
    )
  );
};
var bindAttributeToken = (token, gl, program, render, onRender) => {
  let { target, mode } = token.options || {};
  const buffer = gl.createBuffer();
  const location = gl.getAttribLocation(program, token.name);
  const glTarget = target ? gl[target] : gl.ARRAY_BUFFER;
  createEffect(() => {
    gl.bindBuffer(glTarget, buffer);
    gl.bufferData(glTarget, token.value, gl.STATIC_DRAW);
    setTimeout(render, 0);
  });
  onRender(() => {
    gl.bindBuffer(glTarget, buffer);
    gl.vertexAttribPointer(location, token.size, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location);
  });
};
var bindSampler2DToken = (sampler2D, gl, program, render) => createEffect(() => {
  const { format, width, height, border, minFilter, magFilter } = sampler2D.options;
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + sampler2D.textureIndex);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    format ? gl[format] : gl.RGBA,
    width || 2,
    height || 1,
    border || 0,
    format ? gl[format] : gl.RGBA,
    gl.UNSIGNED_BYTE,
    sampler2D.value
  );
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    minFilter ? gl[minFilter] : gl.NEAREST
  );
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MAG_FILTER,
    magFilter ? gl[magFilter] : gl.NEAREST
  );
  gl[sampler2D.dataType === "float" ? "uniform1f" : "uniform1i"](
    gl.getUniformLocation(program, sampler2D.name),
    sampler2D.textureIndex
  );
  render();
});

// src/solid/glsl.ts
var DEBUG = false;
var textureIndex = 0;
var glsl = (strings, ...holes) => () => {
  const scopedVariables = /* @__PURE__ */ new Map();
  const tokens = holes.map((hole, index) => {
    if (typeof hole === "function") {
      return hole();
    }
    if (typeof hole === "string") {
      return createScopedToken(scopedVariables, hole);
    }
    switch (hole.tokenType) {
      case "attribute":
      case "uniform":
        return createToken(zeptoid2(), hole);
      case "sampler2D":
        return createToken(zeptoid2(), hole, {
          textureIndex: textureIndex++
        });
    }
  }).filter((hole) => hole !== void 0);
  const source = compileStrings(strings, tokens).split(/\s\s+/g).join("\n");
  DEBUG && console.log("source", source);
  const bind = (gl, program, render, onRender) => {
    tokens.forEach((token) => {
      switch (token.tokenType) {
        case "shader":
          token.bind(gl, program, render, onRender);
          break;
        case "attribute":
          bindAttributeToken(token, gl, program, render, onRender);
          break;
        case "sampler2D":
          bindSampler2DToken(token, gl, program, render);
          break;
        case "uniform":
          bindUniformToken(token, gl, program, render);
          break;
      }
    });
  };
  return { source, bind, tokenType: "shader" };
};

export { GL, Program, attribute, glsl, uniform };
