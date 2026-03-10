import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
import { useTranslation } from "react-i18next";
import type { LineProfileSample } from "../../../utils/lineProfile";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false as const,
  scales: {
    x: {
      display: false,
    },
    y: {
      display: false,
      min: 0,
      max: 255,
    },
  },
  plugins: {
    legend: {
      display: true,
      position: "bottom" as const,
      labels: {
        color: "#9ca3af",
        boxWidth: 10,
        font: { size: 10 },
      },
    },
    tooltip: {
      enabled: true,
    },
  },
};

interface LineProfileChartProps {
  samples: LineProfileSample[];
}

export function LineProfileChart({ samples }: LineProfileChartProps) {
  const { t } = useTranslation();
  const labels = samples.map((s) => s.index.toString());

  const chartData = {
    labels,
    datasets: [
      {
        label: t("chart.red"),
        data: samples.map((s) => s.r),
        borderColor: "rgba(239,68,68,0.8)",
        pointRadius: 0,
        borderWidth: 1,
      },
      {
        label: t("chart.green"),
        data: samples.map((s) => s.g),
        borderColor: "rgba(34,197,94,0.8)",
        pointRadius: 0,
        borderWidth: 1,
      },
      {
        label: t("chart.blue"),
        data: samples.map((s) => s.b),
        borderColor: "rgba(59,130,246,0.8)",
        pointRadius: 0,
        borderWidth: 1,
      },
      {
        label: t("chart.luminance"),
        data: samples.map((s) => s.luminance),
        borderColor: "rgba(156,163,175,0.8)",
        pointRadius: 0,
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="h-40">
      <Line
        data={chartData}
        options={options}
        role="img"
        aria-label={t("chart.lineProfileAria")}
      />
    </div>
  );
}
