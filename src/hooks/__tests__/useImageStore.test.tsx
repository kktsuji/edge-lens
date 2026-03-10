import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ReactNode } from "react";
import {
  ImageStoreProvider,
  useImageStore,
  useGridActions,
} from "../useImageStore";

// --- Global mocks for browser APIs not available in jsdom ---

const closeMock = vi.fn();
const originalCreateImageBitmap = globalThis.createImageBitmap;
const originalOffscreenCanvas = globalThis.OffscreenCanvas;

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
});

afterEach(() => {
  globalThis.createImageBitmap = originalCreateImageBitmap;
  globalThis.OffscreenCanvas = originalOffscreenCanvas;
});

function wrapper({ children }: { children: ReactNode }) {
  return <ImageStoreProvider>{children}</ImageStoreProvider>;
}

function createTestFile(name = "test.png"): File {
  return new File(["dummy"], name, { type: "image/png" });
}

// ---- Context access ----

describe("useImageStore context", () => {
  it("throws when used outside provider", () => {
    expect(() => {
      renderHook(() => useImageStore());
    }).toThrow("useImageStore must be used within ImageStoreProvider");
  });

  it("returns context value inside provider", () => {
    const { result } = renderHook(() => useImageStore(), { wrapper });
    expect(result.current.image.file).toBeNull();
    expect(result.current.viewport.zoom).toBe(1);
    expect(result.current.toolMode).toBe("navigate");
  });
});

describe("useGridActions context", () => {
  it("throws when used outside provider", () => {
    expect(() => {
      renderHook(() => useGridActions());
    }).toThrow("useGridActions must be used within ImageStoreProvider");
  });

  it("returns grid actions inside provider", () => {
    const { result } = renderHook(() => useGridActions(), { wrapper });
    expect(result.current.gridState.enabled).toBe(false);
  });
});

// ---- Single-view state ----

describe("single-view state", () => {
  it("loadImage sets image state", async () => {
    const { result } = renderHook(() => useImageStore(), { wrapper });

    await act(async () => {
      await result.current.loadImage(createTestFile());
    });

    expect(result.current.image.name).toBe("test.png");
    expect(result.current.image.width).toBe(100);
    expect(result.current.image.height).toBe(100);
    expect(result.current.image.imageData).not.toBeNull();
    expect(result.current.image.imageBitmap).not.toBeNull();
  });

  it("loadImage resets viewport, toolMode, roi, lineProfile", async () => {
    const { result } = renderHook(() => useImageStore(), { wrapper });

    // Set some state first
    act(() => {
      result.current.setZoom(5);
      result.current.setToolMode("roi");
      result.current.setRoiSelection({ x: 0, y: 0, width: 10, height: 10 });
      result.current.setLineProfile({ x1: 0, y1: 0, x2: 10, y2: 10 });
    });

    await act(async () => {
      await result.current.loadImage(createTestFile());
    });

    expect(result.current.viewport.zoom).toBe(1);
    expect(result.current.toolMode).toBe("navigate");
    expect(result.current.roiSelection).toBeNull();
    expect(result.current.lineProfile).toBeNull();
  });

  it("loadImage replaces previous image and releases stale bitmap", async () => {
    const { result } = renderHook(() => useImageStore(), { wrapper });

    await act(async () => {
      await result.current.loadImage(createTestFile("a.png"));
    });
    expect(result.current.image.name).toBe("a.png");
    const firstBitmap = result.current.image.imageBitmap;

    (
      globalThis.createImageBitmap as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ width: 60, height: 60, close: vi.fn() });
    await act(async () => {
      await result.current.loadImage(createTestFile("b.png"));
    });

    // The previous bitmap should no longer be referenced
    expect(result.current.image.imageBitmap).not.toBe(firstBitmap);
    expect(result.current.image.name).toBe("b.png");
    expect(result.current.image.width).toBe(60);
  });

  it("closeImage resets all state and releases bitmap", async () => {
    const { result } = renderHook(() => useImageStore(), { wrapper });

    await act(async () => {
      await result.current.loadImage(createTestFile());
    });
    expect(result.current.image.imageBitmap).not.toBeNull();

    act(() => {
      result.current.closeImage();
    });

    expect(result.current.image.file).toBeNull();
    expect(result.current.image.imageBitmap).toBeNull();
    expect(result.current.image.imageData).toBeNull();
    expect(result.current.viewport.zoom).toBe(1);
    expect(result.current.toolMode).toBe("navigate");
  });

  it("setZoom updates zoom", () => {
    const { result } = renderHook(() => useImageStore(), { wrapper });
    act(() => result.current.setZoom(3));
    expect(result.current.viewport.zoom).toBe(3);
  });

  it("setPan updates panX and panY", () => {
    const { result } = renderHook(() => useImageStore(), { wrapper });
    act(() => result.current.setPan(10, 20));
    expect(result.current.viewport.panX).toBe(10);
    expect(result.current.viewport.panY).toBe(20);
  });

  it("setViewport updates entire viewport", () => {
    const { result } = renderHook(() => useImageStore(), { wrapper });
    act(() => result.current.setViewport({ zoom: 2, panX: 5, panY: 15 }));
    expect(result.current.viewport).toEqual({ zoom: 2, panX: 5, panY: 15 });
  });

  it("setToolMode changes tool mode", () => {
    const { result } = renderHook(() => useImageStore(), { wrapper });
    act(() => result.current.setToolMode("roi"));
    expect(result.current.toolMode).toBe("roi");
    act(() => result.current.setToolMode("line-profile"));
    expect(result.current.toolMode).toBe("line-profile");
  });

  it("setRoiSelection and setLineProfile work", () => {
    const { result } = renderHook(() => useImageStore(), { wrapper });
    const roi = { x: 0, y: 0, width: 50, height: 50 };
    act(() => result.current.setRoiSelection(roi));
    expect(result.current.roiSelection).toEqual(roi);

    const lp = { x1: 0, y1: 0, x2: 100, y2: 100 };
    act(() => result.current.setLineProfile(lp));
    expect(result.current.lineProfile).toEqual(lp);
  });

  it("setIsTouchPinching updates state", () => {
    const { result } = renderHook(() => useImageStore(), { wrapper });
    act(() => result.current.setIsTouchPinching(true));
    expect(result.current.isTouchPinching).toBe(true);
  });
});

