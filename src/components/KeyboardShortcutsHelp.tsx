import { useTranslation } from "react-i18next";

interface Props {
  onClose: () => void;
}

export const shortcuts = [
  { keys: "+ / =", labelKey: "shortcuts.zoomIn" },
  { keys: "-", labelKey: "shortcuts.zoomOut" },
  { keys: "0", labelKey: "shortcuts.fitToScreen" },
  { keys: "1", labelKey: "shortcuts.actualSize" },
  { keys: "Space + drag", labelKey: "shortcuts.pan" },
  { keys: "R", labelKey: "shortcuts.roiTool" },
  { keys: "L", labelKey: "shortcuts.lineProfileTool" },
  { keys: "Ctrl+O", labelKey: "shortcuts.openFile" },
  { keys: "Escape", labelKey: "shortcuts.closeImage" },
  { keys: "?", labelKey: "shortcuts.toggleHelp" },
];

export function KeyboardShortcutsHelp({ onClose }: Props) {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-80 rounded-lg bg-gray-800 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-dialog-title"
      >
        <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
          <h2
            id="shortcuts-dialog-title"
            className="text-sm font-semibold text-white"
          >
            {t("shortcuts.title")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {shortcuts.map(({ keys, labelKey }) => (
              <tr
                key={labelKey}
                className="border-b border-gray-700/50 last:border-0"
              >
                <td className="px-4 py-2 font-mono text-gray-300">{keys}</td>
                <td className="px-4 py-2 text-gray-400">{t(labelKey)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
