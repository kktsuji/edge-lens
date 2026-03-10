import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { useRef } from "react";
import {
  ImageStoreProvider,
  useImageStore,
  useGridActions,
} from "../useImageStore";
import { useKeyboardShortcuts } from "../useKeyboardShortcuts";

const closeMock = vi.fn();

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

  // Default: wide screen
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: 1024,
  });
});

function wrapper({ children }: { children: ReactNode }) {
  return <ImageStoreProvider>{children}</ImageStoreProvider>;
}

function createTestFile(name = "test.png"): File {
  return new File(["dummy"], name, { type: "image/png" });
}

function fireKey(key: string, opts: Partial<KeyboardEventInit> = {}) {
  window.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, ...opts }),
  );
}

function useShortcutsHarness(
  overrides?: Partial<Parameters<typeof useKeyboardShortcuts>[1]>,
  canvas?: HTMLCanvasElement | null,
) {
  const store = useImageStore();
  const grid = useGridActions();
  const canvasRef = useRef<HTMLCanvasElement>(canvas ?? null);
  const options = {
    onOpenFile: vi.fn(),
    onCloseImage: vi.fn(),
    isHelpOpen: false,
    onToggleHelp: vi.fn(),
    ...overrides,
  };
  useKeyboardShortcuts(canvasRef, options);
  return { store, grid, options, canvasRef };
}

function createMockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  Object.defineProperty(canvas, "clientWidth", { value: 800 });
  Object.defineProperty(canvas, "clientHeight", { value: 600 });
  return canvas;
}

