import { has } from 'lodash'

export class Map2D<T> {
  private map: { [key: string]: T } = {}

  private key(x: number, y: number) {
    return `${x}:${y}`
  }

  has(x: number, y: number): boolean {
    return has(this.map, this.key(x, y))
  }

  get(x: number, y: number): T | undefined {
    return this.map[this.key(x, y)]
  }

  getOr(x: number, y: number, defaultValue: () => T): T {
    const value = this.get(x, y)

    if (value === undefined) {
      return defaultValue()
    } else {
      return value
    }
  }

  put(x: number, y: number, value: T) {
    this.map[this.key(x, y)] = value
  }
}
