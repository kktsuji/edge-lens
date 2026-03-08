import {
  createContext,
  useCallback,
  useContext,
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
};

function createEmptyCell(id: string): GridCellState {
  return {
    id,
    image: { ...initialImage },
    viewport: { ...initialViewport },
    roiSelection: null,
    lineProfile: null,
    pixelInfo: null,
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
      cells.push(existing ?? createEmptyCell(id));
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

  const loadImage = useCallback(async (file: File) => {
    const bitmap = await createImageBitmap(file);
    const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = offscreen.getContext("2d")!;
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

  const closeImage = useCallback(() => {
    if (image.imageBitmap) {
      image.imageBitmap.close();
    }
    // Close all grid cell ImageBitmaps
    for (const cell of gridState.cells) {
      if (cell.image.imageBitmap) {
        cell.image.imageBitmap.close();
      }
    }
    setGridState({ ...initialGridState });
    setImage(initialImage);
    setViewport(initialViewport);
    setToolMode("navigate");
    setRoiSelection(null);
    setLineProfile(null);
    setIsTouchPinching(false);
  }, [image.imageBitmap, gridState.cells]);

  const setZoom = useCallback((zoom: number) => {
    setViewport((prev) => ({ ...prev, zoom }));
  }, []);

  const setPan = useCallback((panX: number, panY: number) => {
    setViewport((prev) => ({ ...prev, panX, panY }));
  }, []);

  // --- Grid actions ---

  const setGridEnabled = useCallback(
    (enabled: boolean) => {
      setGridState((prev) => {
        if (enabled && !prev.enabled) {
          const layout =
            prev.layout.rows === 1 && prev.layout.cols === 1
              ? { rows: 1, cols: 2 }
              : prev.layout;
          const cells = buildCellGrid(layout, prev.cells);
          // Move current single-view image to cell "0-0" if it exists
          const firstCell = cells.find((c) => c.id === "0-0");
          if (firstCell && image.imageData) {
            firstCell.image = { ...image };
            firstCell.viewport = { ...viewport };
            firstCell.roiSelection = roiSelection;
            firstCell.lineProfile = lineProfile;
          }
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
          // Close bitmaps on non-first cells
          for (const cell of prev.cells) {
            if (cell.id !== "0-0" && cell.image.imageBitmap) {
              cell.image.imageBitmap.close();
            }
          }
          return { ...initialGridState };
        }
        return prev;
      });
    },
    [image, viewport, roiSelection, lineProfile],
  );

  const setGridLayout = useCallback(
    (layout: GridLayout) => {
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
        const cells = buildCellGrid(layout, prev.cells);
        // Copy single-view image to cell "0-0" when transitioning to grid
        if (!prev.enabled) {
          const firstCell = cells.find((c) => c.id === "0-0");
          if (firstCell && image.imageData) {
            firstCell.image = { ...image };
            firstCell.viewport = { ...viewport };
            firstCell.roiSelection = roiSelection;
            firstCell.lineProfile = lineProfile;
          }
        }
        const activeCellId =
          prev.activeCellId && newIds.has(prev.activeCellId)
            ? prev.activeCellId
            : "0-0";
        return { ...prev, layout, cells, enabled: true, activeCellId };
      });
    },
    [image, viewport, roiSelection, lineProfile],
  );

  const setGridPositionLocked = useCallback((locked: boolean) => {
    setGridState((prev) => ({ ...prev, positionLocked: locked }));
  }, []);

  const setActiveCellId = useCallback((id: string | null) => {
    setGridState((prev) => ({ ...prev, activeCellId: id }));
  }, []);

  const loadImageToCell = useCallback(async (cellId: string, file: File) => {
    const bitmap = await createImageBitmap(file);
    const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = offscreen.getContext("2d")!;
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
          pixelInfo: null,
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

  const setCellPixelInfo = useCallback(
    (cellId: string, info: PixelInfo | null) => {
      setGridState((prev) => ({
        ...prev,
        cells: prev.cells.map((cell) =>
          cell.id === cellId ? { ...cell, pixelInfo: info } : cell,
        ),
      }));
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

  const gridActions: GridActions = {
    gridState,
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
  };

  return (
    <ImageStoreContext.Provider
      value={{
        image,
        viewport,
        toolMode,
        roiSelection,
        lineProfile,
        isTouchPinching,
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
