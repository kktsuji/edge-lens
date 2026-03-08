import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type {
  ImageState,
  LineProfile,
  RoiSelection,
  ToolMode,
  ViewportState,
} from "../types";

interface ImageStoreContextValue {
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
  setToolMode: (mode: ToolMode) => void;
  setRoiSelection: (roi: RoiSelection | null) => void;
  setLineProfile: (lp: LineProfile | null) => void;
  setIsTouchPinching: (v: boolean) => void;
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

const ImageStoreContext = createContext<ImageStoreContextValue | null>(null);

export function ImageStoreProvider({ children }: { children: ReactNode }) {
  const [image, setImage] = useState<ImageState>(initialImage);
  const [viewport, setViewport] = useState<ViewportState>(initialViewport);
  const [toolMode, setToolMode] = useState<ToolMode>("navigate");
  const [roiSelection, setRoiSelection] = useState<RoiSelection | null>(null);
  const [lineProfile, setLineProfile] = useState<LineProfile | null>(null);
  const [isTouchPinching, setIsTouchPinching] = useState(false);

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
  }, []);

  const closeImage = useCallback(() => {
    if (image.imageBitmap) {
      image.imageBitmap.close();
    }
    setImage(initialImage);
    setViewport(initialViewport);
    setToolMode("navigate");
    setRoiSelection(null);
    setLineProfile(null);
  }, [image.imageBitmap]);

  const setZoom = useCallback((zoom: number) => {
    setViewport((prev) => ({ ...prev, zoom }));
  }, []);

  const setPan = useCallback((panX: number, panY: number) => {
    setViewport((prev) => ({ ...prev, panX, panY }));
  }, []);

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
        setToolMode,
        setRoiSelection,
        setLineProfile,
        setIsTouchPinching,
      }}
    >
      {children}
    </ImageStoreContext.Provider>
  );
}

export function useImageStore(): ImageStoreContextValue {
  const ctx = useContext(ImageStoreContext);
  if (!ctx) {
    throw new Error("useImageStore must be used within ImageStoreProvider");
  }
  return ctx;
}
