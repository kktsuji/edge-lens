import type { ChannelStats, HistogramData, ImageStats } from "../types";

export function computeHistogram(imageData: ImageData): HistogramData {
  const red = new Array<number>(256).fill(0);
  const green = new Array<number>(256).fill(0);
  const blue = new Array<number>(256).fill(0);
  const luminance = new Array<number>(256).fill(0);

  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;

    red[r]!++;
    green[g]!++;
    blue[b]!++;

    // ITU-R BT.601 luminance
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    luminance[lum]!++;
  }

  return { red, green, blue, luminance };
}

export function computeChannelStats(bins: number[]): ChannelStats {
  const totalPixels = bins.reduce((sum, count) => sum + count, 0);
  if (totalPixels === 0) return { mean: 0, median: 0, stdDev: 0 };

  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * bins[i]!;
  const mean = sum / totalPixels;

  let cumulative = 0;
  let median = 0;
  const half = totalPixels / 2;
  for (let i = 0; i < 256; i++) {
    cumulative += bins[i]!;
    if (cumulative >= half) {
      median = i;
      break;
    }
  }

  let variance = 0;
  for (let i = 0; i < 256; i++) variance += (i - mean) ** 2 * bins[i]!;
  const stdDev = Math.sqrt(variance / totalPixels);

  return { mean, median, stdDev };
}

export function computeImageStats(histogramData: HistogramData): ImageStats {
  return {
    red: computeChannelStats(histogramData.red),
    green: computeChannelStats(histogramData.green),
    blue: computeChannelStats(histogramData.blue),
    luminance: computeChannelStats(histogramData.luminance),
  };
}
