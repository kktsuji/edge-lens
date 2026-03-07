import { describe, it, expect } from "vitest";
import {
  computeChannelStats,
  computeHistogram,
  computeImageStats,
} from "../histogram";

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

function makeBins(entries: [number, number][]): number[] {
  const bins = new Array<number>(256).fill(0);
  for (const [index, count] of entries) bins[index] = count;
  return bins;
}

describe("computeChannelStats", () => {
  it("returns zeros for empty bins", () => {
    const stats = computeChannelStats(new Array<number>(256).fill(0));
    expect(stats).toEqual({ mean: 0, median: 0, stdDev: 0 });
  });

  it("computes correct stats for a single pixel (odd count = 1)", () => {
    const bins = makeBins([[100, 1]]);
    const stats = computeChannelStats(bins);
    expect(stats.mean).toBeCloseTo(100);
    expect(stats.median).toBe(100);
    expect(stats.stdDev).toBeCloseTo(0);
  });

  it("computes correct median for odd count", () => {
    // 3 pixels at values 0, 100, 200 → median is the 2nd element = 100
    const bins = makeBins([
      [0, 1],
      [100, 1],
      [200, 1],
    ]);
    const stats = computeChannelStats(bins);
    expect(stats.mean).toBeCloseTo(100);
    expect(stats.median).toBe(100);
    expect(stats.stdDev).toBeCloseTo(Math.sqrt(20000 / 3));
  });

  it("computes correct median for even count when middles are in different bins", () => {
    // 4 pixels at values 0, 0, 100, 200 → median = (0 + 100) / 2 = 50
    const bins = makeBins([
      [0, 2],
      [100, 1],
      [200, 1],
    ]);
    const stats = computeChannelStats(bins);
    expect(stats.mean).toBeCloseTo(75);
    expect(stats.median).toBe(50);
    expect(stats.stdDev).toBeCloseTo(Math.sqrt(6875));
  });

  it("computes correct median for even count when both middles are in the same bin", () => {
    // 4 pixels all at value 128 → median = 128, stdDev = 0
    const bins = makeBins([[128, 4]]);
    const stats = computeChannelStats(bins);
    expect(stats.mean).toBeCloseTo(128);
    expect(stats.median).toBe(128);
    expect(stats.stdDev).toBeCloseTo(0);
  });

  it("computes correct stdDev for spread values", () => {
    // 2 pixels at 0 and 255 → mean = 127.5, stdDev = 127.5
    const bins = makeBins([
      [0, 1],
      [255, 1],
    ]);
    const stats = computeChannelStats(bins);
    expect(stats.mean).toBeCloseTo(127.5);
    expect(stats.stdDev).toBeCloseTo(127.5);
  });
});

describe("computeImageStats", () => {
  it("returns stats for all four channels", () => {
    const histogramData = {
      red: makeBins([[200, 1]]),
      green: makeBins([[100, 1]]),
      blue: makeBins([[50, 1]]),
      luminance: makeBins([[128, 1]]),
    };
    const stats = computeImageStats(histogramData);
    expect(stats.red.mean).toBeCloseTo(200);
    expect(stats.green.mean).toBeCloseTo(100);
    expect(stats.blue.mean).toBeCloseTo(50);
    expect(stats.luminance.mean).toBeCloseTo(128);
  });

  it("returns zeros for all channels when histogram is empty", () => {
    const histogramData = {
      red: new Array<number>(256).fill(0),
      green: new Array<number>(256).fill(0),
      blue: new Array<number>(256).fill(0),
      luminance: new Array<number>(256).fill(0),
    };
    const stats = computeImageStats(histogramData);
    expect(stats.red).toEqual({ mean: 0, median: 0, stdDev: 0 });
    expect(stats.green).toEqual({ mean: 0, median: 0, stdDev: 0 });
    expect(stats.blue).toEqual({ mean: 0, median: 0, stdDev: 0 });
    expect(stats.luminance).toEqual({ mean: 0, median: 0, stdDev: 0 });
  });
});
