import { useCallback, useRef, useState, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { CookieConsent } from "./components/CookieConsent";
import { HelpButton } from "./components/HelpButton";
import { KeyboardShortcutsHelp } from "./components/KeyboardShortcutsHelp";
import { KeyboardShortcutsPanel } from "./components/KeyboardShortcutsPanel";
import { Sidebar } from "./components/Sidebar";
import { Toolbar } from "./components/Toolbar";
import { HistogramPanel } from "./features/histogram/components/HistogramPanel";
import { ImageStatsPanel } from "./features/histogram/components/ImageStatsPanel";
import { useHistogram } from "./features/histogram/hooks/useHistogram";
import { CloseButton } from "./features/image-loader/components/CloseButton";
import { DropZone } from "./features/image-loader/components/DropZone";
import { FilePickerButton } from "./features/image-loader/components/FilePickerButton";
import { ExifPanel } from "./features/exif-viewer/components/ExifPanel";
import { useExifData } from "./features/exif-viewer/hooks/useExifData";
import { PixelInfoPanel } from "./features/pixel-inspector/components/PixelInfoPanel";
import { usePixelInspector } from "./features/pixel-inspector/hooks/usePixelInspector";
import { RoiSelectionOverlay } from "./features/roi/components/RoiSelectionOverlay";
import { RoiStatsPanel } from "./features/roi/components/RoiStatsPanel";
import { useRoiSelection } from "./features/roi/hooks/useRoiSelection";
import { useZoom } from "./features/zoom/hooks/useZoom";
import { useCanvas } from "./hooks/useCanvas";
import { useImageStore } from "./hooks/useImageStore";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { validateImageFile } from "./utils/validation";

function App() {
  const { t } = useTranslation();
  const { image, viewport, toolMode, loadImage, closeImage, setToolMode } =
    useImageStore();
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
  useRoiSelection(canvasRef);
  useKeyboardShortcuts(canvasRef, {
    onOpenFile: () => fileInputRef.current?.click(),
    onCloseImage: closeImage,
    isHelpOpen,
    onToggleHelp: () => setIsHelpOpen((v) => !v),
  });
  const pixelInfo = usePixelInspector(canvasRef);
  const histogramData = useHistogram();
  const exifData = useExifData();

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
          <>
            <div className="mx-1 h-5 w-px bg-gray-600" />
            <button
              onClick={() => setToolMode("navigate")}
              title={t("toolbar.navigate")}
              aria-label={t("toolbar.navigate")}
              aria-pressed={toolMode === "navigate"}
              className={`rounded px-2 py-1 text-sm transition-colors ${
                toolMode === "navigate"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-700 hover:text-white"
              }`}
            >
              ↖
            </button>
            <button
              onClick={() => setToolMode("roi")}
              title={t("toolbar.roi")}
              aria-label={t("toolbar.roi")}
              aria-pressed={toolMode === "roi"}
              className={`rounded px-2 py-1 text-sm transition-colors ${
                toolMode === "roi"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-700 hover:text-white"
              }`}
            >
              ▭
            </button>
            <button
              disabled
              title={t("toolbar.lineProfile")}
              aria-label={t("toolbar.lineProfile")}
              className="cursor-not-allowed rounded px-2 py-1 text-sm text-gray-600"
            >
              ╱
            </button>
            <div className="mx-1 h-5 w-px bg-gray-600" />
          </>
        )}
        {hasImage && (
          <span className="text-xs text-gray-400">
            {image.name} ({image.width}×{image.height})
          </span>
        )}
        {hasImage && (
          <span className="text-xs text-gray-400">
            {Math.round(viewport.zoom * 100)}%
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
              <canvas
                ref={canvasRef}
                className={`h-full w-full ${toolMode === "roi" ? "cursor-crosshair" : ""}`}
              />
              <RoiSelectionOverlay />
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
          <RoiStatsPanel />
          <PixelInfoPanel pixelInfo={pixelInfo} />
          <HistogramPanel data={histogramData} />
          <ImageStatsPanel data={histogramData} />
          <ExifPanel exifData={exifData} />
          {!hasImage && <KeyboardShortcutsPanel />}
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
