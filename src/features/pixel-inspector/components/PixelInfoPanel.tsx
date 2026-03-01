import { useTranslation } from "react-i18next";
import type { PixelInfo } from "../../../types";

interface PixelInfoPanelProps {
  pixelInfo: PixelInfo | null;
}

export function PixelInfoPanel({ pixelInfo }: PixelInfoPanelProps) {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-gray-300">
        {t("pixelInspector.title")}
      </h2>
      <div aria-live="polite" className="text-xs text-gray-400">
        {pixelInfo ? (
          <div className="space-y-1">
            <p>
              {t("pixelInspector.position")}: ({pixelInfo.y}, {pixelInfo.x})
            </p>
            <p>
              {t("pixelInspector.color")}: R={pixelInfo.r} G={pixelInfo.g} B=
              {pixelInfo.b} A={pixelInfo.a}
            </p>
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded border border-gray-600"
                style={{
                  backgroundColor: `rgba(${pixelInfo.r}, ${pixelInfo.g}, ${pixelInfo.b}, ${pixelInfo.a / 255})`,
                }}
              />
              <span className="font-mono text-[10px]">
                #{pixelInfo.r.toString(16).padStart(2, "0")}
                {pixelInfo.g.toString(16).padStart(2, "0")}
                {pixelInfo.b.toString(16).padStart(2, "0")}
              </span>
            </div>
          </div>
        ) : (
          <p>{t("pixelInspector.placeholder")}</p>
        )}
      </div>
    </div>
  );
}
