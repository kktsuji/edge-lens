import { describe, it, expect } from "vitest";
import { getPixelAt } from "../pixel";

function createImageData(
  width: number,
  height: number,
  data: number[],
): ImageData {
  return {
    width,
    height,
    data: new Uint8ClampedArray(data),
    colorSpace: "srgb",
  };
}

describe("getPixelAt", () => {
  // 2x2 image: red, green, blue, white
  const img = createImageData(
    2,
    2,
    [255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255],
  );

  it("returns the correct pixel at (0, 0)", () => {
    const p = getPixelAt(img, 0, 0);
    expect(p).toEqual({ x: 0, y: 0, r: 255, g: 0, b: 0, a: 255 });
  });

  it("returns the correct pixel at (1, 0)", () => {
    const p = getPixelAt(img, 1, 0);
    expect(p).toEqual({ x: 1, y: 0, r: 0, g: 255, b: 0, a: 255 });
  });

  it("returns the correct pixel at (0, 1)", () => {
    const p = getPixelAt(img, 0, 1);
    expect(p).toEqual({ x: 0, y: 1, r: 0, g: 0, b: 255, a: 255 });
  });

  it("returns the correct pixel at (1, 1)", () => {
    const p = getPixelAt(img, 1, 1);
    expect(p).toEqual({ x: 1, y: 1, r: 255, g: 255, b: 255, a: 255 });
  });

  it("floors fractional coordinates", () => {
    const p = getPixelAt(img, 0.7, 0.9);
    expect(p).toEqual({ x: 0, y: 0, r: 255, g: 0, b: 0, a: 255 });
  });

  it("returns null for out-of-bounds negative x", () => {
    expect(getPixelAt(img, -1, 0)).toBeNull();
  });

  it("returns null for out-of-bounds negative y", () => {
    expect(getPixelAt(img, 0, -1)).toBeNull();
  });

  it("returns null for x >= width", () => {
    expect(getPixelAt(img, 2, 0)).toBeNull();
  });

  it("returns null for y >= height", () => {
    expect(getPixelAt(img, 0, 2)).toBeNull();
  });
});
