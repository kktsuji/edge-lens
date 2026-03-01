import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { ImageState, ViewportState } from "../types";

interface ImageStoreContextValue {
  image: ImageState;
  viewport: ViewportState;
  loadImage: (file: File) => Promise<void>;
  closeImage: () => void;
  setZoom: (zoom: number) => void;
  setPan: (panX: number, panY: number) => void;
  setViewport: (viewport: ViewportState) => void;
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

  const loadImage = useCallback(async (file: File) => {
    const bitmap = await createImageBitmap(file);
    const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = offscreen.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

    setImage({
      file,
      name: file.name,
      width: bitmap.width,
      height: bitmap.height,
      imageData,
      imageBitmap: bitmap,
    });
    setViewport(initialViewport);
  }, []);

  const closeImage = useCallback(() => {
    if (image.imageBitmap) {
      image.imageBitmap.close();
    }
    setImage(initialImage);
    setViewport(initialViewport);
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
        loadImage,
        closeImage,
        setZoom,
        setPan,
        setViewport,
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
