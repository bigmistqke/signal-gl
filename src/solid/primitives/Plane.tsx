import { Accessor, mergeProps } from 'solid-js'
import { ShaderToken, attribute, uniform } from '..'
import { Program } from '../components'
import { glsl } from '../glsl'

const planeVertices = new Float32Array(
  [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0].map(
    (v) => v / 2
  )
)
export const Plane = (props: {
  fragment: Accessor<ShaderToken>
  rotation?: number
  scale?: [number, number]
  position?: [number, number]
  cacheEnabled?: boolean
  mode?: 'TRIANGLES' | 'LINES' | 'POINTS'
}) => {
  const merged = mergeProps(props, {
    scale: [1, 1] as [number, number],
    position: [0, 0] as [number, number],
    rotation: 0,
    mode: 'TRIANGLES' as const,
  })
  const vertex = glsl`#version 300 es
    out vec2 v_coord;  
    out vec3 v_color;
    void main() {
      vec2 a_coord = ${attribute.vec2(planeVertices)};
      float rotation =  ${uniform.float(() => merged.rotation)};
      vec2 scale =  ${uniform.vec2(() => merged.scale)};
      vec2 translation = ${uniform.vec2(() => merged.position)};

      // Scaling
      mat3 scaleMatrix = mat3(
          scale.x, 0, 0,
          0, scale.y, 0,
          0, 0, 1
      );

      // Convert angle to radians
      float angle = radians(rotation);
      float c = cos(angle);
      float s = sin(angle);

      // Rotation
      mat3 rotateMatrix = mat3(
          c, -s, 0,
          s, c, 0,
          0, 0, 1
      );

      // Combine transformations
      mat3 transformMatrix = rotateMatrix * scaleMatrix;

      // Apply the transformation
      a_coord = (transformMatrix * vec3(a_coord, 1.0)).xy;
      v_coord = a_coord + vec2(sin(a_coord[0], 0));
      gl_Position = vec4(a_coord + translation, 1.0, 1.0);
    }`

  return (
    <Program
      cacheEnabled={merged.cacheEnabled}
      fragment={merged.fragment}
      vertex={vertex}
      mode={merged.mode}
    />
  )
}
