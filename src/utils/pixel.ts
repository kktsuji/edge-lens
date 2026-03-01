import type { PixelInfo } from "../types";

export function getPixelAt(
  imageData: ImageData,
  x: number,
  y: number,
): PixelInfo | null {
  if (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) {
    return null;
  }

  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const index = (iy * imageData.width + ix) * 4;

  return {
    x: ix,
    y: iy,
    r: imageData.data[index]!,
    g: imageData.data[index + 1]!,
    b: imageData.data[index + 2]!,
    a: imageData.data[index + 3]!,
  };
}
