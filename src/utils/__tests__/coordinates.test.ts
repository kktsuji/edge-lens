import { describe, it, expect } from "vitest";
import { screenToImage, clipLineToRect } from "../coordinates";

describe("screenToImage", () => {
  it("returns identity when zoom=1 and pan=0", () => {
    const result = screenToImage(100, 200, { zoom: 1, panX: 0, panY: 0 });
    expect(result).toEqual({ x: 100, y: 200 });
  });

  it("accounts for pan offset", () => {
    const result = screenToImage(150, 250, { zoom: 1, panX: 50, panY: 50 });
    expect(result).toEqual({ x: 100, y: 200 });
  });

  it("accounts for zoom", () => {
    const result = screenToImage(200, 400, { zoom: 2, panX: 0, panY: 0 });
    expect(result).toEqual({ x: 100, y: 200 });
  });

  it("accounts for both zoom and pan", () => {
    const result = screenToImage(300, 500, { zoom: 2, panX: 100, panY: 100 });
    expect(result).toEqual({ x: 100, y: 200 });
  });
});

describe("clipLineToRect", () => {
  // Rectangle: [0, 0] to [100, 100]
  const xmin = 0;
  const ymin = 0;
  const xmax = 100;
  const ymax = 100;

  it("returns line unchanged when fully inside", () => {
    const result = clipLineToRect(10, 20, 80, 90, xmin, ymin, xmax, ymax);
    expect(result).toEqual({ x1: 10, y1: 20, x2: 80, y2: 90 });
  });

  it("returns null when line is fully outside (left)", () => {
    const result = clipLineToRect(-20, 50, -10, 50, xmin, ymin, xmax, ymax);
    expect(result).toBeNull();
  });

  it("returns null when line is fully outside (above)", () => {
    const result = clipLineToRect(50, -20, 50, -10, xmin, ymin, xmax, ymax);
    expect(result).toBeNull();
  });

  it("returns null when line is fully outside (right)", () => {
    const result = clipLineToRect(110, 50, 120, 50, xmin, ymin, xmax, ymax);
    expect(result).toBeNull();
  });

  it("returns null when line is fully outside (below)", () => {
    const result = clipLineToRect(50, 110, 50, 120, xmin, ymin, xmax, ymax);
    expect(result).toBeNull();
  });

  it("clips line entering from left", () => {
    const result = clipLineToRect(-50, 50, 50, 50, xmin, ymin, xmax, ymax);
    expect(result).toEqual({ x1: 0, y1: 50, x2: 50, y2: 50 });
  });

  it("clips line exiting from right", () => {
    const result = clipLineToRect(50, 50, 150, 50, xmin, ymin, xmax, ymax);
    expect(result).toEqual({ x1: 50, y1: 50, x2: 100, y2: 50 });
  });

  it("clips line entering from top", () => {
    const result = clipLineToRect(50, -50, 50, 50, xmin, ymin, xmax, ymax);
    expect(result).toEqual({ x1: 50, y1: 0, x2: 50, y2: 50 });
  });

  it("clips line exiting from bottom", () => {
    const result = clipLineToRect(50, 50, 50, 150, xmin, ymin, xmax, ymax);
    expect(result).toEqual({ x1: 50, y1: 50, x2: 50, y2: 100 });
  });

  it("clips diagonal through two corners", () => {
    const result = clipLineToRect(-50, -50, 150, 150, xmin, ymin, xmax, ymax);
    expect(result).toEqual({ x1: 0, y1: 0, x2: 100, y2: 100 });
  });

  it("clips diagonal to single corner point", () => {
    // Line from (-50,50) to (50,-50) crosses the rect only at (0,0)
    const result = clipLineToRect(-50, 50, 50, -50, xmin, ymin, xmax, ymax);
    expect(result).toEqual({ x1: 0, y1: 0, x2: 0, y2: 0 });
  });

  it("handles zero-length line inside rect", () => {
    const result = clipLineToRect(50, 50, 50, 50, xmin, ymin, xmax, ymax);
    expect(result).toEqual({ x1: 50, y1: 50, x2: 50, y2: 50 });
  });

  it("returns null for zero-length line outside rect", () => {
    const result = clipLineToRect(-10, -10, -10, -10, xmin, ymin, xmax, ymax);
    expect(result).toBeNull();
  });

  it("handles horizontal axis-aligned line along top edge", () => {
    const result = clipLineToRect(-10, 0, 110, 0, xmin, ymin, xmax, ymax);
    expect(result).toEqual({ x1: 0, y1: 0, x2: 100, y2: 0 });
  });

  it("handles vertical axis-aligned line along left edge", () => {
    const result = clipLineToRect(0, -10, 0, 110, xmin, ymin, xmax, ymax);
    expect(result).toEqual({ x1: 0, y1: 0, x2: 0, y2: 100 });
  });

  it("handles line parallel to and outside the rect", () => {
    // Horizontal line above the rect
    const result = clipLineToRect(0, -5, 100, -5, xmin, ymin, xmax, ymax);
    expect(result).toBeNull();
  });
});
