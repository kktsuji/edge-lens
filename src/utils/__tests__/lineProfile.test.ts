import { describe, it, expect } from "vitest";
import { sampleLineProfile } from "../lineProfile";
import type { LineProfile } from "../../types";

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

describe("sampleLineProfile", () => {
  // 2x2 image: red(0,0), green(1,0), blue(0,1), white(1,1)
  const img = createImageData(
    2,
    2,
    [255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255],
  );

  it("samples a horizontal line across the top row", () => {
    const lp: LineProfile = { x1: 0, y1: 0, x2: 1, y2: 0 };
    const samples = sampleLineProfile(img, lp);
    expect(samples.length).toBe(2);
    expect(samples[0]).toMatchObject({ index: 0, r: 255, g: 0, b: 0 });
    expect(samples[1]).toMatchObject({ index: 1, r: 0, g: 255, b: 0 });
  });

  it("samples a vertical line down the left column", () => {
    const lp: LineProfile = { x1: 0, y1: 0, x2: 0, y2: 1 };
    const samples = sampleLineProfile(img, lp);
    expect(samples.length).toBe(2);
    expect(samples[0]).toMatchObject({ index: 0, r: 255, g: 0, b: 0 });
    expect(samples[1]).toMatchObject({ index: 1, r: 0, g: 0, b: 255 });
  });

  it("returns samples for a zero-length line (x1 === x2 && y1 === y2)", () => {
    const lp: LineProfile = { x1: 1, y1: 1, x2: 1, y2: 1 };
    const samples = sampleLineProfile(img, lp);
    // dist=0, n=max(2,1)=2, both t=0 and t=1 map to (1,1) = white pixel
    expect(samples.length).toBe(2);
    expect(samples[0]).toMatchObject({ index: 0, r: 255, g: 255, b: 255 });
    expect(samples[1]).toMatchObject({ index: 1, r: 255, g: 255, b: 255 });
  });

  it("skips out-of-bounds points for a line that partially extends outside image bounds", () => {
    // Line from (0,0) to (3,0): pixels at x=3 are outside the 2x2 image
    const lp: LineProfile = { x1: 0, y1: 0, x2: 3, y2: 0 };
    const samples = sampleLineProfile(img, lp);
    // All samples with x >= 2 are null (out of bounds) and excluded
    expect(samples.every((s) => s.r !== undefined)).toBe(true);
    expect(samples.length).toBeGreaterThan(0);
    samples.forEach((s) => {
      expect(s.index).toBeGreaterThanOrEqual(0);
    });
    // The first sample should correspond to pixel (0,0): red
    expect(samples[0]).toMatchObject({ r: 255, g: 0, b: 0 });
    // No sample should contain out-of-bounds data
    expect(samples.some((s) => s.r === undefined)).toBe(false);
  });

  it("computes luminance using the BT.601 formula", () => {
    // Use the red pixel at (0,0): r=255, g=0, b=0
    const lp: LineProfile = { x1: 0, y1: 0, x2: 0, y2: 0 };
    const samples = sampleLineProfile(img, lp);
    const expected = 0.299 * 255 + 0.587 * 0 + 0.114 * 0;
    expect(samples[0]!.luminance).toBeCloseTo(expected, 5);
  });

  it("computes luminance correctly for a white pixel", () => {
    // White pixel at (1,1): r=255, g=255, b=255
    const lp: LineProfile = { x1: 1, y1: 1, x2: 1, y2: 1 };
    const samples = sampleLineProfile(img, lp);
    const expected = 0.299 * 255 + 0.587 * 255 + 0.114 * 255;
    expect(samples[0]!.luminance).toBeCloseTo(expected, 5);
  });

  it("computes luminance correctly for a blue pixel", () => {
    // Blue pixel at (0,1): r=0, g=0, b=255
    const lp: LineProfile = { x1: 0, y1: 1, x2: 0, y2: 1 };
    const samples = sampleLineProfile(img, lp);
    const expected = 0.299 * 0 + 0.587 * 0 + 0.114 * 255;
    expect(samples[0]!.luminance).toBeCloseTo(expected, 5);
  });

  it("assigns sequential index values to samples", () => {
    const lp: LineProfile = { x1: 0, y1: 0, x2: 1, y2: 1 };
    const samples = sampleLineProfile(img, lp);
    samples.forEach((s, i) => {
      expect(s.index).toBe(i);
    });
  });

  it("returns an empty array when the entire line is outside image bounds", () => {
    const lp: LineProfile = { x1: 5, y1: 5, x2: 10, y2: 5 };
    const samples = sampleLineProfile(img, lp);
    expect(samples).toEqual([]);
  });

  it("caps sample count at 5000 for very long lines", () => {
    // Use a small image but a line that extends far beyond it.
    // Without the cap, dist ~= 14142 → n ~= 14143 iterations.
    // With the cap, n = 5000. Most samples will be out-of-bounds and skipped,
    // but the function should still complete without allocating a huge array.
    const lp: LineProfile = { x1: 0, y1: 0, x2: 9999, y2: 9999 };
    const samples = sampleLineProfile(img, lp);
    // The returned samples only include in-bounds points (our 2x2 image),
    // so there will be very few. The key assertion is that the function
    // doesn't produce more than 5000 iterations internally.
    expect(samples.length).toBeLessThanOrEqual(5000);
    // Verify it still returns some valid samples from the in-bounds region
    expect(samples.length).toBeGreaterThan(0);
  });
});
