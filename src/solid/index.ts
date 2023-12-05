export * from '@core/hooks'
export * from '@core/template'
export * from '@core/types'
export * from './components'

/* bind solid's createEffect to glsl.effect */
import { glsl } from '@core/template'
import { createEffect } from 'solid-js'
glsl.effect = createEffect
