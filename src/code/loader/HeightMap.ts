export class HeightMap {
  constructor(
    public width: number,
    public height: number,
    public values: number[]
  ) {}

  at(x: number, y: number) {
    return this.values[y * this.width + x]
  }

  slice(
    startX: number,
    startY: number,
    width: number,
    height: number
  ): HeightMap {
    if (startX + width > this.width) {
      width = this.width - startX
    }
    if (startY + height > this.height) {
      height = this.height - startY
    }

    let result: number[] = []
    for (let y = startY; y < startY + height; y++) {
      result = result.concat(
        this.values.slice(
          startX + this.width * y,
          startX + width + this.width * y
        )
      )
    }

    return new HeightMap(width, height, result)
  }
}
