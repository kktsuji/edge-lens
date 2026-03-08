import { describe, it, expect } from "vitest";
import { getTouchDistance, getTouchMidpoint } from "../touchGeometry";

function makeTouch(clientX: number, clientY: number): Touch {
  return { clientX, clientY } as Touch;
}

describe("getTouchDistance", () => {
  it("returns 0 for identical points", () => {
    const t = makeTouch(100, 200);
    expect(getTouchDistance(t, t)).toBe(0);
  });

  it("calculates horizontal distance", () => {
    const t1 = makeTouch(0, 0);
    const t2 = makeTouch(3, 0);
    expect(getTouchDistance(t1, t2)).toBe(3);
  });

  it("calculates vertical distance", () => {
    const t1 = makeTouch(0, 0);
    const t2 = makeTouch(0, 4);
    expect(getTouchDistance(t1, t2)).toBe(4);
  });

  it("calculates diagonal distance (3-4-5 triangle)", () => {
    const t1 = makeTouch(0, 0);
    const t2 = makeTouch(3, 4);
    expect(getTouchDistance(t1, t2)).toBe(5);
  });

  it("is commutative", () => {
    const t1 = makeTouch(10, 20);
    const t2 = makeTouch(30, 50);
    expect(getTouchDistance(t1, t2)).toBe(getTouchDistance(t2, t1));
  });
});

describe("getTouchMidpoint", () => {
  it("returns the same point for identical touches", () => {
    const t = makeTouch(100, 200);
    expect(getTouchMidpoint(t, t)).toEqual({ x: 100, y: 200 });
  });

  it("returns midpoint for horizontal pair", () => {
    const t1 = makeTouch(0, 0);
    const t2 = makeTouch(10, 0);
    expect(getTouchMidpoint(t1, t2)).toEqual({ x: 5, y: 0 });
  });

  it("returns midpoint for arbitrary pair", () => {
    const t1 = makeTouch(10, 20);
    const t2 = makeTouch(30, 40);
    expect(getTouchMidpoint(t1, t2)).toEqual({ x: 20, y: 30 });
  });

  it("is commutative", () => {
    const t1 = makeTouch(15, 25);
    const t2 = makeTouch(35, 55);
    expect(getTouchMidpoint(t1, t2)).toEqual(getTouchMidpoint(t2, t1));
  });
});
