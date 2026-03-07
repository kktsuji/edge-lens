import { useCallback, useRef, useState, type DragEvent } from "react";
import { CookieConsent } from "./components/CookieConsent";
import { HelpButton } from "./components/HelpButton";
import { KeyboardShortcutsHelp } from "./components/KeyboardShortcutsHelp";
import { Sidebar } from "./components/Sidebar";
import { Toolbar } from "./components/Toolbar";
import { HistogramPanel } from "./features/histogram/components/HistogramPanel";
import { useHistogram } from "./features/histogram/hooks/useHistogram";
import { CloseButton } from "./features/image-loader/components/CloseButton";
import { DropZone } from "./features/image-loader/components/DropZone";
import { FilePickerButton } from "./features/image-loader/components/FilePickerButton";
import { PixelInfoPanel } from "./features/pixel-inspector/components/PixelInfoPanel";
import { usePixelInspector } from "./features/pixel-inspector/hooks/usePixelInspector";
import { useZoom } from "./features/zoom/hooks/useZoom";
import { useCanvas } from "./hooks/useCanvas";
import { useImageStore } from "./hooks/useImageStore";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { validateImageFile } from "./utils/validation";

function App() {
  const { image, loadImage, closeImage } = useImageStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasImage = !!image.imageData;

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      setIsDraggingOver(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const result = validateImageFile(file);
      if (!result.valid) return;
      try {
        await loadImage(file);
      } catch {
        // ignore unsupported format silently when dropping on canvas
      }
    },
    [loadImage],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  useCanvas(canvasRef);
  useZoom(canvasRef);
  useKeyboardShortcuts(canvasRef, {
    onOpenFile: () => fileInputRef.current?.click(),
    onCloseImage: closeImage,
    isHelpOpen,
    onToggleHelp: () => setIsHelpOpen((v) => !v),
  });
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
        <FilePickerButton inputRef={fileInputRef} />
        <CloseButton />
        {hasImage && (
          <span className="ml-2 text-xs text-gray-400">
            {image.name} ({image.width}×{image.height})
          </span>
        )}
        <HelpButton onClick={() => setIsHelpOpen((v) => !v)} />
      </Toolbar>
      <div className="flex min-h-0 flex-1">
        <main id="main-content" className="relative flex-1 overflow-hidden">
          {hasImage ? (
            <div
              className="relative h-full w-full"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <canvas ref={canvasRef} className="h-full w-full" />
              {isDraggingOver && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center border-2 border-dashed border-blue-400 bg-blue-400/20">
                  <p className="text-lg font-medium text-blue-300">
                    Drop to replace image
                  </p>
                </div>
              )}
            </div>
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
      {isHelpOpen && (
        <KeyboardShortcutsHelp onClose={() => setIsHelpOpen(false)} />
      )}
    </div>
  );
}

export default App;
