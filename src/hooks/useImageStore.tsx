import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  GridCellState,
  GridLayout,
  GridState,
  ImageState,
  LineProfile,
  PixelInfo,
  RoiSelection,
  ToolMode,
  ViewportState,
} from "../types";

export interface ImageStoreContextValue {
  image: ImageState;
  viewport: ViewportState;
  toolMode: ToolMode;
  roiSelection: RoiSelection | null;
  lineProfile: LineProfile | null;
  isTouchPinching: boolean;
  refitKey: number;
  loadImage: (file: File) => Promise<void>;
  closeImage: () => void;
  setZoom: (zoom: number) => void;
  setPan: (panX: number, panY: number) => void;
  setViewport: (viewport: ViewportState) => void;
  setViewportLocal: (viewport: ViewportState) => void;
  setToolMode: (mode: ToolMode) => void;
  setRoiSelection: (roi: RoiSelection | null) => void;
  setLineProfile: (lp: LineProfile | null) => void;
  setIsTouchPinching: (v: boolean) => void;
}

export interface GridActions {
  gridState: GridState;
  activeCellPixelInfo: PixelInfo | null;
  setGridEnabled: (enabled: boolean) => void;
  setGridLayout: (layout: GridLayout) => void;
  setGridPositionLocked: (locked: boolean) => void;
  setActiveCellId: (id: string | null) => void;
  loadImageToCell: (cellId: string, file: File) => Promise<void>;
  closeCellImage: (cellId: string) => void;
  updateCellViewport: (cellId: string, viewport: ViewportState) => void;
  updateAllCellViewports: (
    fn: (vp: ViewportState, cellId: string) => ViewportState,
  ) => void;
  updateCellViewportsBatch: (updates: Map<string, ViewportState>) => void;
  setCellRoiSelection: (cellId: string, roi: RoiSelection | null) => void;
  setCellLineProfile: (cellId: string, lp: LineProfile | null) => void;
  setCellPixelInfo: (cellId: string, info: PixelInfo | null) => void;
  setAllCellsRoiSelection: (
    roi: RoiSelection | null | ((cell: GridCellState) => RoiSelection | null),
  ) => void;
  setAllCellsLineProfile: (
    lp: LineProfile | null | ((cell: GridCellState) => LineProfile | null),
  ) => void;
}

const initialImage: ImageState = {
  file: null,
  name: "",
  width: 0,
  height: 0,
  imageData: null,
  imageBitmap: null,
};

const initialViewport: ViewportState = {
  zoom: 1,
  panX: 0,
  panY: 0,
};

const initialGridState: GridState = {
  enabled: false,
  layout: { rows: 1, cols: 1 },
  cells: [],
  activeCellId: null,
  positionLocked: true,
  layoutVersion: 0,
};

function createEmptyCell(id: string): GridCellState {
  return {
    id,
    image: { ...initialImage },
    viewport: { ...initialViewport },
    roiSelection: null,
    lineProfile: null,
  };
}

function buildCellGrid(
  layout: GridLayout,
  existingCells: GridCellState[],
): GridCellState[] {
  const cells: GridCellState[] = [];
  for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c < layout.cols; c++) {
      const id = `${r}-${c}`;
      const existing = existingCells.find((cell) => cell.id === id);
      cells.push(existing ? { ...existing } : createEmptyCell(id));
    }
  }
  return cells;
}

export const ImageStoreContext = createContext<ImageStoreContextValue | null>(
  null,
);
export const GridCellContext = createContext<ImageStoreContextValue | null>(
  null,
);
export const GridActionsContext = createContext<GridActions | null>(null);

