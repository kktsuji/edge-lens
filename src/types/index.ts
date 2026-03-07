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

export type ToolMode = "navigate" | "roi" | "line-profile";

export interface RoiSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExifData {
  make?: string;
  model?: string;
  lens?: string;
  exposureTime?: number;
  fNumber?: number;
  iso?: number;
  focalLength?: number;
  dateTimeOriginal?: Date;
  software?: string;
  orientation?: number;
  colorSpace?: number;
  hasGps?: boolean;
}
