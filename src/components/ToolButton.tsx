import { useTranslation } from "react-i18next";
import type { ToolMode } from "../types";

const SHORTCUT_KEY: Record<ToolMode, string> = {
  navigate: "N",
  "line-profile": "L",
  roi: "R",
};

const BASE_CLASS =
  "min-h-8 min-w-8 rounded px-1 py-0.5 text-sm transition-colors sm:min-h-10 sm:min-w-10 sm:px-2 sm:py-1";

function stateClass(enabled: boolean, isActive: boolean) {
  if (!enabled) return "text-gray-600 cursor-not-allowed";
  if (isActive) return "bg-blue-600 text-white";
  return "text-gray-400 hover:bg-gray-700 hover:text-white";
}

export function ToolButton({
  testId,
  mode,
  icon,
  labelKey,
  toolsEnabled,
  currentMode,
  setToolMode,
}: {
  testId: string;
  mode: ToolMode;
  icon: string;
  labelKey: string;
  toolsEnabled: boolean;
  currentMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
}) {
  const { t } = useTranslation();
  const isActive = currentMode === mode;
  const actionLabel = t(labelKey);
  const label = toolsEnabled
    ? `${actionLabel} (${SHORTCUT_KEY[mode]})`
    : `${actionLabel} — ${t("toolbar.openImageFirst")}`;

  return (
    <span className="inline-flex" title={label}>
      <button
        data-testid={testId}
        onClick={() => setToolMode(mode)}
        disabled={!toolsEnabled}
        aria-label={label}
        aria-pressed={toolsEnabled ? isActive : undefined}
        className={`${BASE_CLASS} ${stateClass(toolsEnabled, isActive)}`}
      >
        {icon}
      </button>
    </span>
  );
}
