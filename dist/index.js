import { use, spread, template } from 'solid-js/web';
import { createEffect, batch, mergeProps } from 'solid-js';
import zeptoid2 from 'zeptoid';

// src/solid/GL.tsx
var _tmpl$ = /* @__PURE__ */ template(`<canvas>`);
var GL = (props) => {
  let canvas;
  createEffect(() => {
    const gl = canvas.getContext("webgl2");
    if (!gl) {
      return;
    }
    const vertex = props.vertex();
    const fragment = props.fragment();
    const currentProgram = createProgram(gl, vertex.source, fragment.source);
    if (!currentProgram)
      return;
    props.onInit?.(gl, currentProgram);
    const resizeObserver = new ResizeObserver(() => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    });
    resizeObserver.observe(canvas);
    function animate() {
      render();
      requestAnimationFrame(animate);
    }
    function render() {
      if (!currentProgram)
        return;
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(currentProgram);
      queue.forEach((fn) => fn());
      props.onRender?.(gl, currentProgram);
    }
    const queue = [];
    const onRender = (fn) => {
      queue.push(fn);
      return () => {
        queue.splice(queue.indexOf(fn), 1);
      };
    };
    batch(() => {
      vertex.bind(gl, currentProgram, render, onRender);
      fragment.bind(gl, currentProgram, render, onRender);
      setTimeout(render, 5);
    });
    if (props.animate)
      animate();
  });
  return (() => {
    const _el$ = _tmpl$();
    const _ref$ = canvas;
    typeof _ref$ === "function" ? use(_ref$, _el$) : canvas = _el$;
    spread(_el$, props, false, false);
    return _el$;
  })();
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
    return null;
  }
  return program;
}
function createShader(gl, src, type) {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return null;
  }
  return shader;
}
var dataTypeToFunctionName = (dataType) => {
  if (dataType === "float")
    return "uniform1f";
  if (dataType === "int")
    return "uniform1i";
  if (dataType === "bool")
    return "uniform1i";
  return "uniform" + dataType[dataType.length - 1] + (dataType[0] === "b" ? "b" : dataType[0] === "i" ? "i" : "f") + "v";
};
var createToken = (id, config, other) => mergeProps(
  config,
  {
    name: `${config.options?.name || ""}_${id}`
  },
  other
);
var createUniformToken = (id, config) => createToken(id, config);
var bindUniformToken = (variable, gl, program, render) => {
  const location = gl.getUniformLocation(program, variable.name);
  createEffect(() => {
    gl[variable.functionName](location, variable.value);
    render();
  });
};
var createAttributeToken = (id, config) => createToken(id, config);
var bindAttributeToken = (token, gl, program, render, onRender) => {
  let { target, size, mode } = token.options;
  const buffer = gl.createBuffer();
  const location = gl.getAttribLocation(program, token.name);
  const glTarget = target ? gl[target] : gl.ARRAY_BUFFER;
  createEffect(() => {
    gl.bindBuffer(glTarget, buffer);
    gl.bufferData(glTarget, token.value, gl.STATIC_DRAW);
    render();
  });
  onRender(() => {
    gl.bindBuffer(glTarget, buffer);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location);
    if (mode)
      gl.drawArrays(gl[mode], 0, 6);
  });
};
var textureIndex = 0;
var createSampler2DToken = (id, config) => createToken(id, config, {
  textureIndex: textureIndex++,
  tokenType: "sampler2D"
});
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
var createScopedVariableToken = (scopedVariables, value) => {
  if (!scopedVariables.has(value)) {
    scopedVariables.set(value, `${value}_${zeptoid2()}`);
  }
  return {
    name: scopedVariables.get(value),
    tokenType: "scope",
    options: {
      name: value
    }
  };
};

// src/solid/glsl.ts
var resolveToken = (token) => "source" in token ? token.source : token.tokenType === "attribute" ? `in ${token.dataType} ${token.name};` : token.tokenType === "uniform" ? `uniform ${token.dataType} ${token.name};` : "";
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
var glsl = (strings, ...holes) => () => {
  const scopedVariables = /* @__PURE__ */ new Map();
  const tokens = holes.map(
    (hole, index) => typeof hole === "function" ? hole() : typeof hole === "string" ? createScopedVariableToken(scopedVariables, hole) : hole.tokenType === "attribute" ? createAttributeToken(zeptoid2(), hole) : hole.dataType === "sampler2D" ? createSampler2DToken(zeptoid2(), hole) : hole.tokenType === "uniform" ? createUniformToken(zeptoid2(), hole) : void 0
  ).filter((hole) => hole !== void 0);
  const source = compileStrings(strings, tokens).split(/\s\s+/g).join("\n");
  const bind = (gl, program, render, onRender) => tokens.forEach((token) => {
    if ("bind" in token) {
      token.bind(gl, program, render, onRender);
      return;
    }
    if (token.tokenType === "attribute") {
      bindAttributeToken(token, gl, program, render, onRender);
      return;
    }
    if ("dataType" in token && token.dataType === "sampler2D") {
      bindSampler2DToken(
        token,
        gl,
        program,
        render
      );
      return;
    }
    if (token.tokenType === "uniform") {
      bindUniformToken(token, gl, program, render);
    }
  });
  return { source, bind };
};
var uniform = new Proxy({}, {
  get(target, dataType) {
    return (...[value, options]) => ({
      get value() {
        return value();
      },
      functionName: dataTypeToFunctionName(dataType),
      dataType,
      tokenType: "uniform",
      options
    });
  }
});
var attribute = new Proxy({}, {
  get(target, dataType) {
    return (...[value, options]) => {
      const size = typeof dataType === "string" ? +dataType[dataType.length - 1] : void 0;
      return {
        get value() {
          return value();
        },
        dataType,
        tokenType: "attribute",
        options: {
          ...options,
          size: size && !isNaN(size) ? size : 1
        }
      };
    };
  }
});

export { GL, attribute, createProgram, glsl, uniform };
