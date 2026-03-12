import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ReactNode } from "react";
import {
  ImageStoreProvider,
  useImageStore,
} from "../../../../hooks/useImageStore";
import { useZoom } from "../useZoom";

// jsdom does not provide PointerEvent; polyfill it from MouseEvent
if (typeof globalThis.PointerEvent === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).PointerEvent = class PointerEvent extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? "";
    }
  };
}

const closeMock = vi.fn();
const originalCreateImageBitmap = globalThis.createImageBitmap;
const originalOffscreenCanvas = globalThis.OffscreenCanvas;

let canvas: HTMLCanvasElement;

beforeEach(() => {
  closeMock.mockClear();

  globalThis.createImageBitmap = vi.fn().mockResolvedValue({
    width: 100,
    height: 100,
    close: closeMock,
  });

  globalThis.OffscreenCanvas = vi.fn().mockImplementation(() => ({
    getContext: () => ({
      drawImage: vi.fn(),
      getImageData: () => ({
        width: 100,
        height: 100,
        data: new Uint8ClampedArray(100 * 100 * 4),
        colorSpace: "srgb" as PredefinedColorSpace,
      }),
    }),
  })) as unknown as typeof OffscreenCanvas;

  canvas = document.createElement("canvas");
  Object.defineProperty(canvas, "getBoundingClientRect", {
    value: () => ({
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      top: 0,
      right: 800,
      bottom: 600,
      left: 0,
    }),
  });
  // Stub setPointerCapture / releasePointerCapture
  canvas.setPointerCapture = vi.fn();
  canvas.releasePointerCapture = vi.fn();
  document.body.appendChild(canvas);
});

afterEach(() => {
  document.body.removeChild(canvas);
  globalThis.createImageBitmap = originalCreateImageBitmap;
  globalThis.OffscreenCanvas = originalOffscreenCanvas;
});

function wrapper({ children }: { children: ReactNode }) {
  return <ImageStoreProvider>{children}</ImageStoreProvider>;
}

/**
 * Helper: load a dummy image so viewport is initialized.
 */
async function loadDummyImage(
  result: ReturnType<
    typeof renderHook<
      void,
      ReturnType<typeof useImageStore> & {
        canvasRef: { current: typeof canvas };
      }
    >
  >,
) {
  const blob = new Blob(["x"], { type: "image/png" });
  const file = new File([blob], "test.png", { type: "image/png" });
  await act(async () => {
    result.result.current.loadImage(file);
  });
}

function useZoomWithStore() {
  const store = useImageStore();
  const canvasRef = { current: canvas };
  useZoom(canvasRef as React.RefObject<HTMLCanvasElement>);
  return { ...store, canvasRef };
}

function firePointerEvent(
  target: EventTarget,
  type: string,
  init: Partial<PointerEvent> = {},
) {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: 0,
    clientY: 0,
    button: 0,
    pointerType: "mouse",
    ...init,
  });
  target.dispatchEvent(event);
}

describe("useZoom – click-drag panning", () => {
  it("pans the image on click-drag in navigate mode", async () => {
    const result = renderHook(() => useZoomWithStore(), { wrapper });
    await loadDummyImage(result);

    // Default toolMode is "navigate"
    expect(result.result.current.toolMode).toBe("navigate");

    const initialPanX = result.result.current.viewport.panX;
    const initialPanY = result.result.current.viewport.panY;

    // Simulate drag: pointerdown → pointermove → pointerup
    act(() => {
      firePointerEvent(canvas, "pointerdown", {
        clientX: 100,
        clientY: 100,
      });
    });

    act(() => {
      firePointerEvent(canvas, "pointermove", {
        clientX: 150,
        clientY: 120,
      });
    });

    act(() => {
      firePointerEvent(canvas, "pointerup", { clientX: 150, clientY: 120 });
    });

    expect(result.result.current.viewport.panX).toBe(initialPanX + 50);
    expect(result.result.current.viewport.panY).toBe(initialPanY + 20);
  });

  it("does NOT pan on click-drag in ROI mode", async () => {
    const result = renderHook(() => useZoomWithStore(), { wrapper });
    await loadDummyImage(result);

    act(() => {
      result.result.current.setToolMode("roi");
    });

    const initialPanX = result.result.current.viewport.panX;
    const initialPanY = result.result.current.viewport.panY;

    act(() => {
      firePointerEvent(canvas, "pointerdown", {
        clientX: 100,
        clientY: 100,
      });
    });
    act(() => {
      firePointerEvent(canvas, "pointermove", {
        clientX: 150,
        clientY: 120,
      });
    });
    act(() => {
      firePointerEvent(canvas, "pointerup", { clientX: 150, clientY: 120 });
    });

    expect(result.result.current.viewport.panX).toBe(initialPanX);
    expect(result.result.current.viewport.panY).toBe(initialPanY);
  });

  it("does NOT pan on click-drag in line-profile mode", async () => {
    const result = renderHook(() => useZoomWithStore(), { wrapper });
    await loadDummyImage(result);

    act(() => {
      result.result.current.setToolMode("line-profile");
    });

    const initialPanX = result.result.current.viewport.panX;
    const initialPanY = result.result.current.viewport.panY;

    act(() => {
      firePointerEvent(canvas, "pointerdown", {
        clientX: 100,
        clientY: 100,
      });
    });
    act(() => {
      firePointerEvent(canvas, "pointermove", {
        clientX: 150,
        clientY: 120,
      });
    });
    act(() => {
      firePointerEvent(canvas, "pointerup", { clientX: 150, clientY: 120 });
    });

    expect(result.result.current.viewport.panX).toBe(initialPanX);
    expect(result.result.current.viewport.panY).toBe(initialPanY);
  });

  it("pans with Space+drag in all modes", async () => {
    const result = renderHook(() => useZoomWithStore(), { wrapper });
    await loadDummyImage(result);

    // Switch to ROI mode (Space+drag should still pan)
    act(() => {
      result.result.current.setToolMode("roi");
    });

    const initialPanX = result.result.current.viewport.panX;
    const initialPanY = result.result.current.viewport.panY;

    // Hold space
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: " ", bubbles: true }),
      );
    });

    act(() => {
      firePointerEvent(canvas, "pointerdown", {
        clientX: 100,
        clientY: 100,
      });
    });
    act(() => {
      firePointerEvent(canvas, "pointermove", {
        clientX: 130,
        clientY: 140,
      });
    });
    act(() => {
      firePointerEvent(canvas, "pointerup", { clientX: 130, clientY: 140 });
    });

    // Release space
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keyup", { key: " ", bubbles: true }),
      );
    });

    expect(result.result.current.viewport.panX).toBe(initialPanX + 30);
    expect(result.result.current.viewport.panY).toBe(initialPanY + 40);
  });

  it("sets cursor to grabbing during drag in navigate mode", async () => {
    const result = renderHook(() => useZoomWithStore(), { wrapper });
    await loadDummyImage(result);

    expect(result.result.current.toolMode).toBe("navigate");

    act(() => {
      firePointerEvent(canvas, "pointerdown", {
        clientX: 100,
        clientY: 100,
      });
    });

    expect(canvas.style.cursor).toBe("grabbing");

    act(() => {
      firePointerEvent(canvas, "pointerup", { clientX: 100, clientY: 100 });
    });

    // After release, inline cursor is cleared (CSS class handles default)
    expect(canvas.style.cursor).toBe("");
  });
});
