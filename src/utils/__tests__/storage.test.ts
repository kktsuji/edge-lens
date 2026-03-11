import { describe, it, expect, vi, beforeEach } from "vitest";
import { safeGetItem, safeSetItem } from "../storage";

describe("safeGetItem", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns stored value", () => {
    localStorage.setItem("key", "value");
    expect(safeGetItem("key")).toBe("value");
  });

  it("returns null for missing key", () => {
    expect(safeGetItem("missing")).toBeNull();
  });

  it("returns null when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(safeGetItem("key")).toBeNull();
    vi.restoreAllMocks();
  });
});

describe("safeSetItem", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores a value", () => {
    safeSetItem("key", "value");
    expect(localStorage.getItem("key")).toBe("value");
  });

  it("does not throw when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    expect(() => safeSetItem("key", "value")).not.toThrow();
    vi.restoreAllMocks();
  });
});
