import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { useTranslation } from "react-i18next";
import type { HistogramData } from "../../../types";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
);

interface HistogramChartProps {
  data: HistogramData;
}

const labels = Array.from({ length: 256 }, (_, i) => i.toString());

export function HistogramChart({ data }: HistogramChartProps) {
  const { t } = useTranslation();
  const chartData = {
    labels,
    datasets: [
      {
        label: t("chart.red"),
        data: data.red,
        borderColor: "rgba(239,68,68,0.8)",
        backgroundColor: "rgba(239,68,68,0.1)",
        fill: true,
        pointRadius: 0,
        borderWidth: 1,
      },
      {
        label: t("chart.green"),
        data: data.green,
        borderColor: "rgba(34,197,94,0.8)",
        backgroundColor: "rgba(34,197,94,0.1)",
        fill: true,
        pointRadius: 0,
        borderWidth: 1,
      },
      {
        label: t("chart.blue"),
        data: data.blue,
        borderColor: "rgba(59,130,246,0.8)",
        backgroundColor: "rgba(59,130,246,0.1)",
        fill: true,
        pointRadius: 0,
        borderWidth: 1,
      },
      {
        label: t("chart.luminance"),
        data: data.luminance,
        borderColor: "rgba(156,163,175,0.8)",
        backgroundColor: "rgba(156,163,175,0.1)",
        fill: true,
        pointRadius: 0,
        borderWidth: 1,
      },
    ],
  };

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
        enabled: false,
      },
    },
  };

  return (
    <div className="h-40">
      <Line
        data={chartData}
        options={options}
        role="img"
        aria-label={t("chart.histogramAria")}
      />
    </div>
  );
}