// ---- Grid actions ----

describe("grid actions", () => {
  it("setGridEnabled enables grid with 1x2 layout", async () => {
    const { result } = renderHook(
      () => ({ store: useImageStore(), grid: useGridActions() }),
      { wrapper },
    );

    // Load an image first
    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });

    act(() => result.current.grid.setGridEnabled(true));

    expect(result.current.grid.gridState.enabled).toBe(true);
    expect(result.current.grid.gridState.layout).toEqual({
      rows: 1,
      cols: 2,
    });
    expect(result.current.grid.gridState.cells.length).toBe(2);
    // First cell should have the single-view image
    expect(result.current.grid.gridState.cells[0]?.image.name).toBe("test.png");
  });

  it("setGridEnabled(false) restores single-view from cell 0-0", async () => {
    const { result } = renderHook(
      () => ({ store: useImageStore(), grid: useGridActions() }),
      { wrapper },
    );

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });

    act(() => result.current.grid.setGridEnabled(true));
    act(() => result.current.grid.setGridEnabled(false));

    expect(result.current.grid.gridState.enabled).toBe(false);
    // Image should be restored to single-view
    expect(result.current.store.image.name).toBe("test.png");
  });

  it("setGridLayout changes layout and creates cells", async () => {
    const { result } = renderHook(
      () => ({ store: useImageStore(), grid: useGridActions() }),
      { wrapper },
    );

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });

    act(() => result.current.grid.setGridLayout({ rows: 2, cols: 2 }));

    expect(result.current.grid.gridState.enabled).toBe(true);
    expect(result.current.grid.gridState.cells.length).toBe(4);
  });

  it("setGridLayout with 1x1 disables grid", async () => {
    const { result } = renderHook(
      () => ({ store: useImageStore(), grid: useGridActions() }),
      { wrapper },
    );

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => result.current.grid.setGridEnabled(true));
    act(() => result.current.grid.setGridLayout({ rows: 1, cols: 1 }));

    expect(result.current.grid.gridState.enabled).toBe(false);
  });

  it("setGridPositionLocked toggles lock", () => {
    const { result } = renderHook(() => useGridActions(), { wrapper });
    act(() => result.current.setGridPositionLocked(false));
    expect(result.current.gridState.positionLocked).toBe(false);
    act(() => result.current.setGridPositionLocked(true));
    expect(result.current.gridState.positionLocked).toBe(true);
  });

  it("setActiveCellId updates active cell", () => {
    const { result } = renderHook(() => useGridActions(), { wrapper });
    act(() => result.current.setGridEnabled(true));
    act(() => result.current.setActiveCellId("0-1"));
    expect(result.current.gridState.activeCellId).toBe("0-1");
  });

  it("loadImageToCell loads image to specific cell", async () => {
    const { result } = renderHook(() => useGridActions(), { wrapper });

    act(() => result.current.setGridEnabled(true));

    await act(async () => {
      await result.current.loadImageToCell("0-1", createTestFile("cell.png"));
    });

    const cell = result.current.gridState.cells.find((c) => c.id === "0-1");
    expect(cell?.image.name).toBe("cell.png");
    expect(cell?.image.width).toBe(100);
  });

  it("closeCellImage resets cell state", async () => {
    const { result } = renderHook(() => useGridActions(), { wrapper });

    act(() => result.current.setGridEnabled(true));
    await act(async () => {
      await result.current.loadImageToCell("0-0", createTestFile());
    });
    expect(
      result.current.gridState.cells.find((c) => c.id === "0-0")?.image.name,
    ).toBe("test.png");

    act(() => result.current.closeCellImage("0-0"));

    const cell = result.current.gridState.cells.find((c) => c.id === "0-0");
    expect(cell?.image.file).toBeNull();
    expect(cell?.image.imageData).toBeNull();
  });

  it("updateCellViewport updates a single cell viewport", () => {
    const { result } = renderHook(() => useGridActions(), { wrapper });
    act(() => result.current.setGridEnabled(true));

    const vp = { zoom: 2, panX: 10, panY: 20 };
    act(() => result.current.updateCellViewport("0-0", vp));

    const cell = result.current.gridState.cells.find((c) => c.id === "0-0");
    expect(cell?.viewport).toEqual(vp);
  });

  it("updateAllCellViewports applies fn to all cells", () => {
    const { result } = renderHook(() => useGridActions(), { wrapper });
    act(() => result.current.setGridEnabled(true));

    act(() =>
      result.current.updateAllCellViewports((prev) => ({
        ...prev,
        zoom: 3,
      })),
    );

    for (const cell of result.current.gridState.cells) {
      expect(cell.viewport.zoom).toBe(3);
    }
  });

  it("updateCellViewportsBatch updates multiple cells", () => {
    const { result } = renderHook(() => useGridActions(), { wrapper });
    act(() => result.current.setGridEnabled(true));

    const updates = new Map([
      ["0-0", { zoom: 5, panX: 1, panY: 2 }],
      ["0-1", { zoom: 6, panX: 3, panY: 4 }],
    ]);
    act(() => result.current.updateCellViewportsBatch(updates));

    expect(
      result.current.gridState.cells.find((c) => c.id === "0-0")?.viewport.zoom,
    ).toBe(5);
    expect(
      result.current.gridState.cells.find((c) => c.id === "0-1")?.viewport.zoom,
    ).toBe(6);
  });

  it("setCellRoiSelection and setCellLineProfile work per-cell", () => {
    const { result } = renderHook(() => useGridActions(), { wrapper });
    act(() => result.current.setGridEnabled(true));

    const roi = { x: 0, y: 0, width: 10, height: 10 };
    act(() => result.current.setCellRoiSelection("0-0", roi));
    expect(
      result.current.gridState.cells.find((c) => c.id === "0-0")?.roiSelection,
    ).toEqual(roi);

    const lp = { x1: 0, y1: 0, x2: 50, y2: 50 };
    act(() => result.current.setCellLineProfile("0-0", lp));
    expect(
      result.current.gridState.cells.find((c) => c.id === "0-0")?.lineProfile,
    ).toEqual(lp);
  });

  it("setAllCellsRoiSelection sets roi on all cells (value)", () => {
    const { result } = renderHook(() => useGridActions(), { wrapper });
    act(() => result.current.setGridEnabled(true));

    const roi = { x: 5, y: 5, width: 20, height: 20 };
    act(() => result.current.setAllCellsRoiSelection(roi));

    for (const cell of result.current.gridState.cells) {
      expect(cell.roiSelection).toEqual(roi);
    }
  });

  it("setAllCellsRoiSelection with null clears all", () => {
    const { result } = renderHook(() => useGridActions(), { wrapper });
    act(() => result.current.setGridEnabled(true));

    act(() =>
      result.current.setAllCellsRoiSelection({
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      }),
    );
    act(() => result.current.setAllCellsRoiSelection(null));

    for (const cell of result.current.gridState.cells) {
      expect(cell.roiSelection).toBeNull();
    }
  });

  it("setAllCellsRoiSelection with function applies per-cell", () => {
    const { result } = renderHook(() => useGridActions(), { wrapper });
    act(() => result.current.setGridEnabled(true));

    act(() =>
      result.current.setAllCellsRoiSelection((cell) => ({
        x: 0,
        y: 0,
        width: 10,
        height: 10 + (cell.id === "0-0" ? 5 : 0),
      })),
    );

    expect(
      result.current.gridState.cells.find((c) => c.id === "0-0")?.roiSelection
        ?.height,
    ).toBe(15);
    expect(
      result.current.gridState.cells.find((c) => c.id === "0-1")?.roiSelection
        ?.height,
    ).toBe(10);
  });

  it("setAllCellsLineProfile sets and clears all cells", () => {
    const { result } = renderHook(() => useGridActions(), { wrapper });
    act(() => result.current.setGridEnabled(true));

    const lp = { x1: 0, y1: 0, x2: 99, y2: 99 };
    act(() => result.current.setAllCellsLineProfile(lp));

    for (const cell of result.current.gridState.cells) {
      expect(cell.lineProfile).toEqual(lp);
    }

    act(() => result.current.setAllCellsLineProfile(null));
    for (const cell of result.current.gridState.cells) {
      expect(cell.lineProfile).toBeNull();
    }
  });

  it("setAllCellsLineProfile with function applies per-cell", () => {
    const { result } = renderHook(() => useGridActions(), { wrapper });
    act(() => result.current.setGridEnabled(true));

    act(() =>
      result.current.setAllCellsLineProfile((cell) =>
        cell.id === "0-0" ? { x1: 0, y1: 0, x2: 10, y2: 10 } : null,
      ),
    );

    expect(
      result.current.gridState.cells.find((c) => c.id === "0-0")?.lineProfile,
    ).not.toBeNull();
    expect(
      result.current.gridState.cells.find((c) => c.id === "0-1")?.lineProfile,
    ).toBeNull();
  });

  it("setCellPixelInfo updates activeCellPixelInfo for active cell", () => {
    const { result } = renderHook(() => useGridActions(), { wrapper });
    act(() => result.current.setGridEnabled(true));
    act(() => result.current.setActiveCellId("0-0"));

    act(() =>
      result.current.setCellPixelInfo("0-0", {
        x: 5,
        y: 5,
        r: 255,
        g: 0,
        b: 0,
        a: 255,
      }),
    );
    expect(result.current.activeCellPixelInfo).toEqual({
      x: 5,
      y: 5,
      r: 255,
      g: 0,
      b: 0,
      a: 255,
    });
  });

  it("setCellPixelInfo ignores non-active cell", () => {
    const { result } = renderHook(() => useGridActions(), { wrapper });
    act(() => result.current.setGridEnabled(true));
    act(() => result.current.setActiveCellId("0-0"));

    act(() =>
      result.current.setCellPixelInfo("0-1", {
        x: 5,
        y: 5,
        r: 0,
        g: 255,
        b: 0,
        a: 255,
      }),
    );
    expect(result.current.activeCellPixelInfo).toBeNull();
  });

  it("setGridLayout preserves existing cell data", async () => {
    const { result } = renderHook(() => useGridActions(), { wrapper });

    act(() => result.current.setGridEnabled(true));
    await act(async () => {
      await result.current.loadImageToCell("0-0", createTestFile("keep.png"));
    });

    // Expand to 2x2 — cell 0-0 should keep its image
    act(() => result.current.setGridLayout({ rows: 2, cols: 2 }));

    const cell = result.current.gridState.cells.find((c) => c.id === "0-0");
    expect(cell?.image.name).toBe("keep.png");
    expect(result.current.gridState.cells.length).toBe(4);
  });

  it("setGridLayout retains activeCellId if still valid", async () => {
    const { result } = renderHook(() => useGridActions(), { wrapper });

    act(() => result.current.setGridLayout({ rows: 2, cols: 2 }));
    act(() => result.current.setActiveCellId("1-1"));

    // Shrink to 1x2 — cell "1-1" is gone, should reset to "0-0"
    act(() => result.current.setGridLayout({ rows: 1, cols: 2 }));
    expect(result.current.gridState.activeCellId).toBe("0-0");
  });

  it("closeImage also resets grid state", async () => {
    const { result } = renderHook(
      () => ({ store: useImageStore(), grid: useGridActions() }),
      { wrapper },
    );

    await act(async () => {
      await result.current.store.loadImage(createTestFile());
    });
    act(() => result.current.grid.setGridEnabled(true));

    act(() => result.current.store.closeImage());

    expect(result.current.grid.gridState.enabled).toBe(false);
    expect(result.current.grid.gridState.cells.length).toBe(0);
  });
});
