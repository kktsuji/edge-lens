import { useRef } from "react";
import { Toolbar } from "./components/Toolbar";
import { Sidebar } from "./components/Sidebar";
import { useImageStore } from "./hooks/useImageStore";
import { useCanvas } from "./hooks/useCanvas";
import { DropZone } from "./features/image-loader/components/DropZone";
import { FilePickerButton } from "./features/image-loader/components/FilePickerButton";
import { CloseButton } from "./features/image-loader/components/CloseButton";
import { useZoom } from "./features/zoom/hooks/useZoom";
import { usePixelInspector } from "./features/pixel-inspector/hooks/usePixelInspector";
import { PixelInfoPanel } from "./features/pixel-inspector/components/PixelInfoPanel";
import { useHistogram } from "./features/histogram/hooks/useHistogram";
import { HistogramPanel } from "./features/histogram/components/HistogramPanel";
import { CookieConsent } from "./components/CookieConsent";

function App() {
  const { image } = useImageStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasImage = !!image.imageData;

  useCanvas(canvasRef);
  useZoom(canvasRef);
  const pixelInfo = usePixelInspector(canvasRef);
  const histogramData = useHistogram();

  return (
    <div className="flex h-screen flex-col bg-gray-900 text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Toolbar>
        <FilePickerButton />
        <CloseButton />
        {hasImage && (
          <span className="ml-2 text-xs text-gray-400">
            {image.name} ({image.width}×{image.height})
          </span>
        )}
      </Toolbar>
      <div className="flex min-h-0 flex-1">
        <main id="main-content" className="relative flex-1 overflow-hidden">
          {hasImage ? (
            <canvas ref={canvasRef} className="h-full w-full" />
          ) : (
            <DropZone />
          )}
        </main>
        <Sidebar>
          <PixelInfoPanel pixelInfo={pixelInfo} />
          <HistogramPanel data={histogramData} />
        </Sidebar>
      </div>
      <CookieConsent />
    </div>
  );
}

export default App;
