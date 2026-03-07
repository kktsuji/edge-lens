export interface ImageState {
  file: File | null;
  name: string;
  width: number;
  height: number;
  imageData: ImageData | null;
  imageBitmap: ImageBitmap | null;
}

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface PixelInfo {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface HistogramData {
  red: number[];
  green: number[];
  blue: number[];
  luminance: number[];
}

export interface ChannelStats {
  mean: number;
  median: number;
  stdDev: number;
}

export interface ImageStats {
  red: ChannelStats;
  green: ChannelStats;
  blue: ChannelStats;
  luminance: ChannelStats;
}
