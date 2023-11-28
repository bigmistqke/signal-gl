import { type Accessor } from 'solid-js'
import zeptoid from 'zeptoid'
import {
  bindAttributeToken,
  bindSampler2DToken,
  bindUniformToken,
  createAttributeToken,
  createSampler2DToken,
  createScopedVariableToken,
  createUniformToken,
} from './tokens'
import { Attribute, ShaderResult, ShaderVariable, Uniform } from './types'
export * from './GL'

const resolveVariable = (variable: ShaderVariable | ShaderResult) =>
  'source' in variable
    ? variable.source
    : variable.options.type === 'attribute'
    ? `in ${variable.type} ${variable.name};`
    : variable.options.type === 'uniform'
    ? `uniform ${variable.type} ${variable.name};`
    : ''

const compileStrings = (
  strings: TemplateStringsArray,
  variables: (ShaderVariable | ShaderResult)[]
) => {
  const source = [
    ...strings.flatMap((string, index) => {
      const variable = variables[index]
      if (!variable) return string
      const name = variable.name
      return name ? [string, name] : string
    }),
  ].join('')

  const precision = source.match(/precision.*;/)?.[0]
  if (precision) {
    const [pre, after] = source.split(/precision.*;/)
    return [
      pre,
      precision,
      variables.flatMap((variable) => resolveVariable(variable)).join('\n'),
      after,
    ].join('\n')
  }
  const version = source.match(/#version.*/)?.[0]
  const [pre, after] = source.split(/#version.*/)
  return [
    version,
    variables.flatMap((variable) => resolveVariable(variable)).join('\n'),
    after || pre,
  ].join('\n')
}

export const glsl =
  (
    strings: TemplateStringsArray,
    // ...values: (ShaderVariable | Accessor<ShaderResult>)[]
    ...values: (
      | ReturnType<
          | (typeof attribute)[keyof typeof attribute]
          | (typeof uniform)[keyof typeof uniform]
        >
      | string
      | Accessor<ShaderResult>
    )[]
  ) =>
  () => {
    // initialize variables
    const scopedVariables = new Map<string, string>()
    const variables = values.map((value, index) => {
      if (typeof value === 'function') return value()

      return typeof value === 'string'
        ? createScopedVariableToken(value, scopedVariables)
        : value.options.type === 'attribute'
        ? createAttributeToken(zeptoid(), value)
        : value.type === 'sampler2D'
        ? createSampler2DToken(zeptoid(), value)
        : createUniformToken(zeptoid(), value)
    })

    // create shader-source
    const source = compileStrings(strings, variables).split(/\s\s+/g).join('\n')
    console.log('source', source)

    const bind = (
      gl: WebGL2RenderingContext,
      program: WebGLProgram,
      render: () => void,
      onRender: (fn: () => void) => void
    ) =>
      variables.forEach((variable) => {
        if ('bind' in variable) {
          variable.bind(gl, program, render, onRender)
          return
        }
        if (variable.options.type === 'attribute') {
          bindAttributeToken(variable, gl, program, render, onRender)
          return
        }
        if ('type' in variable && variable.type === 'sampler2D') {
          bindSampler2DToken(
            variable as ReturnType<typeof createSampler2DToken>,
            gl,
            program,
            render
          )
          return
        }
        if (variable.options.type === 'uniform') {
          bindUniformToken(variable, gl, program, render)
        }
      })

    return { source, bind } as ShaderResult
  }

export const uniform = new Proxy({} as Uniform, {
  get(target, dataType) {
    return (...[value, options]: Parameters<Uniform[keyof Uniform]>) => ({
      value,
      type: dataType,
      options: {
        ...options,
        type: 'uniform',
      },
    })
  },
})

export const attribute = new Proxy({} as Attribute, {
  get(target, dataType) {
    return (...[value, options]: Parameters<Attribute[keyof Attribute]>) => {
      const size =
        typeof dataType === 'string'
          ? +dataType[dataType.length - 1]
          : undefined
      return {
        value,
        type: dataType,
        options: {
          ...options,
          size: size && !isNaN(size) ? size : 1,
          type: 'attribute',
        },
      }
    }
  },
})
