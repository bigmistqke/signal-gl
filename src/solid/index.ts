export * from '@core/classes'
export * from '@core/computation'
export * from '@core/hooks'
export * from '@core/template/bindings'
export * from '@core/template/glsl'
export * from '@core/template/tokens'

export * from '@core/types'
export * from './components'

/* bind solid's createEffect to glsl.effect */
import { glsl } from '@core/template/glsl'
import { createEffect } from 'solid-js'
glsl.effect = createEffect