describe("useKeyboardShortcuts", () => {
  it("? toggles help", () => {
    const onToggleHelp = vi.fn();
    renderHook(() => useShortcutsHarness({ onToggleHelp }), { wrapper });
    act(() => fireKey("?"));
    expect(onToggleHelp).toHaveBeenCalledTimes(1);
  });

  it("Escape closes help when open", () => {
    const onToggleHelp = vi.fn();
    renderHook(() => useShortcutsHarness({ isHelpOpen: true, onToggleHelp }), {
      wrapper,
    });
    act(() => fireKey("Escape"));
    expect(onToggleHelp).toHaveBeenCalledTimes(1);
  });

  it("Escape resets toolMode to navigate", async () => {
    const { result } = renderHook(() => useShortcutsHarness(), { wrapper });

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => result.current.store.setToolMode("roi"));

    act(() => fireKey("Escape"));
    expect(result.current.store.toolMode).toBe("navigate");
  });

  it("Escape calls onCloseImage when no overlays and navigate mode", async () => {
    const onCloseImage = vi.fn();
    const { result } = renderHook(() => useShortcutsHarness({ onCloseImage }), {
      wrapper,
    });

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });

    act(() => fireKey("Escape"));
    expect(onCloseImage).toHaveBeenCalledTimes(1);
  });

  it("Ctrl+O opens file", () => {
    const onOpenFile = vi.fn();
    renderHook(() => useShortcutsHarness({ onOpenFile }), { wrapper });
    act(() => fireKey("o", { ctrlKey: true }));
    expect(onOpenFile).toHaveBeenCalledTimes(1);
  });

  it("R sets roi mode when image loaded", async () => {
    const { result } = renderHook(() => useShortcutsHarness(), { wrapper });
    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => fireKey("r"));
    expect(result.current.store.toolMode).toBe("roi");
  });

  it("L sets line-profile mode when image loaded", async () => {
    const { result } = renderHook(() => useShortcutsHarness(), { wrapper });
    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => fireKey("l"));
    expect(result.current.store.toolMode).toBe("line-profile");
  });

  it("N sets navigate mode when image loaded", async () => {
    const { result } = renderHook(() => useShortcutsHarness(), { wrapper });
    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => result.current.store.setToolMode("roi"));
    act(() => fireKey("n"));
    expect(result.current.store.toolMode).toBe("navigate");
  });

  it("R/L/N do nothing without image or grid", () => {
    const { result } = renderHook(() => useShortcutsHarness(), { wrapper });
    act(() => fireKey("r"));
    expect(result.current.store.toolMode).toBe("navigate");
  });

  it("G toggles grid on wide screens", async () => {
    const { result } = renderHook(() => useShortcutsHarness(), { wrapper });
    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => fireKey("g"));
    expect(result.current.grid.gridState.enabled).toBe(true);
    act(() => fireKey("g"));
    expect(result.current.grid.gridState.enabled).toBe(false);
  });

  it("G does not toggle grid on narrow screens", () => {
    Object.defineProperty(window, "innerWidth", { value: 500 });
    const { result } = renderHook(() => useShortcutsHarness(), { wrapper });
    act(() => fireKey("g"));
    expect(result.current.grid.gridState.enabled).toBe(false);
  });

  it("K toggles position lock in grid mode", async () => {
    const { result } = renderHook(() => useShortcutsHarness(), { wrapper });
    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => result.current.grid.setGridEnabled(true));

    // Default is locked (true), toggle to false
    act(() => fireKey("k"));
    expect(result.current.grid.gridState.positionLocked).toBe(false);
  });

  it("K does nothing when grid is not enabled", () => {
    const { result } = renderHook(() => useShortcutsHarness(), { wrapper });
    act(() => fireKey("k"));
    // positionLocked remains default
    expect(result.current.grid.gridState.positionLocked).toBe(true);
  });

  it("ignores keys from INPUT elements", () => {
    const onToggleHelp = vi.fn();
    renderHook(() => useShortcutsHarness({ onToggleHelp }), { wrapper });

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "?", bubbles: true }),
    );
    document.body.removeChild(input);

    expect(onToggleHelp).not.toHaveBeenCalled();
  });

  it("Escape in grid mode clears line profile when present", async () => {
    const { result } = renderHook(() => useShortcutsHarness(), { wrapper });

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => result.current.grid.setGridEnabled(true));

    // Set line profile on active cell
    act(() =>
      result.current.grid.setCellLineProfile("0-0", {
        x1: 0,
        y1: 0,
        x2: 10,
        y2: 10,
      }),
    );

    act(() => fireKey("Escape"));

    // With position locked, all cells should have lineProfile cleared
    for (const cell of result.current.grid.gridState.cells) {
      expect(cell.lineProfile).toBeNull();
    }
  });

  it("Escape in grid mode clears ROI when no line profile", async () => {
    const { result } = renderHook(() => useShortcutsHarness(), { wrapper });

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => result.current.grid.setGridEnabled(true));

    act(() =>
      result.current.grid.setCellRoiSelection("0-0", {
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      }),
    );

    act(() => fireKey("Escape"));

    for (const cell of result.current.grid.gridState.cells) {
      expect(cell.roiSelection).toBeNull();
    }
  });

  it("Escape in grid mode disables grid when no overlays and navigate mode", async () => {
    const { result } = renderHook(() => useShortcutsHarness(), { wrapper });

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => result.current.grid.setGridEnabled(true));

    act(() => fireKey("Escape"));
    expect(result.current.grid.gridState.enabled).toBe(false);
  });

  it("Escape in single-view clears last overlay (roi then line-profile order)", async () => {
    const { result } = renderHook(() => useShortcutsHarness(), { wrapper });

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });

    // Add roi first, then line-profile — drawOrder tracks this
    act(() =>
      result.current.store.setRoiSelection({
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      }),
    );
    act(() =>
      result.current.store.setLineProfile({
        x1: 0,
        y1: 0,
        x2: 10,
        y2: 10,
      }),
    );

    // First Escape clears last added (line-profile)
    act(() => fireKey("Escape"));
    expect(result.current.store.lineProfile).toBeNull();
    expect(result.current.store.roiSelection).not.toBeNull();

    // Second Escape clears roi
    act(() => fireKey("Escape"));
    expect(result.current.store.roiSelection).toBeNull();
  });

  it("Escape in grid mode with unlocked position clears only active cell line profile", async () => {
    const { result } = renderHook(() => useShortcutsHarness(), { wrapper });

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => result.current.grid.setGridEnabled(true));
    act(() => result.current.grid.setGridPositionLocked(false));

    const lp = { x1: 0, y1: 0, x2: 10, y2: 10 };
    act(() => result.current.grid.setCellLineProfile("0-0", lp));
    act(() => result.current.grid.setCellLineProfile("0-1", lp));

    act(() => fireKey("Escape"));

    // Only active cell (0-0) should be cleared
    expect(
      result.current.grid.gridState.cells.find((c) => c.id === "0-0")
        ?.lineProfile,
    ).toBeNull();
    expect(
      result.current.grid.gridState.cells.find((c) => c.id === "0-1")
        ?.lineProfile,
    ).toEqual(lp);
  });

  it("Escape in grid mode with unlocked position clears only active cell ROI", async () => {
    const { result } = renderHook(() => useShortcutsHarness(), { wrapper });

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => result.current.grid.setGridEnabled(true));
    act(() => result.current.grid.setGridPositionLocked(false));

    const roi = { x: 0, y: 0, width: 10, height: 10 };
    act(() => result.current.grid.setCellRoiSelection("0-0", roi));
    act(() => result.current.grid.setCellRoiSelection("0-1", roi));

    act(() => fireKey("Escape"));

    expect(
      result.current.grid.gridState.cells.find((c) => c.id === "0-0")
        ?.roiSelection,
    ).toBeNull();
    expect(
      result.current.grid.gridState.cells.find((c) => c.id === "0-1")
        ?.roiSelection,
    ).toEqual(roi);
  });

  it("Escape in grid resets toolMode before disabling grid", async () => {
    const { result } = renderHook(() => useShortcutsHarness(), { wrapper });

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => result.current.grid.setGridEnabled(true));
    act(() => result.current.store.setToolMode("roi"));

    // First Escape: resets to navigate
    act(() => fireKey("Escape"));
    expect(result.current.store.toolMode).toBe("navigate");
    expect(result.current.grid.gridState.enabled).toBe(true);

    // Second Escape: disables grid
    act(() => fireKey("Escape"));
    expect(result.current.grid.gridState.enabled).toBe(false);
  });

  // --- Single-view zoom shortcuts ---

  it("+ zooms in (single-view)", async () => {
    const canvas = createMockCanvas();
    const { result } = renderHook(
      () => useShortcutsHarness(undefined, canvas),
      { wrapper },
    );

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    const prevZoom = result.current.store.viewport.zoom;

    act(() => fireKey("+"));
    expect(result.current.store.viewport.zoom).toBeGreaterThan(prevZoom);
  });

  it("- zooms out (single-view)", async () => {
    const canvas = createMockCanvas();
    const { result } = renderHook(
      () => useShortcutsHarness(undefined, canvas),
      { wrapper },
    );

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    // Set zoom > 1 first so we can zoom out
    act(() => result.current.store.setZoom(5));
    const prevZoom = result.current.store.viewport.zoom;

    act(() => fireKey("-"));
    expect(result.current.store.viewport.zoom).toBeLessThan(prevZoom);
  });

  it("0 fits image to canvas (single-view)", async () => {
    const canvas = createMockCanvas();
    const { result } = renderHook(
      () => useShortcutsHarness(undefined, canvas),
      { wrapper },
    );

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => result.current.store.setZoom(5));

    act(() => fireKey("0"));
    // Should fit 100x100 image into 800x600 canvas → zoom = 6
    expect(result.current.store.viewport.zoom).toBe(6);
  });

  it("1 shows image at 100% (single-view)", async () => {
    const canvas = createMockCanvas();
    const { result } = renderHook(
      () => useShortcutsHarness(undefined, canvas),
      { wrapper },
    );

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => result.current.store.setZoom(5));

    act(() => fireKey("1"));
    expect(result.current.store.viewport.zoom).toBe(1);
    // Image centered: panX = (800 - 100) / 2 = 350
    expect(result.current.store.viewport.panX).toBe(350);
    expect(result.current.store.viewport.panY).toBe(250);
  });

  it("= also zooms in (single-view)", async () => {
    const canvas = createMockCanvas();
    const { result } = renderHook(
      () => useShortcutsHarness(undefined, canvas),
      { wrapper },
    );

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    const prevZoom = result.current.store.viewport.zoom;

    act(() => fireKey("="));
    expect(result.current.store.viewport.zoom).toBeGreaterThan(prevZoom);
  });

  it("zoom shortcuts do nothing without image or canvas", () => {
    const { result } = renderHook(() => useShortcutsHarness(), { wrapper });
    act(() => fireKey("+"));
    expect(result.current.store.viewport.zoom).toBe(1);
  });

  // --- Grid zoom shortcuts ---

  it("+ zooms in grid mode (position locked)", async () => {
    const canvas = createMockCanvas();
    const { result } = renderHook(
      () => useShortcutsHarness(undefined, canvas),
      { wrapper },
    );

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => result.current.grid.setGridEnabled(true));

    // Mock the DOM query for grid cell canvas
    const cellCanvas = document.createElement("canvas");
    Object.defineProperty(cellCanvas, "clientWidth", { value: 400 });
    Object.defineProperty(cellCanvas, "clientHeight", { value: 300 });
    const cellDiv = document.createElement("div");
    cellDiv.setAttribute("data-cell-id", "0-0");
    cellDiv.appendChild(cellCanvas);
    document.body.appendChild(cellDiv);

    await act(async () => {
      await result.current.grid.loadImageToCell(
        "0-0",
        createTestFile("grid.png"),
      );
    });

    act(() => fireKey("+"));
    // Zoom should have changed on all cells
    const cell = result.current.grid.gridState.cells.find(
      (c) => c.id === "0-0",
    );
    expect(cell?.viewport.zoom).toBeGreaterThan(1);

    document.body.removeChild(cellDiv);
  });

  it("- zooms out in grid mode", async () => {
    const canvas = createMockCanvas();
    const { result } = renderHook(
      () => useShortcutsHarness(undefined, canvas),
      { wrapper },
    );

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => result.current.grid.setGridEnabled(true));

    const cellCanvas = document.createElement("canvas");
    Object.defineProperty(cellCanvas, "clientWidth", { value: 400 });
    Object.defineProperty(cellCanvas, "clientHeight", { value: 300 });
    const cellDiv = document.createElement("div");
    cellDiv.setAttribute("data-cell-id", "0-0");
    cellDiv.appendChild(cellCanvas);
    document.body.appendChild(cellDiv);

    await act(async () => {
      await result.current.grid.loadImageToCell(
        "0-0",
        createTestFile("grid.png"),
      );
    });
    act(() =>
      result.current.grid.updateCellViewport("0-0", {
        zoom: 5,
        panX: 0,
        panY: 0,
      }),
    );

    act(() => fireKey("-"));
    const cell = result.current.grid.gridState.cells.find(
      (c) => c.id === "0-0",
    );
    expect(cell?.viewport.zoom).toBeLessThan(5);

    document.body.removeChild(cellDiv);
  });

  it("0 fits to canvas in grid mode (unlocked)", async () => {
    const canvas = createMockCanvas();
    const { result } = renderHook(
      () => useShortcutsHarness(undefined, canvas),
      { wrapper },
    );

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => result.current.grid.setGridEnabled(true));
    act(() => result.current.grid.setGridPositionLocked(false));

    const cellCanvas = document.createElement("canvas");
    Object.defineProperty(cellCanvas, "clientWidth", { value: 400 });
    Object.defineProperty(cellCanvas, "clientHeight", { value: 300 });
    const cellDiv = document.createElement("div");
    cellDiv.setAttribute("data-cell-id", "0-0");
    cellDiv.appendChild(cellCanvas);
    document.body.appendChild(cellDiv);

    await act(async () => {
      await result.current.grid.loadImageToCell(
        "0-0",
        createTestFile("grid.png"),
      );
    });

    act(() => fireKey("0"));
    const cell = result.current.grid.gridState.cells.find(
      (c) => c.id === "0-0",
    );
    // 100x100 image in 400x300 canvas → zoom = 3
    expect(cell?.viewport.zoom).toBe(3);

    document.body.removeChild(cellDiv);
  });

  it("1 shows 100% zoom in grid mode (unlocked)", async () => {
    const canvas = createMockCanvas();
    const { result } = renderHook(
      () => useShortcutsHarness(undefined, canvas),
      { wrapper },
    );

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => result.current.grid.setGridEnabled(true));
    act(() => result.current.grid.setGridPositionLocked(false));

    const cellCanvas = document.createElement("canvas");
    Object.defineProperty(cellCanvas, "clientWidth", { value: 400 });
    Object.defineProperty(cellCanvas, "clientHeight", { value: 300 });
    const cellDiv = document.createElement("div");
    cellDiv.setAttribute("data-cell-id", "0-0");
    cellDiv.appendChild(cellCanvas);
    document.body.appendChild(cellDiv);

    await act(async () => {
      await result.current.grid.loadImageToCell(
        "0-0",
        createTestFile("grid.png"),
      );
    });

    act(() => fireKey("1"));
    const cell = result.current.grid.gridState.cells.find(
      (c) => c.id === "0-0",
    );
    expect(cell?.viewport.zoom).toBe(1);
    // panX = (400 - 100) / 2 = 150
    expect(cell?.viewport.panX).toBe(150);

    document.body.removeChild(cellDiv);
  });

  it("0 fits each cell independently in grid mode (locked)", async () => {
    const canvas = createMockCanvas();
    const { result } = renderHook(
      () => useShortcutsHarness(undefined, canvas),
      { wrapper },
    );

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => result.current.grid.setGridEnabled(true));

    const cellCanvas = document.createElement("canvas");
    Object.defineProperty(cellCanvas, "clientWidth", { value: 400 });
    Object.defineProperty(cellCanvas, "clientHeight", { value: 300 });
    const cellDiv = document.createElement("div");
    cellDiv.setAttribute("data-cell-id", "0-0");
    cellDiv.appendChild(cellCanvas);
    document.body.appendChild(cellDiv);

    await act(async () => {
      await result.current.grid.loadImageToCell(
        "0-0",
        createTestFile("grid.png"),
      );
    });

    act(() => fireKey("0"));
    const cell = result.current.grid.gridState.cells.find(
      (c) => c.id === "0-0",
    );
    expect(cell?.viewport.zoom).toBe(3);

    document.body.removeChild(cellDiv);
  });

  it("1 shows 100% for all cells in grid mode (locked)", async () => {
    const canvas = createMockCanvas();
    const { result } = renderHook(
      () => useShortcutsHarness(undefined, canvas),
      { wrapper },
    );

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => result.current.grid.setGridEnabled(true));

    const cellCanvas = document.createElement("canvas");
    Object.defineProperty(cellCanvas, "clientWidth", { value: 400 });
    Object.defineProperty(cellCanvas, "clientHeight", { value: 300 });
    const cellDiv = document.createElement("div");
    cellDiv.setAttribute("data-cell-id", "0-0");
    cellDiv.appendChild(cellCanvas);
    document.body.appendChild(cellDiv);

    await act(async () => {
      await result.current.grid.loadImageToCell(
        "0-0",
        createTestFile("grid.png"),
      );
    });

    act(() => fireKey("1"));
    const cell = result.current.grid.gridState.cells.find(
      (c) => c.id === "0-0",
    );
    expect(cell?.viewport.zoom).toBe(1);

    document.body.removeChild(cellDiv);
  });
});
