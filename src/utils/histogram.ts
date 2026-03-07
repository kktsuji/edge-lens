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

  if (totalPixels % 2 === 1) {
    // Odd number of pixels: find the middle element (1-based index)
    const target = Math.floor(totalPixels / 2) + 1;
    for (let i = 0; i < 256; i++) {
      cumulative += bins[i]!;
      if (cumulative >= target) {
        median = i;
        break;
      }
    }
  } else {
    // Even number of pixels: average the two middle elements
    const mid1 = totalPixels / 2;
    const mid2 = mid1 + 1;
    let firstMedianBin = -1;
    let secondMedianBin = -1;

    for (let i = 0; i < 256; i++) {
      cumulative += bins[i]!;

      if (firstMedianBin === -1 && cumulative >= mid1) {
        firstMedianBin = i;
      }
      if (cumulative >= mid2) {
        secondMedianBin = i;
        break;
      }
    }

    if (secondMedianBin === -1) {
      // Fallback: all pixels ended up in a single bin
      median = firstMedianBin;
    } else {
      median = (firstMedianBin + secondMedianBin) / 2;
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
