import { useTranslation } from "react-i18next";
import { useGridActions } from "../../../hooks/useImageStore";
import { useHistogram } from "../../histogram/hooks/useHistogram";
import { useExifData } from "../../exif-viewer/hooks/useExifData";
import { HistogramPanel } from "../../histogram/components/HistogramPanel";
import { ImageStatsPanel } from "../../histogram/components/ImageStatsPanel";
import { ExifPanel } from "../../exif-viewer/components/ExifPanel";
import { PixelInfoPanel } from "../../pixel-inspector/components/PixelInfoPanel";
import { LineProfilePanel } from "../../line-profile/components/LineProfilePanel";
import { RoiStatsPanel } from "../../roi/components/RoiStatsPanel";
import { ActiveCellIndicator } from "./ActiveCellIndicator";
import { GridCellProvider } from "./GridCellProvider";

function GridSidebarPanels() {
  const { activeCellPixelInfo } = useGridActions();

  const histogramData = useHistogram();
  const exifData = useExifData();

  return (
    <>
      <ActiveCellIndicator />
      <LineProfilePanel />
      <RoiStatsPanel />
      <PixelInfoPanel pixelInfo={activeCellPixelInfo} />
      <HistogramPanel data={histogramData} />
      <ImageStatsPanel data={histogramData} />
      <ExifPanel exifData={exifData} />
    </>
  );
}

export function GridSidebarContent() {
  const { gridState } = useGridActions();

  const { t } = useTranslation();

  if (!gridState.activeCellId) {
    return (
      <p className="px-3 py-4 text-sm text-gray-400">
        {t("grid.sidebarEmpty")}
      </p>
    );
  }

  return (
    <GridCellProvider cellId={gridState.activeCellId}>
      <GridSidebarPanels />
    </GridCellProvider>
  );
}
