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
  const gridStateRef = useRef(gridState);
  gridStateRef.current = gridState;

  // Ref for active cell id so setCellPixelInfo stays stable (#1)
  const activeCellIdRef = useRef(gridState.activeCellId);
  activeCellIdRef.current = gridState.activeCellId;

  // Track load version per cell to prevent race conditions (Bug #2)
  const cellLoadVersionRef = useRef(new Map<string, number>());

  // Track load version for single-view to prevent race conditions
  const singleLoadVersionRef = useRef(0);

  const loadImage = useCallback(async (file: File) => {
    const version = ++singleLoadVersionRef.current;
    const bitmap = await createImageBitmap(file);
    try {
      // A newer load has started — discard this result
      if (singleLoadVersionRef.current !== version) {
        bitmap.close();
        return;
      }

      const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = offscreen.getContext("2d");
      if (!ctx) throw new Error("Failed to get 2d context");
      ctx.drawImage(bitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

      // Close the previous bitmap before replacing it.
      // Read from ref because React 19 may defer setState updaters.
      imageRef.current.imageBitmap?.close();
      setImage({
        file,
        name: file.name,
        width: bitmap.width,
        height: bitmap.height,
        imageData,
        imageBitmap: bitmap,
      });
      setViewport(initialViewport);
      setToolMode("navigate");
      setRoiSelection(null);
      setLineProfile(null);
      setIsTouchPinching(false);
    } catch (err) {
      bitmap.close();
      throw err;
    }
  }, []);

  // Fix #2: use state updaters to read latest state instead of closures
  const closeImage = useCallback(() => {
    // Collect bitmaps to close from refs before resetting state.
    // React 19 may defer setState updaters, so we cannot rely on
    // reading prev inside the updater and closing after setState.
    const bitmapsToClose = new Set<ImageBitmap>();
    if (imageRef.current.imageBitmap) {
      bitmapsToClose.add(imageRef.current.imageBitmap);
    }
    for (const cell of gridStateRef.current.cells) {
      if (cell.image.imageBitmap) {
        bitmapsToClose.add(cell.image.imageBitmap);
      }
    }
    setImage(initialImage);
    setGridState({ ...initialGridState });
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
    const prev = gridStateRef.current;
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
      setGridState({
        ...prev,
        enabled: true,
        layout,
        cells,
        activeCellId: "0-0",
      });
    } else if (!enabled && prev.enabled) {
      // Read cell "0-0" and collect bitmaps from refs before resetting state
      const restoreCell = prev.cells.find((c) => c.id === "0-0") ?? null;
      const bitmapsToClose: ImageBitmap[] = [];
      for (const cell of prev.cells) {
        if (cell.id !== "0-0" && cell.image.imageBitmap) {
          bitmapsToClose.push(cell.image.imageBitmap);
        }
      }
      setGridState({ ...initialGridState });
      // Restore single-view state from cell "0-0"
      if (restoreCell?.image.imageBitmap) {
        setImage(restoreCell.image);
        setViewport(restoreCell.viewport);
        setRoiSelection(restoreCell.roiSelection);
        setLineProfile(restoreCell.lineProfile);
      } else if (restoreCell) {
        setImage(initialImage);
        setViewport(initialViewport);
        setRoiSelection(null);
        setLineProfile(null);
      }
      for (const b of bitmapsToClose) b.close();
    }
    setRefitKey((k) => k + 1);
  }, []);

  const setGridLayout = useCallback((layout: GridLayout) => {
    // Clamp layout to valid bounds (1–4 rows/cols)
    const rows = Math.max(1, Math.min(4, Math.round(layout.rows)));
    const cols = Math.max(1, Math.min(4, Math.round(layout.cols)));
    const normalized = { rows, cols };
    const prev = gridStateRef.current;

    // 1×1 means "return to single view"
    if (normalized.rows === 1 && normalized.cols === 1) {
      if (!prev.enabled) return;
      const restoreCell = prev.cells.find((c) => c.id === "0-0") ?? null;
      const bitmapsToClose: ImageBitmap[] = [];
      for (const cell of prev.cells) {
        if (cell.id !== "0-0" && cell.image.imageBitmap) {
          bitmapsToClose.push(cell.image.imageBitmap);
        }
      }
      setGridState({ ...initialGridState });
      // Restore single-view state from cell "0-0"
      if (restoreCell?.image.imageBitmap) {
        setImage(restoreCell.image);
        setViewport(restoreCell.viewport);
        setRoiSelection(restoreCell.roiSelection);
        setLineProfile(restoreCell.lineProfile);
      } else {
        setImage(initialImage);
        setViewport(initialViewport);
        setRoiSelection(null);
        setLineProfile(null);
      }
      for (const b of bitmapsToClose) b.close();
      setRefitKey((k) => k + 1);
      return;
    }

    // Collect bitmaps for cells that will be removed
    const newIds = new Set<string>();
    for (let r = 0; r < normalized.rows; r++) {
      for (let c = 0; c < normalized.cols; c++) {
        newIds.add(`${r}-${c}`);
      }
    }
    const bitmapsToClose: ImageBitmap[] = [];
    for (const cell of prev.cells) {
      if (!newIds.has(cell.id) && cell.image.imageBitmap) {
        bitmapsToClose.push(cell.image.imageBitmap);
      }
    }
    const img = imageRef.current;
    const vp = viewportRef.current;
    const roi = roiSelectionRef.current;
    const lp = lineProfileRef.current;
    const cells = buildCellGrid(normalized, prev.cells).map((c) => {
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
    setGridState({
      ...prev,
      layout: normalized,
      cells,
      enabled: true,
      activeCellId,
      layoutVersion: prev.layoutVersion + 1,
    });
    for (const b of bitmapsToClose) b.close();

    // Clean up version map for removed cells
    const versionMap = cellLoadVersionRef.current;
    for (const cell of prev.cells) {
      if (!newIds.has(cell.id)) {
        versionMap.delete(cell.id);
      }
    }
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
    try {
      const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = offscreen.getContext("2d");
      if (!ctx) throw new Error("Failed to get 2d context");
      ctx.drawImage(bitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

      // A newer load has started for this cell — discard this result
      if (versionMap.get(cellId) !== version) {
        bitmap.close();
        return;
      }

      // Close old cell bitmap from ref before replacing state
      const oldCell = gridStateRef.current.cells.find((c) => c.id === cellId);
      const oldBitmap = oldCell?.image.imageBitmap;
      setGridState((prev) => ({
        ...prev,
        cells: prev.cells.map((cell) => {
          if (cell.id !== cellId) return cell;
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
      oldBitmap?.close();
    } catch (err) {
      bitmap.close();
      throw err;
    }
  }, []);

  const closeCellImage = useCallback((cellId: string) => {
    // Bump load version so any in-flight loadImageToCell is discarded
    const versionMap = cellLoadVersionRef.current;
    versionMap.set(cellId, (versionMap.get(cellId) ?? 0) + 1);

    // Close old cell bitmap from ref before replacing state
    const oldCell = gridStateRef.current.cells.find((c) => c.id === cellId);
    const oldBitmap = oldCell?.image.imageBitmap;
    setGridState((prev) => ({
      ...prev,
      cells: prev.cells.map((cell) =>
        cell.id === cellId ? createEmptyCell(cellId) : cell,
      ),
    }));
    oldBitmap?.close();
    versionMap.delete(cellId);
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

  const storeValue = useMemo<ImageStoreContextValue>(
    () => ({
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
    }),
    [
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
      setToolMode,
      setRoiSelection,
      setLineProfile,
      setIsTouchPinching,
    ],
  );

  return (
    <ImageStoreContext.Provider value={storeValue}>
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
