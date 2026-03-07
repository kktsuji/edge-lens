import { describe, expect, it } from "vitest";
import { computeInitialViewport } from "../viewport";

describe("computeInitialViewport", () => {
  it("centers a small image at 100% zoom when it fits the container", () => {
    const vp = computeInitialViewport(100, 80, 800, 600);
    expect(vp.zoom).toBe(1);
    expect(vp.panX).toBe((800 - 100) / 2);
    expect(vp.panY).toBe((600 - 80) / 2);
  });

  it("centers an image that exactly matches the container at 100% zoom", () => {
    const vp = computeInitialViewport(800, 600, 800, 600);
    expect(vp.zoom).toBe(1);
    expect(vp.panX).toBe(0);
    expect(vp.panY).toBe(0);
  });

  it("fits a wide image that exceeds container width", () => {
    const vp = computeInitialViewport(1600, 600, 800, 600);
    expect(vp.zoom).toBe(0.5); // limited by width
    expect(vp.panX).toBe(0);
    expect(vp.panY).toBe((600 - 600 * 0.5) / 2);
  });

  it("fits a tall image that exceeds container height", () => {
    const vp = computeInitialViewport(800, 1200, 800, 600);
    expect(vp.zoom).toBe(0.5); // limited by height
    expect(vp.panX).toBe((800 - 800 * 0.5) / 2);
    expect(vp.panY).toBe(0);
  });

  it("fits an image larger in both dimensions, letterboxed correctly", () => {
    // 3200x2400 into 800x600 → zoom = 0.25 (both ratios equal)
    const vp = computeInitialViewport(3200, 2400, 800, 600);
    expect(vp.zoom).toBeCloseTo(0.25);
    expect(vp.panX).toBeCloseTo(0);
    expect(vp.panY).toBeCloseTo(0);
  });

  it("centers when fit zoom leaves horizontal bars", () => {
    // Wide container, tall image → zoom limited by height
    const vp = computeInitialViewport(400, 1200, 800, 600);
    const expectedZoom = Math.min(800 / 400, 600 / 1200); // 0.5
    expect(vp.zoom).toBeCloseTo(expectedZoom);
    expect(vp.panX).toBeCloseTo((800 - 400 * expectedZoom) / 2);
    expect(vp.panY).toBeCloseTo(0);
  });
});
