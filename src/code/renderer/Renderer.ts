import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import _ from 'lodash'

export interface RenderInfo {
  triangles: number
  frameDuration: number
}

export class Renderer {
  private canvas: HTMLCanvasElement = null as any
  private renderer: THREE.WebGLRenderer = null as any
  private camera: THREE.PerspectiveCamera = null as any
  private controls: OrbitControls = null as any
  private scene: THREE.Scene = null as any
  private renderRequested: undefined | true
  public texture: HTMLImageElement | undefined

  public attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas
  }

  public async load(): Promise<void> {
    const canvas = this.canvas
    const renderer = (this.renderer = new THREE.WebGLRenderer({ canvas }))
    renderer.setPixelRatio(2)

    const fov = 75
    const aspect = 1
    const near = 5
    const far = 10000
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
    this.camera = camera
    camera.up.set(0, 0, 1)

    const controls = (this.controls = new OrbitControls(camera, canvas))
    controls.enableDamping = true
    controls.keyPanSpeed = 50
    controls.dampingFactor = 0.3
    controls.maxPolarAngle = Math.PI / 2
    controls.update()

    const scene = (this.scene = new THREE.Scene())
    scene.background = new THREE.Color('lightblue')

    function addLight(x: number, y: number, z: number): void {
      const color = 0xffffff
      const intensity = 1
      const light = new THREE.DirectionalLight(color, intensity)
      light.position.set(x, y, z)
      scene.add(light)
    }
    addLight(-1, 2, 4)
    addLight(1, -1, -2)

    this.teleport(0, 0)
    this.render()

    controls.addEventListener('change', () =>
      this.requestRenderIfNotRequested()
    )
  }

  private resizeRendererToDisplaySize(renderer: THREE.Renderer): boolean {
    const canvas = renderer.domElement
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const needResize = canvas.width !== width || canvas.height !== height
    if (needResize) {
      renderer.setSize(width, height, false)
    }
    return needResize
  }

  private async render(): Promise<void> {
    this.renderRequested = undefined

    if (this.resizeRendererToDisplaySize(this.renderer)) {
      const canvas = this.renderer.domElement
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight
      this.camera.updateProjectionMatrix()
    }

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  private requestRenderIfNotRequested(): void {
    if (!this.renderRequested) {
      this.renderRequested = true
      requestAnimationFrame(() => this.render())
    }
  }

  public getPosition(): { x: number; y: number; z: number } {
    return {
      x: this.controls.target.x,
      y: -this.controls.target.y,
      z: this.controls.target.z,
    }
  }

  public setPosition(x: number, y: number, z: number): void {
    this.controls.target.x = x
    this.controls.target.y = -y
    this.controls.target.z = z
    this.requestRenderIfNotRequested()
  }

  public moveZ(z: number): void {
    this.controls.target.z += z
    this.camera.position.z += z
    this.requestRenderIfNotRequested()
  }

  public teleport(x: number, y: number): void {
    this.controls.target.x = x
    this.controls.target.y = y
    this.controls.target.z = 20
    this.camera.position.x = x / 2
    this.camera.position.y = -y / 4
    this.camera.position.z = x / 4
    this.requestRenderIfNotRequested()
  }

  public addMesh(mesh: THREE.Mesh): void {
    this.scene.add(mesh)
    this.requestRenderIfNotRequested()
  }

  public removeMesh(mesh: THREE.Mesh): void {
    this.scene.remove(mesh)
    this.requestRenderIfNotRequested()
  }
}

export const renderer = new Renderer()
