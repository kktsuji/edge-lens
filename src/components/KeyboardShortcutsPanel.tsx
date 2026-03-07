import { useTranslation } from "react-i18next";
import { shortcuts } from "./KeyboardShortcutsHelp";

export function KeyboardShortcutsPanel() {
  const { t } = useTranslation();
  return (
    <div className="mt-auto">
      <h2 className="mb-2 text-sm font-semibold text-gray-300">
        {t("shortcuts.title")}
      </h2>
      <table className="w-full text-xs">
        <tbody>
          {shortcuts.map(({ keys, labelKey }) => (
            <tr
              key={labelKey}
              className="border-b border-gray-700/50 last:border-0"
            >
              <td className="py-1 font-mono text-gray-300">{keys}</td>
              <td className="py-1 text-gray-400">{t(labelKey)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
