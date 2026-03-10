import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { useImageStore } from "../../../hooks/useImageStore";
import { handleFileSelection } from "../../../utils/validation";

export function DropZone() {
  const { t } = useTranslation();
  const { loadImage } = useImageStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      await handleFileSelection(file, loadImage, setError);
    },
    [loadImage],
  );

  const handleFileInputChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) await handleFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div
      data-testid="drop-zone"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`flex h-full flex-col items-center justify-center gap-4 border-2 border-dashed transition-colors ${
        isDragging
          ? "border-blue-400 bg-blue-400/10"
          : "border-gray-600 bg-transparent"
      }`}
    >
      <div className="mb-30 text-center">
        <h1 className="mb-10 text-5xl font-bold text-white">🔍 EdgeLens</h1>
        <p className="text-lg text-gray-300">
          Browser-based image analyzer — your images never leave your device.
        </p>
        <p className="mt-3 text-base font-medium text-gray-300">
          🚫 No images uploaded&nbsp;&nbsp;|&nbsp;&nbsp;✅ Analysis works
          offline&nbsp;&nbsp;|&nbsp;&nbsp;🔓{" "}
          <a
            href="https://github.com/kktsuji/edge-lens"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline hover:text-white"
          >
            Open source
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 3h6v6" />
              <path d="M10 14 21 3" />
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            </svg>
          </a>
        </p>
      </div>
      <p className="inline-flex items-center gap-2 text-lg text-gray-300">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        {t("dropzone.title")}
      </p>
      <div className="inline-flex items-center gap-3">
        <span className="text-lg text-gray-300">{t("dropzone.subtitle")}</span>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          {t("toolbar.open")}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileInputChange}
        className="hidden"
        aria-label={t("toolbar.open")}
      />
      <p className="text-lg text-gray-400">{t("dropzone.formats")}</p>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {t(error)}
        </p>
      )}
    </div>
  );
}
