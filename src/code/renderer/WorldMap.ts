import { Map2D } from '../util/Map2D'
import * as THREE from 'three'
import { Mesh, BoxGeometry, MeshBasicMaterial, PlaneGeometry } from 'three'
import {
  buildLandscapeGeometry,
  buildMesh,
  RenderResult,
  ThreeResource,
} from './MeshBuilder'
import { renderer } from './Renderer'
import { HeightMap } from '../loader/HeightMap'
import { getTextureSlice } from '../util/Image'

interface Chunk {
  mesh: THREE.Mesh
  resources: ThreeResource[]
}

const CHUNK_SIZE = 128

export class WorldMap {
  private loadedChunks: Map2D<Chunk> = new Map2D()

  public async renderHeightmap(heightmap: HeightMap): Promise<void> {
    const { mesh, resources } = await this.buildMeshFromHeightmap(
      heightmap,
      renderer.texture!,
      256,
      '#222222'
    )

    mesh.position.z -= 20
    renderer.addMesh(mesh)
    await this.addWorldEdges(0, 0, heightmap.width, heightmap.height)
    renderer.teleport(heightmap.width / 2, heightmap.height / 2)
    await this.renderDetailLevel(heightmap, 1)
    renderer.removeMesh(mesh)
    await this.addWaterPlane(0, 0, heightmap.width, heightmap.height)
  }

  private async addWorldEdges(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): Promise<RenderResult[]> {
    const waterEdge = new PlaneGeometry(endX - startX, 200, 4, 4)
    const waterEdgeMesh = new THREE.Mesh(
      waterEdge,
      new MeshBasicMaterial({
        color: '#222222',
        opacity: 1,
        transparent: true,
        side: THREE.DoubleSide,
      })
    )
    waterEdgeMesh.position.set(endX / 2, 0, -100 + 14.8)
    waterEdgeMesh.rotation.set(Math.PI / 2, 0, 0)
    renderer.addMesh(waterEdgeMesh)

    const waterEdge2 = new PlaneGeometry(endX - startX, 200, 4, 4)
    const waterEdgeMesh2 = new THREE.Mesh(
      waterEdge2,
      new MeshBasicMaterial({
        color: '#222222',
        opacity: 1,
        transparent: false,
        side: THREE.DoubleSide,
      })
    )
    waterEdgeMesh2.position.set(endX / 2, endY, -100 + 14.8)
    waterEdgeMesh2.rotation.set(Math.PI / 2, 0, 0)
    renderer.addMesh(waterEdgeMesh2)

    const waterEdge3 = new PlaneGeometry(endY - startY, 200, 4, 4)
    const waterEdgeMesh3 = new THREE.Mesh(
      waterEdge3,
      new MeshBasicMaterial({
        color: '#222222',
        opacity: 1,
        transparent: false,
        side: THREE.DoubleSide,
      })
    )
    waterEdgeMesh3.position.set(0, endY / 2, -100 + 14.8)
    waterEdgeMesh3.rotation.set(Math.PI / 2, Math.PI / 2, 0)
    renderer.addMesh(waterEdgeMesh3)

    const waterEdge4 = new PlaneGeometry(endY - startY, 200, 4, 4)
    const waterEdgeMesh4 = new THREE.Mesh(
      waterEdge4,
      new MeshBasicMaterial({
        color: '#222222',
        opacity: 1,
        transparent: false,
        side: THREE.DoubleSide,
      })
    )
    waterEdgeMesh4.position.set(endX, endY / 2, -100 + 14.8)
    waterEdgeMesh4.rotation.set(Math.PI / 2, Math.PI / 2, 0)
    renderer.addMesh(waterEdgeMesh4)

    return [
      { mesh: waterEdgeMesh, resources: [waterEdge] },
      { mesh: waterEdgeMesh2, resources: [waterEdge2] },
    ]
  }

  private async addWaterPlane(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): Promise<void> {
    // Generally this works, but there are still issues with oscillation when
    // the camera is too far away from the water surface. To avoid this issue,
    // the near plane for camera projection has to be set to a higher value.
    const water = new PlaneGeometry(endX - startX, endY - startY, 4, 4)
    const waterMesh = new THREE.Mesh(
      water,
      new MeshBasicMaterial({
        color: '#0000ff',
        opacity: 0.5,
        transparent: true,
        side: THREE.DoubleSide,
      })
    )
    waterMesh.position.set(endX / 2, endY / 2, 14.8)
    renderer.addMesh(waterMesh)
  }

  private async buildMeshFromHeightmap(
    heightmap: HeightMap,
    image: HTMLImageElement,
    detail: number,
    color?: string
  ): Promise<RenderResult> {
    const texture = new THREE.Texture(image)

    texture.needsUpdate = true
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.NearestFilter

    const geometryData = buildLandscapeGeometry(heightmap, detail)

    return buildMesh(geometryData, texture, color)
  }

  public async renderDetailLevel(heightmap: HeightMap, level: number) {
    for (let x = 0; x < heightmap.width / CHUNK_SIZE; x++) {
      for (let y = 0; y < heightmap.height / CHUNK_SIZE; y++) {
        const loadedChunk = this.loadedChunks.get(x, y)

        let submap = heightmap.slice(
          x * CHUNK_SIZE,
          y * CHUNK_SIZE,
          CHUNK_SIZE + 1,
          CHUNK_SIZE + 1
        )

        const width = Math.min(CHUNK_SIZE, heightmap.width - x * CHUNK_SIZE)
        const height = Math.min(CHUNK_SIZE, heightmap.height - y * CHUNK_SIZE)
        const subTexture = await getTextureSlice(renderer.texture!, {
          startX:
            ((x * CHUNK_SIZE + 1) * renderer.texture!.width) / heightmap.width,
          startY:
            ((y * CHUNK_SIZE + 1) * renderer.texture!.height) /
            heightmap.height,
          width: (width * renderer.texture!.width) / heightmap.width,
          height: (height * renderer.texture!.height) / heightmap.height,
        })
        const { mesh, resources } = await this.buildMeshFromHeightmap(
          submap,
          subTexture,
          level
        )
        mesh.position.x = x * CHUNK_SIZE
        mesh.position.y = y * CHUNK_SIZE

        renderer.addMesh(mesh)
        if (loadedChunk) {
          renderer.removeMesh(loadedChunk.mesh)
          for (let resource of loadedChunk.resources) {
            resource.dispose()
          }
        }
        this.loadedChunks.put(x, y, { mesh, resources })
        await new Promise(resolve => setTimeout(resolve, level < 16 ? 100 : 2))
      }
    }
  }
}

export const worldMap = new WorldMap()
