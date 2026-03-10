import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ReactNode } from "react";
import { createElement, useRef } from "react";
import { ImageStoreProvider } from "../useImageStore";

// Must mock before importing useCanvas
vi.mock("../useImageStore", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import("../useImageStore");
  return {
    ...actual,
    useImageStore: vi.fn(() => ({
      image: {
        file: null,
        name: "",
        width: 0,
        height: 0,
        imageData: null,
        imageBitmap: null,
      },
      viewport: { zoom: 1, panX: 0, panY: 0 },
      setViewportLocal: vi.fn(),
      refitKey: 0,
    })),
  };
});

import { useCanvas } from "../useCanvas";

let observeCallback: ResizeObserverCallback | null = null;
const disconnectMock = vi.fn();
let addedElements: Element[] = [];

const originalResizeObserver = globalThis.ResizeObserver;
const originalRAF = globalThis.requestAnimationFrame;
const originalCAF = globalThis.cancelAnimationFrame;

beforeEach(() => {
  observeCallback = null;
  disconnectMock.mockClear();
  addedElements = [];

  globalThis.ResizeObserver = vi.fn().mockImplementation((cb) => {
    observeCallback = cb;
    return {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: disconnectMock,
    };
  }) as unknown as typeof ResizeObserver;

  globalThis.requestAnimationFrame = vi
    .fn()
    .mockImplementation((cb: () => void) => {
      cb();
      return 1;
    });
  globalThis.cancelAnimationFrame = vi.fn();
});

afterEach(() => {
  for (const el of addedElements) {
    el.parentNode?.removeChild(el);
  }
  addedElements = [];
  globalThis.ResizeObserver = originalResizeObserver;
  globalThis.requestAnimationFrame = originalRAF;
  globalThis.cancelAnimationFrame = originalCAF;
});

function wrapper({ children }: { children: ReactNode }) {
  return createElement(ImageStoreProvider, null, children);
}

describe("useCanvas", () => {
  it("handles null canvas ref gracefully", () => {
    const { result } = renderHook(
      () => {
        const ref = useRef<HTMLCanvasElement>(null);
        useCanvas(ref);
        return ref;
      },
      { wrapper },
    );
    // Should not throw
    expect(result.current.current).toBeNull();
  });

  it("sets up ResizeObserver when canvas has parent", () => {
    const canvas = document.createElement("canvas");
    const container = document.createElement("div");
    container.appendChild(canvas);
    document.body.appendChild(container);
    addedElements.push(container);

    // Mock getBoundingClientRect
    container.getBoundingClientRect = vi.fn().mockReturnValue({
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      top: 0,
      right: 800,
      bottom: 600,
      left: 0,
      toJSON: vi.fn(),
    });

    renderHook(
      () => {
        const ref = useRef<HTMLCanvasElement>(canvas);
        useCanvas(ref);
        return ref;
      },
      { wrapper },
    );

    expect(globalThis.ResizeObserver).toHaveBeenCalled();
    expect(observeCallback).not.toBeNull();
  });

  it("disconnects ResizeObserver on unmount", () => {
    const canvas = document.createElement("canvas");
    const container = document.createElement("div");
    container.appendChild(canvas);
    document.body.appendChild(container);
    addedElements.push(container);
    container.getBoundingClientRect = vi.fn().mockReturnValue({
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      top: 0,
      right: 800,
      bottom: 600,
      left: 0,
      toJSON: vi.fn(),
    });

    const { unmount } = renderHook(
      () => {
        const ref = useRef<HTMLCanvasElement>(canvas);
        useCanvas(ref);
        return ref;
      },
      { wrapper },
    );

    unmount();
    expect(disconnectMock).toHaveBeenCalled();
  });
});
