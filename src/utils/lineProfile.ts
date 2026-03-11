import type { LineProfile } from "../types";
import { luminance } from "./color";
import { getPixelAt } from "./pixel";

export interface LineProfileSample {
  index: number;
  r: number;
  g: number;
  b: number;
  luminance: number;
}

export function sampleLineProfile(
  imageData: ImageData,
  lp: LineProfile,
): LineProfileSample[] {
  const { x1, y1, x2, y2 } = lp;
  const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const n = Math.max(2, Math.min(Math.round(dist) + 1, 5000));
  const samples: LineProfileSample[] = [];

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = x1 + t * (x2 - x1);
    const y = y1 + t * (y2 - y1);
    const pixel = getPixelAt(imageData, x, y);
    if (pixel) {
      samples.push({
        index: i,
        r: pixel.r,
        g: pixel.g,
        b: pixel.b,
        luminance: luminance(pixel.r, pixel.g, pixel.b),
      });
    }
  }

  return samples;
}
