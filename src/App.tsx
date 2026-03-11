import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { GitHubButton } from "./components/GitHubButton";
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
import { LineProfileOverlay } from "./features/line-profile/components/LineProfileOverlay";
import { LineProfilePanel } from "./features/line-profile/components/LineProfilePanel";
import { useLineProfile } from "./features/line-profile/hooks/useLineProfile";
import { RoiSelectionOverlay } from "./features/roi/components/RoiSelectionOverlay";
import { RoiStatsPanel } from "./features/roi/components/RoiStatsPanel";
import { useRoiSelection } from "./features/roi/hooks/useRoiSelection";
import { useZoom } from "./features/zoom/hooks/useZoom";
import { useCanvas } from "./hooks/useCanvas";
import { useImageStore, useGridActions } from "./hooks/useImageStore";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { handleFileSelection } from "./utils/validation";
import { GridContainer } from "./features/grid/components/GridContainer";
import { GridToggleButton } from "./features/grid/components/GridToggleButton";
import { LockToggleButton } from "./features/grid/components/LockToggleButton";
import { GridSidebarContent } from "./features/grid/components/GridSidebarContent";

function App() {
  const { t } = useTranslation();
  const { image, viewport, toolMode, loadImage, closeImage, setToolMode } =
    useImageStore();
  const { gridState } = useGridActions();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasImage = !!image.imageData;
  const isGridMode = gridState.enabled;
  const toolsEnabled = hasImage || isGridMode;

  const toolBtnClass = (isActive: boolean) =>
    !toolsEnabled
      ? "text-gray-600 cursor-not-allowed"
      : isActive
        ? "bg-blue-600 text-white"
        : "text-gray-400 hover:bg-gray-700 hover:text-white";

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dragDepthRef = useRef(0);

  useEffect(() => {
    if (!dropError) return;
    const timer = setTimeout(() => setDropError(null), 4000);
    return () => clearTimeout(timer);
  }, [dropError]);

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      dragDepthRef.current = 0;
      setIsDraggingOver(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      await handleFileSelection(file, loadImage, setDropError);
    },
    [loadImage],
  );

  const handleDragEnter = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    dragDepthRef.current += 1;
    setIsDraggingOver(true);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDraggingOver(false);
    }
  }, []);

  useCanvas(canvasRef);
  useZoom(canvasRef);
  useRoiSelection(canvasRef);
  useLineProfile(canvasRef);
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
        <div className="mx-1 h-5 w-px bg-gray-600" />
        <button
          onClick={() => setToolMode("navigate")}
          disabled={!toolsEnabled}
          title={
            toolsEnabled
              ? `${t("toolbar.navigate")} (N)`
              : t("toolbar.openImageFirst")
          }
          aria-label={
            toolsEnabled
              ? `${t("toolbar.navigate")} (N)`
              : t("toolbar.openImageFirst")
          }
          aria-pressed={toolMode === "navigate"}
          className={`min-h-8 min-w-8 rounded px-1 py-0.5 text-sm transition-colors sm:min-h-10 sm:min-w-10 sm:px-2 sm:py-1 ${toolBtnClass(toolMode === "navigate")}`}
        >
          ↖
        </button>
        <button
          onClick={() => setToolMode("line-profile")}
          disabled={!toolsEnabled}
          title={
            toolsEnabled
              ? `${t("toolbar.lineProfile")} (L)`
              : t("toolbar.openImageFirst")
          }
          aria-label={
            toolsEnabled
              ? `${t("toolbar.lineProfile")} (L)`
              : t("toolbar.openImageFirst")
          }
          aria-pressed={toolMode === "line-profile"}
          className={`min-h-8 min-w-8 rounded px-1 py-0.5 text-sm transition-colors sm:min-h-10 sm:min-w-10 sm:px-2 sm:py-1 ${toolBtnClass(toolMode === "line-profile")}`}
        >
          ╱
        </button>
        <button
          onClick={() => setToolMode("roi")}
          disabled={!toolsEnabled}
          title={
            toolsEnabled
              ? `${t("toolbar.roi")} (R)`
              : t("toolbar.openImageFirst")
          }
          aria-label={
            toolsEnabled
              ? `${t("toolbar.roi")} (R)`
              : t("toolbar.openImageFirst")
          }
          aria-pressed={toolMode === "roi"}
          className={`min-h-8 min-w-8 rounded px-1 py-0.5 text-sm transition-colors sm:min-h-10 sm:min-w-10 sm:px-2 sm:py-1 ${toolBtnClass(toolMode === "roi")}`}
        >
          ▭
        </button>
        <div className="mx-1 h-5 w-px bg-gray-600" />
        <GridToggleButton />
        <LockToggleButton />
        <div className="mx-1 h-5 w-px bg-gray-600" />
        {!isGridMode && hasImage && (
          <span className="hidden text-xs text-gray-400 md:inline">
            {image.name} ({image.width}×{image.height})
          </span>
        )}
        {!isGridMode && hasImage && (
          <span className="hidden text-xs text-gray-400 sm:inline">
            {Math.round(viewport.zoom * 100)}%
          </span>
        )}
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setIsSidebarOpen((v) => !v)}
            className="min-h-8 min-w-8 rounded px-1 py-0.5 text-sm text-gray-400 hover:bg-gray-700 hover:text-white sm:min-h-10 sm:min-w-10 sm:px-2 sm:py-1 md:hidden"
            aria-label="Toggle sidebar"
            aria-expanded={isSidebarOpen}
          >
            ☰
          </button>
          <GitHubButton />
          <HelpButton onClick={() => setIsHelpOpen((v) => !v)} />
        </div>
      </Toolbar>
      <div className="flex min-h-0 flex-1">
        <main id="main-content" className="relative flex-1 overflow-hidden">
          {isGridMode ? (
            <GridContainer />
          ) : hasImage ? (
            <div
              className="relative h-full w-full"
              onDrop={handleDrop}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <canvas
                ref={canvasRef}
                aria-label={image.name || undefined}
                className={`h-full w-full ${toolMode === "roi" || toolMode === "line-profile" ? "cursor-crosshair" : ""}`}
              />
              <RoiSelectionOverlay />
              <LineProfileOverlay />
              {isDraggingOver && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center border-2 border-dashed border-blue-400 bg-blue-400/20">
                  <p className="text-lg font-medium text-blue-300">
                    Drop to replace image
                  </p>
                </div>
              )}
              {dropError && (
                <div className="pointer-events-none absolute bottom-2 left-2 right-2">
                  <p role="alert" className="text-center text-sm text-red-400">
                    {t(dropError)}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <DropZone />
          )}
        </main>
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((v) => !v)}
        >
          {isGridMode ? (
            <GridSidebarContent />
          ) : (
            <>
              <LineProfilePanel />
              <RoiStatsPanel />
              <PixelInfoPanel pixelInfo={pixelInfo} />
              <HistogramPanel data={histogramData} />
              <ImageStatsPanel data={histogramData} />
              <ExifPanel exifData={exifData} />
              {!hasImage && <KeyboardShortcutsPanel />}
            </>
          )}
        </Sidebar>
      </div>
      {isHelpOpen && (
        <KeyboardShortcutsHelp onClose={() => setIsHelpOpen(false)} />
      )}
    </div>
  );
}

export default App;
