export function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * Defines a sub-region of a texture. It is defined by specifying the upper left corner of where the sub-region starts,
 * and specifying the width and height of the sub-region within the complete texture.
 */
export interface Slice {
  startX: number
  startY: number
  width: number
  height: number
}

/** Get a part of an image. */
export function getTextureSlice(
  texture: HTMLImageElement,
  slice: Slice
): Promise<HTMLImageElement> {
  const canvas = document.createElement('canvas')
  canvas.width = slice.width
  canvas.height = slice.height
  const context = canvas.getContext('2d') as CanvasRenderingContext2D
  context.drawImage(
    texture,
    slice.startX,
    texture.height - slice.startY - slice.height,
    slice.width,
    slice.height,
    0,
    0,
    slice.width,
    slice.height
  )

  return loadImage(canvas.toDataURL())
}
