import { describe, it, expect } from "vitest";
import { screenToImage } from "../coordinates";

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
