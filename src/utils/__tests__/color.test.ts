import { describe, expect, it } from "vitest";
import { luminance } from "../color";

describe("luminance", () => {
  it("computes BT.601 luminance for pure red", () => {
    expect(luminance(255, 0, 0)).toBeCloseTo(0.299 * 255, 5);
  });

  it("computes BT.601 luminance for pure green", () => {
    expect(luminance(0, 255, 0)).toBeCloseTo(0.587 * 255, 5);
  });

  it("computes BT.601 luminance for pure blue", () => {
    expect(luminance(0, 0, 255)).toBeCloseTo(0.114 * 255, 5);
  });

  it("computes BT.601 luminance for white", () => {
    expect(luminance(255, 255, 255)).toBeCloseTo(255, 5);
  });

  it("computes BT.601 luminance for black", () => {
    expect(luminance(0, 0, 0)).toBe(0);
  });
});