export function ImageStoreProvider({ children }: { children: ReactNode }) {
  const [image, setImage] = useState<ImageState>(initialImage);
  const [viewport, setViewport] = useState<ViewportState>(initialViewport);
  const [toolMode, setToolMode] = useState<ToolMode>("navigate");
  const [roiSelection, setRoiSelection] = useState<RoiSelection | null>(null);
  const [lineProfile, setLineProfile] = useState<LineProfile | null>(null);
  const [isTouchPinching, setIsTouchPinching] = useState(false);
  const [gridState, setGridState] = useState<GridState>(initialGridState);
  const [refitKey, setRefitKey] = useState(0);
  const [activeCellPixelInfo, setActiveCellPixelInfo] =
    useState<PixelInfo | null>(null);

  // Refs for single-view state so grid callbacks stay stable (#3, #7)
  const imageRef = useRef(image);
  imageRef.current = image;
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;
  const roiSelectionRef = useRef(roiSelection);
  roiSelectionRef.current = roiSelection;
  const lineProfileRef = useRef(lineProfile);
  lineProfileRef.current = lineProfile;

  // Ref for active cell id so setCellPixelInfo stays stable (#1)
  const activeCellIdRef = useRef(gridState.activeCellId);
  activeCellIdRef.current = gridState.activeCellId;

  // Track load version per cell to prevent race conditions (Bug #2)
  const cellLoadVersionRef = useRef(new Map<string, number>());

  const loadImage = useCallback(async (file: File) => {
    const bitmap = await createImageBitmap(file);
    const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = offscreen.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2d context");
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

    const stale: { bitmap: ImageBitmap | null } = { bitmap: null };
    setImage((prev) => {
      stale.bitmap = prev.imageBitmap;
      return {
        file,
        name: file.name,
        width: bitmap.width,
        height: bitmap.height,
        imageData,
        imageBitmap: bitmap,
      };
    });
    stale.bitmap?.close();
    setViewport(initialViewport);
    setToolMode("navigate");
    setRoiSelection(null);
    setLineProfile(null);
    setIsTouchPinching(false);
  }, []);

  // Fix #2: use state updaters to read latest state instead of closures
  const closeImage = useCallback(() => {
    const stale: { bitmap: ImageBitmap | null } = { bitmap: null };
    setImage((prev) => {
      stale.bitmap = prev.imageBitmap;
      return initialImage;
    });
    const bitmapsToClose = new Set<ImageBitmap>();
    if (stale.bitmap) bitmapsToClose.add(stale.bitmap);
    setGridState((prev) => {
      for (const cell of prev.cells) {
        if (cell.image.imageBitmap) {
          bitmapsToClose.add(cell.image.imageBitmap);
        }
      }
      return { ...initialGridState };
    });
    for (const b of bitmapsToClose) b.close();
    setViewport(initialViewport);
    setToolMode("navigate");
    setRoiSelection(null);
    setLineProfile(null);
    setIsTouchPinching(false);
    setActiveCellPixelInfo(null);
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setViewport((prev) => ({ ...prev, zoom }));
  }, []);

  const setPan = useCallback((panX: number, panY: number) => {
    setViewport((prev) => ({ ...prev, panX, panY }));
  }, []);

  // --- Grid actions ---

  // Fix #3, #7: read single-view state from refs, avoid state mutation
  const setGridEnabled = useCallback((enabled: boolean) => {
    const bitmapsToClose: ImageBitmap[] = [];
    const restore: { cell: GridCellState | null } = { cell: null };
    setGridState((prev) => {
      if (enabled && !prev.enabled) {
        const layout =
          prev.layout.rows === 1 && prev.layout.cols === 1
            ? { rows: 1, cols: 2 }
            : prev.layout;
        const img = imageRef.current;
        const vp = viewportRef.current;
        const roi = roiSelectionRef.current;
        const lp = lineProfileRef.current;
        const cells = buildCellGrid(layout, prev.cells).map((c) => {
          if (c.id === "0-0" && img.imageData) {
            return {
              ...c,
              image: { ...img },
              viewport: { ...vp },
              roiSelection: roi,
              lineProfile: lp,
            };
          }
          return c;
        });
        return {
          ...prev,
          enabled: true,
          layout,
          cells,
          activeCellId: "0-0",
        };
      }
      if (!enabled && prev.enabled) {
        // Capture cell "0-0" for restoration after updater returns
        restore.cell = prev.cells.find((c) => c.id === "0-0") ?? null;
        for (const cell of prev.cells) {
          if (cell.id !== "0-0" && cell.image.imageBitmap) {
            bitmapsToClose.push(cell.image.imageBitmap);
          }
        }
        return { ...initialGridState };
      }
      return prev;
    });
    // Restore single-view state AFTER the updater returns
    if (restore.cell?.image.imageBitmap) {
      setImage(restore.cell.image);
      setViewport(restore.cell.viewport);
      setRoiSelection(restore.cell.roiSelection);
      setLineProfile(restore.cell.lineProfile);
    } else if (restore.cell) {
      // Cell 0-0 exists but has no image — reset to clean state
      setImage(initialImage);
      setViewport(initialViewport);
      setRoiSelection(null);
      setLineProfile(null);
    }
    for (const b of bitmapsToClose) b.close();
    setRefitKey((k) => k + 1);
  }, []);

  const setGridLayout = useCallback((layout: GridLayout) => {
    // 1×1 means "return to single view"
    if (layout.rows === 1 && layout.cols === 1) {
      const bitmapsToClose: ImageBitmap[] = [];
      const restore: { cell: GridCellState | null } = { cell: null };
      setGridState((prev) => {
        if (!prev.enabled) return prev;
        restore.cell = prev.cells.find((c) => c.id === "0-0") ?? null;
        for (const cell of prev.cells) {
          if (cell.id !== "0-0" && cell.image.imageBitmap) {
            bitmapsToClose.push(cell.image.imageBitmap);
          }
        }
        return { ...initialGridState };
      });
      // Restore single-view state AFTER the updater returns
      if (restore.cell?.image.imageBitmap) {
        setImage(restore.cell.image);
        setViewport(restore.cell.viewport);
        setRoiSelection(restore.cell.roiSelection);
        setLineProfile(restore.cell.lineProfile);
      } else {
        // Cell 0-0 missing or has no image — reset to clean state
        setImage(initialImage);
        setViewport(initialViewport);
        setRoiSelection(null);
        setLineProfile(null);
      }
      for (const b of bitmapsToClose) b.close();
      setRefitKey((k) => k + 1);
      return;
    }

    const bitmapsToClose: ImageBitmap[] = [];
    setGridState((prev) => {
      // Collect bitmaps for cells that will be removed
      const newIds = new Set<string>();
      for (let r = 0; r < layout.rows; r++) {
        for (let c = 0; c < layout.cols; c++) {
          newIds.add(`${r}-${c}`);
        }
      }
      for (const cell of prev.cells) {
        if (!newIds.has(cell.id) && cell.image.imageBitmap) {
          bitmapsToClose.push(cell.image.imageBitmap);
        }
      }
      const img = imageRef.current;
      const vp = viewportRef.current;
      const roi = roiSelectionRef.current;
      const lp = lineProfileRef.current;
      const cells = buildCellGrid(layout, prev.cells).map((c) => {
        // Copy single-view image to cell "0-0" when transitioning to grid
        if (!prev.enabled && c.id === "0-0" && img.imageData) {
          return {
            ...c,
            image: { ...img },
            viewport: { ...vp },
            roiSelection: roi,
            lineProfile: lp,
          };
        }
        return c;
      });
      const activeCellId =
        prev.activeCellId && newIds.has(prev.activeCellId)
          ? prev.activeCellId
          : "0-0";
      return {
        ...prev,
        layout,
        cells,
        enabled: true,
        activeCellId,
        layoutVersion: prev.layoutVersion + 1,
      };
    });
    for (const b of bitmapsToClose) b.close();
  }, []);

  const setGridPositionLocked = useCallback((locked: boolean) => {
    setGridState((prev) => ({ ...prev, positionLocked: locked }));
  }, []);

  const setActiveCellId = useCallback((id: string | null) => {
    setGridState((prev) => ({ ...prev, activeCellId: id }));
    setActiveCellPixelInfo(null);
  }, []);

  const loadImageToCell = useCallback(async (cellId: string, file: File) => {
    // Track load version to prevent race conditions
    const versionMap = cellLoadVersionRef.current;
    const version = (versionMap.get(cellId) ?? 0) + 1;
    versionMap.set(cellId, version);

    const bitmap = await createImageBitmap(file);
    const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = offscreen.getContext("2d");
    if (!ctx) {
      bitmap.close();
      throw new Error("Failed to get 2d context");
    }
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

    // A newer load has started for this cell — discard this result
    if (versionMap.get(cellId) !== version) {
      bitmap.close();
      return;
    }

    const stale: { bitmap: ImageBitmap | null } = { bitmap: null };
    setGridState((prev) => ({
      ...prev,
      cells: prev.cells.map((cell) => {
        if (cell.id !== cellId) return cell;
        stale.bitmap = cell.image.imageBitmap;
        return {
          ...cell,
          image: {
            file,
            name: file.name,
            width: bitmap.width,
            height: bitmap.height,
            imageData,
            imageBitmap: bitmap,
          },
          viewport: { ...initialViewport },
          roiSelection: null,
          lineProfile: null,
        };
      }),
    }));
    stale.bitmap?.close();
  }, []);

  const closeCellImage = useCallback((cellId: string) => {
    // Bump load version so any in-flight loadImageToCell is discarded
    const versionMap = cellLoadVersionRef.current;
    versionMap.set(cellId, (versionMap.get(cellId) ?? 0) + 1);

    const stale: { bitmap: ImageBitmap | null } = { bitmap: null };
    setGridState((prev) => ({
      ...prev,
      cells: prev.cells.map((cell) => {
        if (cell.id !== cellId) return cell;
        stale.bitmap = cell.image.imageBitmap;
        return createEmptyCell(cellId);
      }),
    }));
    stale.bitmap?.close();
  }, []);

  const updateCellViewport = useCallback(
    (cellId: string, vp: ViewportState) => {
      setGridState((prev) => ({
        ...prev,
        cells: prev.cells.map((cell) =>
          cell.id === cellId ? { ...cell, viewport: vp } : cell,
        ),
      }));
    },
    [],
  );

  const updateAllCellViewports = useCallback(
    (fn: (vp: ViewportState, cellId: string) => ViewportState) => {
      setGridState((prev) => ({
        ...prev,
        cells: prev.cells.map((cell) => ({
          ...cell,
          viewport: fn(cell.viewport, cell.id),
        })),
      }));
    },
    [],
  );

  const updateCellViewportsBatch = useCallback(
    (updates: Map<string, ViewportState>) => {
      setGridState((prev) => ({
        ...prev,
        cells: prev.cells.map((cell) => {
          const vp = updates.get(cell.id);
          return vp ? { ...cell, viewport: vp } : cell;
        }),
      }));
    },
    [],
  );

  const setCellRoiSelection = useCallback(
    (cellId: string, roi: RoiSelection | null) => {
      setGridState((prev) => ({
        ...prev,
        cells: prev.cells.map((cell) =>
          cell.id === cellId ? { ...cell, roiSelection: roi } : cell,
        ),
      }));
    },
    [],
  );

  const setCellLineProfile = useCallback(
    (cellId: string, lp: LineProfile | null) => {
      setGridState((prev) => ({
        ...prev,
        cells: prev.cells.map((cell) =>
          cell.id === cellId ? { ...cell, lineProfile: lp } : cell,
        ),
      }));
    },
    [],
  );

  // Fix #1: only update lightweight state for active cell, skip gridState
  const setCellPixelInfo = useCallback(
    (cellId: string, info: PixelInfo | null) => {
      if (cellId === activeCellIdRef.current) {
        setActiveCellPixelInfo(info);
      }
    },
    [],
  );

  const setAllCellsRoiSelection = useCallback(
    (
      roiOrFn:
        | RoiSelection
        | null
        | ((cell: GridCellState) => RoiSelection | null),
    ) => {
      setGridState((prev) => ({
        ...prev,
        cells: prev.cells.map((cell) => ({
          ...cell,
          roiSelection: typeof roiOrFn === "function" ? roiOrFn(cell) : roiOrFn,
        })),
      }));
    },
    [],
  );

  const setAllCellsLineProfile = useCallback(
    (
      lpOrFn:
        | LineProfile
        | null
        | ((cell: GridCellState) => LineProfile | null),
    ) => {
      setGridState((prev) => ({
        ...prev,
        cells: prev.cells.map((cell) => ({
          ...cell,
          lineProfile: typeof lpOrFn === "function" ? lpOrFn(cell) : lpOrFn,
        })),
      }));
    },
    [],
  );

  // Fix #6: memoize gridActions so consumers don't re-render on every render
  const gridActions: GridActions = useMemo(
    () => ({
      gridState,
      activeCellPixelInfo,
      setGridEnabled,
      setGridLayout,
      setGridPositionLocked,
      setActiveCellId,
      loadImageToCell,
      closeCellImage,
      updateCellViewport,
      updateAllCellViewports,
      updateCellViewportsBatch,
      setCellRoiSelection,
      setCellLineProfile,
      setCellPixelInfo,
      setAllCellsRoiSelection,
      setAllCellsLineProfile,
    }),
    [
      gridState,
      activeCellPixelInfo,
      setGridEnabled,
      setGridLayout,
      setGridPositionLocked,
      setActiveCellId,
      loadImageToCell,
      closeCellImage,
      updateCellViewport,
      updateAllCellViewports,
      updateCellViewportsBatch,
      setCellRoiSelection,
      setCellLineProfile,
      setCellPixelInfo,
      setAllCellsRoiSelection,
      setAllCellsLineProfile,
    ],
  );

  return (
    <ImageStoreContext.Provider
      value={{
        image,
        viewport,
        toolMode,
        roiSelection,
        lineProfile,
        isTouchPinching,
        refitKey,
        loadImage,
        closeImage,
        setZoom,
        setPan,
        setViewport,
        setViewportLocal: setViewport,
        setToolMode,
        setRoiSelection,
        setLineProfile,
        setIsTouchPinching,
      }}
    >
      <GridActionsContext.Provider value={gridActions}>
        {children}
      </GridActionsContext.Provider>
    </ImageStoreContext.Provider>
  );
}

export function useImageStore(): ImageStoreContextValue {
  const ctx = useContext(ImageStoreContext);
  const cellCtx = useContext(GridCellContext);
  if (cellCtx) return cellCtx;
  if (!ctx) {
    throw new Error("useImageStore must be used within ImageStoreProvider");
  }
  return ctx;
}

export function useGridActions(): GridActions {
  const ctx = useContext(GridActionsContext);
  if (!ctx) {
    throw new Error("useGridActions must be used within ImageStoreProvider");
  }
  return ctx;
}
