<template>
  <div class="container">
    <div class="tile">
      <h3>dfglobus</h3>
      <span>Ready to import your maps.</span>
      <span class="space"></span>
      <span class="start-button-row"> </span>
      <span>Controls:</span>
      <span>Left mouse button to rotate the view</span>
      <span>Arrow keys or right mouse button to move</span>
      <span class="space"></span>
      <span>
        Version 0.1.0 |
        <a href="https://github.com/CIB/dfglobus" target="_blank">github</a>
      </span>
    </div>
    <div class="tile">
      <span class="import-row">Select an elevation file. (region*-el.bmp)</span>
      <span class="import-row">
        <input type="file" @change="updateFiles" multiple />
      </span>
      <span class="import-row">
        <progress
          class="progressbar"
          :value="heightmapProgress"
          max="100"
        ></progress>
      </span>
    </div>

    <div class="tile">
      <span class="import-row"
        >Select a texture. (e.g. region*-detail.bmp)</span
      >
      <span class="import-row">
        <input type="file" @change="updateTexture" multiple />
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { HeightMap } from '@/code/loader/HeightMap'
import { worldMap } from '@/code/renderer/WorldMap'
import { chunk, flatten, reverse } from 'lodash'
import { Component, Vue } from 'vue-property-decorator'
import { renderer } from './../code/renderer/Renderer'
import { loadImage } from './../code/util/Image'

@Component
export default class LoadScreen extends Vue {
  private heightmap!: HeightMap
  private texture!: HTMLImageElement
  private heightmapProgress = 0

  async start(): Promise<void> {
    this.$emit('start')
    await new Promise(resolve => setTimeout(resolve, 100))
    await renderer.load()
    worldMap.renderHeightmap(this.heightmap)
  }

  async updateFiles(event: Event): Promise<void> {
    const sleep = (ms: number) =>
      new Promise(resolve => setTimeout(resolve, ms))
    const files = (event.target as HTMLInputElement).files!
    const fileReader = new FileReader()
    this.heightmapProgress = 1
    fileReader.readAsDataURL(files[0])
    const result = await new Promise<string>((resolve, reject) => {
      fileReader.onload = () => resolve(fileReader.result as string)
      fileReader.onerror = reject
    })

    const image = await loadImage(result)
    this.heightmapProgress = 10
    await sleep(10)

    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    context.drawImage(image, 0, 0)
    this.heightmapProgress = 20
    await sleep(10)
    const imgData = context.getImageData(0, 0, image.width, image.height).data

    const progressPerPixel = 80 / (image.width * image.height)
    let rows = []
    const chunks = chunk(imgData, 4)
    for (let i = 0; i < chunks.length; i++) {
      const [r, g, b] = chunks[i]
      if (r || g) {
        rows.push(1.35 * r || g)
      } else {
        rows.push(b)
      }
      if (i % 100000 === 0) {
        this.heightmapProgress += progressPerPixel * 100000
        await sleep(10)
      }
    }
    this.heightmapProgress = 100
    rows = flatten(reverse(chunk(rows, image.width)))

    this.heightmap = new HeightMap(image.width, image.height, rows)

    if (this.texture) {
      this.start()
    }
  }

  async updateTexture(event: Event): Promise<void> {
    const files = (event.target as HTMLInputElement).files!
    const fileReader = new FileReader()
    fileReader.readAsDataURL(files[0])
    const result = await new Promise<string>((resolve, reject) => {
      fileReader.onload = () => resolve(fileReader.result as string)
      fileReader.onerror = reject
    })

    function loadImage(dataUrl: string): Promise<HTMLImageElement> {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = dataUrl
      })
    }
    const image = await loadImage(result)
    renderer.texture = image
    this.texture = image

    if (this.heightmap) {
      this.start()
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

.tile {
  margin: 8px;
  padding: 8px;
  width: 380px;
  height: 200px;
  color: white;
  background-color: rgb(68, 66, 73);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex-grow: 1;
  text-align: start;
}

h3 {
  margin-top: 0px;
  margin-bottom: 8px;
}

.space {
  flex-grow: 1;
}

.import-row {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 8px;
}

.progressbar {
  flex-grow: 1;
  height: 20px;
  opacity: 0.8;
}

a:link {
  color: lightblue;
}

a:visited {
  color: rgb(105, 193, 223);
}

a:active {
  color: rgb(71, 115, 129);
}
</style>
