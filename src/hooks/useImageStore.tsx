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
  updateAllCellViewports: (fn: (vp: ViewportState) => ViewportState) => void;
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

  const loadImage = useCallback(async (file: File) => {
    const bitmap = await createImageBitmap(file);
    const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = offscreen.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2d context");
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

    setImage((prev) => {
      if (prev.imageBitmap) prev.imageBitmap.close();
      return {
        file,
        name: file.name,
        width: bitmap.width,
        height: bitmap.height,
        imageData,
        imageBitmap: bitmap,
      };
    });
    setViewport(initialViewport);
    setToolMode("navigate");
    setRoiSelection(null);
    setLineProfile(null);
    setIsTouchPinching(false);
  }, []);

  // Fix #2: use state updaters to read latest state instead of closures
  const closeImage = useCallback(() => {
    setImage((prev) => {
      if (prev.imageBitmap) prev.imageBitmap.close();
      return initialImage;
    });
    setGridState((prev) => {
      for (const cell of prev.cells) {
        if (cell.image.imageBitmap) {
          cell.image.imageBitmap.close();
        }
      }
      return { ...initialGridState };
    });
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
        // Restore cell "0-0" to single view, close other bitmaps
        const firstCell = prev.cells.find((c) => c.id === "0-0");
        if (firstCell?.image.imageBitmap) {
          setImage(firstCell.image);
          setViewport(firstCell.viewport);
          setRoiSelection(firstCell.roiSelection);
          setLineProfile(firstCell.lineProfile);
        }
        for (const cell of prev.cells) {
          if (cell.id !== "0-0" && cell.image.imageBitmap) {
            cell.image.imageBitmap.close();
          }
        }
        return { ...initialGridState };
      }
      return prev;
    });
  }, []);

  const setGridLayout = useCallback((layout: GridLayout) => {
    // 1×1 means "return to single view"
    if (layout.rows === 1 && layout.cols === 1) {
      setGridState((prev) => {
        if (!prev.enabled) return prev;
        const firstCell = prev.cells.find((c) => c.id === "0-0");
        if (firstCell?.image.imageBitmap) {
          setImage(firstCell.image);
          setViewport(firstCell.viewport);
          setRoiSelection(firstCell.roiSelection);
          setLineProfile(firstCell.lineProfile);
        }
        for (const cell of prev.cells) {
          if (cell.id !== "0-0" && cell.image.imageBitmap) {
            cell.image.imageBitmap.close();
          }
        }
        return { ...initialGridState };
      });
      setRefitKey((k) => k + 1);
      return;
    }

    setGridState((prev) => {
      // Close bitmaps for cells that will be removed
      const newIds = new Set<string>();
      for (let r = 0; r < layout.rows; r++) {
        for (let c = 0; c < layout.cols; c++) {
          newIds.add(`${r}-${c}`);
        }
      }
      for (const cell of prev.cells) {
        if (!newIds.has(cell.id) && cell.image.imageBitmap) {
          cell.image.imageBitmap.close();
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
  }, []);

  const setGridPositionLocked = useCallback((locked: boolean) => {
    setGridState((prev) => ({ ...prev, positionLocked: locked }));
  }, []);

  const setActiveCellId = useCallback((id: string | null) => {
    setGridState((prev) => ({ ...prev, activeCellId: id }));
    setActiveCellPixelInfo(null);
  }, []);

  const loadImageToCell = useCallback(async (cellId: string, file: File) => {
    const bitmap = await createImageBitmap(file);
    const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = offscreen.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2d context");
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

    setGridState((prev) => ({
      ...prev,
      cells: prev.cells.map((cell) => {
        if (cell.id !== cellId) return cell;
        if (cell.image.imageBitmap) cell.image.imageBitmap.close();
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
  }, []);

  const closeCellImage = useCallback((cellId: string) => {
    setGridState((prev) => ({
      ...prev,
      cells: prev.cells.map((cell) => {
        if (cell.id !== cellId) return cell;
        if (cell.image.imageBitmap) cell.image.imageBitmap.close();
        return createEmptyCell(cellId);
      }),
    }));
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
    (fn: (vp: ViewportState) => ViewportState) => {
      setGridState((prev) => ({
        ...prev,
        cells: prev.cells.map((cell) => ({
          ...cell,
          viewport: fn(cell.viewport),
        })),
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
