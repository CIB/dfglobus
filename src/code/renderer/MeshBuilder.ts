import * as THREE from 'three'
import { HeightMap } from '../loader/HeightMap'

import * as _ from 'lodash'
import { Color, Mesh } from 'three'

export interface ThreeResource {
  dispose(): void
}

export interface GeometryData {
  positions: Float32Array
  normals: Float32Array
  uvs: Float32Array
  indices: number[]
}

export interface RenderResult {
  mesh: Mesh
  resources: ThreeResource[]
}

export const HEIGHT_MULTIPLIER = 0.15

export function buildLandscapeGeometry(
  heightmap: HeightMap,
  detail: number
): GeometryData {
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  let idx = 0

  function buildTriangle(c: number[]): void {
    positions.push(c[0], c[1], heightmap.at(c[0], c[1]) * HEIGHT_MULTIPLIER)
    positions.push(c[2], c[3], heightmap.at(c[2], c[3]) * HEIGHT_MULTIPLIER)
    positions.push(c[4], c[5], heightmap.at(c[4], c[5]) * HEIGHT_MULTIPLIER)

    normals.push(0, 0, 1)
    normals.push(0, 0, 1)
    normals.push(0, 0, 1)
    function transformX(x: number): number {
      return x / heightmap.width
    }
    function transformY(y: number): number {
      return y / heightmap.height
    }
    uvs.push(
      transformX(c[0]),
      transformY(c[1]),
      transformX(c[2]),
      transformY(c[3]),
      transformX(c[4]),
      transformY(c[5])
    )
    indices.push(idx, idx + 1, idx + 2)
    idx += 3
  }

  for (let x = 0; x < heightmap.width - detail; x += detail) {
    for (let y = 0; y < heightmap.height - detail; y += detail) {
      buildTriangle([x, y, x + detail, y, x, y + detail])
      buildTriangle([x + detail, y, x + detail, y + detail, x, y + detail])
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: indices,
  }
}

/**
 * Constructs a mesh from the given voxel definition.
 *
 * @return [mesh, resources] A three.js mesh and a list of resources that
 *                           have to be free'd when the mesh is no longer rendered.
 */
export async function buildMesh(
  { positions, normals, uvs, indices }: GeometryData,
  texture: THREE.Texture,
  color: string | undefined,
  drawWireframe: boolean = false
): Promise<RenderResult> {
  const geometry = new THREE.BufferGeometry()
  const material = new THREE.MeshToonMaterial({
    map: texture,
    side: THREE.DoubleSide,
    alphaTest: 0,
    opacity: 1,
    color: color || '0xffffff',
    transparent: false,
  })

  const positionNumComponents = 3
  const normalNumComponents = 3
  const uvNumComponents = 2
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, positionNumComponents)
  )
  geometry.setAttribute(
    'normal',
    new THREE.BufferAttribute(normals, normalNumComponents)
  )
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, uvNumComponents))
  geometry.setIndex(indices)

  const mesh = new THREE.Mesh(geometry, material)

  if (drawWireframe) {
    const wireFrameGeometry = new THREE.EdgesGeometry(geometry) // or WireframeGeometry
    const wireFrameMaterial = new THREE.LineBasicMaterial({
      color: 0x00000,
      linewidth: 200,
    })
    const wireframe = new THREE.LineSegments(
      wireFrameGeometry,
      wireFrameMaterial
    )
    mesh.add(wireframe)
  }

  return { mesh, resources: [material, texture, geometry] }
}
