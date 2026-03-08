import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useGridActions } from "../../../hooks/useImageStore";
import { GridLayoutSelector } from "./GridLayoutSelector";

export function GridToggleButton() {
  const { t } = useTranslation();
  const { gridState, setGridEnabled } = useGridActions();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: rect.left });
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) return;
    updatePosition();

    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        // Also check if click is inside the portal dropdown
        const portal = document.getElementById("grid-layout-dropdown");
        if (portal && portal.contains(e.target as Node)) return;
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen, updatePosition]);

  return (
    <div className="relative hidden md:inline-flex" ref={wrapperRef}>
      <button
        onClick={() => {
          if (gridState.enabled) {
            setGridEnabled(false);
          } else {
            setIsDropdownOpen((v) => !v);
          }
        }}
        title={`${t("grid.toggle")} (G)`}
        aria-label={`${t("grid.toggle")} (G)`}
        aria-pressed={gridState.enabled}
        className={`min-h-8 min-w-8 rounded px-1 py-0.5 text-sm transition-colors sm:min-h-10 sm:min-w-10 sm:px-2 sm:py-1 ${
          gridState.enabled
            ? "bg-blue-600 text-white"
            : "text-gray-400 hover:bg-gray-700 hover:text-white"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      </button>
      {!gridState.enabled && (
        <button
          onClick={() => setIsDropdownOpen((v) => !v)}
          className="min-h-8 rounded px-0.5 py-0.5 text-xs text-gray-400 hover:bg-gray-700 hover:text-white sm:min-h-10"
          aria-label={t("grid.layout")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>
      )}
      {isDropdownOpen &&
        createPortal(
          <div
            id="grid-layout-dropdown"
            style={{
              position: "fixed",
              top: dropdownPos.top,
              left: dropdownPos.left,
            }}
            className="z-50"
          >
            <GridLayoutSelector onClose={() => setIsDropdownOpen(false)} />
          </div>,
          document.body,
        )}
    </div>
  );
}
