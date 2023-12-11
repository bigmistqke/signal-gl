import { mat4 } from 'gl-matrix'
import { createEffect, onCleanup } from 'solid-js'
import { render } from 'solid-js/web'

function RotatingCube() {
  let canvasRef

  onCleanup(() => {
    const canvas = canvasRef
    const gl = canvas.getContext('webgl')

    if (gl) {
      gl.deleteBuffer(vertexBuffer)
      gl.deleteProgram(shaderProgram)
    }
  })

  createEffect(() => {
    const canvas = canvasRef
    const gl = canvas.getContext('webgl')

    if (!gl) {
      console.error(
        'Unable to initialize WebGL. Your browser may not support it.'
      )
      return
    }

    // Define vertices for a cube with corrected normals
    const vertices = new Float32Array([
      // Front face
      -0.5,
      -0.5,
      0.5,
      1.0,
      0.0,
      0.0, // Vertex 1
      0.5,
      -0.5,
      0.5,
      0.0,
      1.0,
      0.0, // Vertex 2
      0.5,
      0.5,
      0.5,
      0.0,
      0.0,
      1.0, // Vertex 3

      -0.5,
      -0.5,
      0.5,
      1.0,
      0.0,
      0.0, // Vertex 1
      0.5,
      0.5,
      0.5,
      0.0,
      0.0,
      1.0, // Vertex 3
      -0.5,
      0.5,
      0.5,
      1.0,
      1.0,
      0.0, // Vertex 4

      // Back face
      -0.5,
      -0.5,
      -0.5,
      1.0,
      0.0,
      0.0, // Vertex 5
      0.5,
      -0.5,
      -0.5,
      0.0,
      1.0,
      0.0, // Vertex 6
      0.5,
      0.5,
      -0.5,
      0.0,
      0.0,
      1.0, // Vertex 7

      -0.5,
      -0.5,
      -0.5,
      1.0,
      0.0,
      0.0, // Vertex 5
      0.5,
      0.5,
      -0.5,
      0.0,
      0.0,
      1.0, // Vertex 7
      -0.5,
      0.5,
      -0.5,
      1.0,
      1.0,
      0.0, // Vertex 8

      // Top face
      -0.5,
      0.5,
      -0.5,
      1.0,
      1.0,
      0.0, // Vertex 8
      0.5,
      0.5,
      -0.5,
      0.0,
      0.0,
      1.0, // Vertex 7
      0.5,
      0.5,
      0.5,
      0.0,
      1.0,
      0.0, // Vertex 3

      -0.5,
      0.5,
      -0.5,
      1.0,
      1.0,
      0.0, // Vertex 8
      0.5,
      0.5,
      0.5,
      0.0,
      1.0,
      0.0, // Vertex 3
      -0.5,
      0.5,
      0.5,
      1.0,
      0.0,
      0.0, // Vertex 4

      // Bottom face
      -0.5,
      -0.5,
      -0.5,
      1.0,
      0.0,
      0.0, // Vertex 5
      0.5,
      -0.5,
      -0.5,
      0.0,
      1.0,
      0.0, // Vertex 6
      0.5,
      -0.5,
      0.5,
      0.0,
      0.0,
      1.0, // Vertex 2

      -0.5,
      -0.5,
      -0.5,
      1.0,
      0.0,
      0.0, // Vertex 5
      0.5,
      -0.5,
      0.5,
      0.0,
      0.0,
      1.0, // Vertex 2
      -0.5,
      -0.5,
      0.5,
      1.0,
      1.0,
      0.0, // Vertex 1

      // Right face
      0.5,
      -0.5,
      -0.5,
      0.0,
      1.0,
      0.0, // Vertex 6
      0.5,
      0.5,
      -0.5,
      0.0,
      0.0,
      1.0, // Vertex 7
      0.5,
      0.5,
      0.5,
      1.0,
      1.0,
      0.0, // Vertex 3

      0.5,
      -0.5,
      -0.5,
      0.0,
      1.0,
      0.0, // Vertex 6
      0.5,
      0.5,
      0.5,
      1.0,
      1.0,
      0.0, // Vertex 3
      0.5,
      -0.5,
      0.5,
      1.0,
      0.0,
      0.0, // Vertex 2

      // Left face
      -0.5,
      -0.5,
      -0.5,
      0.0,
      1.0,
      0.0, // Vertex 5
      -0.5,
      0.5,
      -0.5,
      0.0,
      0.0,
      1.0, // Vertex 8
      -0.5,
      0.5,
      0.5,
      1.0,
      1.0,
      0.0, // Vertex 4

      -0.5,
      -0.5,
      -0.5,
      0.0,
      1.0,
      0.0, // Vertex 5
      -0.5,
      0.5,
      0.5,
      1.0,
      1.0,
      0.0, // Vertex 4
      -0.5,
      -0.5,
      0.5,
      1.0,
      0.0,
      0.0, // Vertex 1
    ])

    // Create a buffer and put the vertices in it
    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    // Vertex shader program
    const vsSource = `
      attribute vec4 aVertexPosition;
      attribute vec3 aVertexColor;
      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;
      varying vec3 vColor;
      void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vColor = aVertexColor;
      }
    `

    // Fragment shader program
    const fsSource = `
      precision mediump float;
      varying vec3 vColor;
      void main(void) {
        gl_FragColor = vec4(vColor, 1.0);
      }
    `

    // Compile shaders, link program, and use it
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource)
    gl.useProgram(shaderProgram)

    // Set up attributes and uniforms
    const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
      },
      uniformLocations: {
        modelViewMatrix: gl.getUniformLocation(
          shaderProgram,
          'uModelViewMatrix'
        ),
        projectionMatrix: gl.getUniformLocation(
          shaderProgram,
          'uProjectionMatrix'
        ),
      },
    }

    // Set up perspective matrix
    const projectionMatrix = mat4.create()
    mat4.perspective(
      projectionMatrix,
      Math.PI / 4,
      canvas.width / canvas.height,
      0.1,
      100.0
    )

    // Set up model-view matrix
    const modelViewMatrix = mat4.create()

    // Set up rotation angle
    let rotation = 0

    function render() {
      gl.clearColor(0.0, 0.0, 0.0, 1.0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.enable(gl.DEPTH_TEST)

      // Update model-view matrix with rotation
      mat4.identity(modelViewMatrix)
      mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -5.0])
      mat4.rotateY(modelViewMatrix, modelViewMatrix, rotation)
      mat4.rotateX(modelViewMatrix, modelViewMatrix, rotation)

      // Set the attributes
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
      gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        3, // size
        gl.FLOAT, // type
        false, // normalize
        24, // stride
        0 // offset for position
      )
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)

      gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        3, // size
        gl.FLOAT, // type
        false, // normalize
        24, // stride
        12 // offset for color
      )
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor)

      // Set the uniforms
      gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix
      )
      gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix
      )

      // Draw the cube using gl.TRIANGLES
      gl.drawArrays(gl.TRIANGLES, 0, 36) // 36 vertices for 12 triangles

      rotation += 0.01

      requestAnimationFrame(render)
    }

    render()

    // Clean up resources on component unmount
    onCleanup(() => {
      gl.deleteBuffer(vertexBuffer)
      gl.deleteProgram(shaderProgram)
    })
  })

  return <canvas ref={canvasRef} width="800" height="600" />
}

// Initialize a shader program
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)

  // Create the shader program
  const shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, vertexShader)
  gl.attachShader(shaderProgram, fragmentShader)
  gl.linkProgram(shaderProgram)

  // Check if the shader program linked successfully
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram
      )}`
    )
    return null
  }

  return shaderProgram
}

// Load a shader
function loadShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  // Check if the shader compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`
    )
    gl.deleteShader(shader)
    return null
  }

  return shader
}

render(() => <RotatingCube />, document.getElementById('app')!)
