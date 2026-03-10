import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useMediaQuery } from "../useMediaQuery";

describe("useMediaQuery", () => {
  let listeners: Map<string, (e: MediaQueryListEvent) => void>;
  let matchesMap: Map<string, boolean>;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    listeners = new Map();
    matchesMap = new Map();
    originalMatchMedia = window.matchMedia;

    window.matchMedia = vi.fn((query: string) => {
      const mql = {
        matches: matchesMap.get(query) ?? false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(
          (_event: string, handler: (e: MediaQueryListEvent) => void) => {
            listeners.set(query, handler);
          },
        ),
        removeEventListener: vi.fn(() => {
          listeners.delete(query);
        }),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList;
      return mql;
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("returns initial match state (false)", () => {
    matchesMap.set("(min-width: 768px)", false);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);
  });

  it("returns initial match state (true)", () => {
    matchesMap.set("(min-width: 768px)", true);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(true);
  });

  it("updates when media query change event fires", () => {
    matchesMap.set("(min-width: 768px)", false);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);

    act(() => {
      const handler = listeners.get("(min-width: 768px)");
      handler?.({ matches: true } as MediaQueryListEvent);
    });
    expect(result.current).toBe(true);
  });

  it("cleans up listener on unmount", () => {
    matchesMap.set("(min-width: 768px)", false);
    const { unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(listeners.has("(min-width: 768px)")).toBe(true);

    unmount();
    expect(listeners.has("(min-width: 768px)")).toBe(false);
  });
});
