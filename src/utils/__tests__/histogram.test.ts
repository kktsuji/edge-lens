import { describe, it, expect } from "vitest";
import { computeHistogram } from "../histogram";

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

describe("computeHistogram", () => {
  it("returns arrays of length 256", () => {
    const img = createImageData(1, 1, [0, 0, 0, 255]);
    const hist = computeHistogram(img);
    expect(hist.red).toHaveLength(256);
    expect(hist.green).toHaveLength(256);
    expect(hist.blue).toHaveLength(256);
    expect(hist.luminance).toHaveLength(256);
  });

  it("counts a single red pixel correctly", () => {
    const img = createImageData(1, 1, [255, 0, 0, 255]);
    const hist = computeHistogram(img);
    expect(hist.red[255]).toBe(1);
    expect(hist.green[0]).toBe(1);
    expect(hist.blue[0]).toBe(1);
    // luminance of pure red: round(0.299 * 255) = 76
    expect(hist.luminance[76]).toBe(1);
  });

  it("counts multiple pixels", () => {
    // 2 red pixels, 1 green pixel
    const img = createImageData(
      3,
      1,
      [255, 0, 0, 255, 255, 0, 0, 255, 0, 255, 0, 255],
    );
    const hist = computeHistogram(img);
    expect(hist.red[255]).toBe(2);
    expect(hist.green[255]).toBe(1);
  });

  it("computes luminance for white correctly", () => {
    const img = createImageData(1, 1, [255, 255, 255, 255]);
    const hist = computeHistogram(img);
    expect(hist.luminance[255]).toBe(1);
  });
});
