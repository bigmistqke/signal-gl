import { createMemo, createResource } from 'solid-js'

export const loadOBJ = (url: string) => {
  const [resource] = createResource(() => fetch(url).then((v) => v.text()))
  const obj = createMemo(() => {
    const data = resource()
    if (!data) return undefined
    const result: { vertices: any[]; indices: any[] } = {
      vertices: [],
      indices: [],
    }
    data.split('\n').forEach((line) => {
      const [prefix, ..._data] = line.split(' ')
      const data = _data.map((v) => +v)
      switch (prefix) {
        case 'v':
          return result.vertices.push(...data)
        case 'f':
          return result.indices.push(...data.map((v) => v - 1))
      }
    })
    return {
      vertices: new Float32Array(result.vertices),
      indices: result.indices,
    }
  })

  return obj
}
