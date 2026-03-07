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
import type { LineProfileSample } from "../../../utils/lineProfile";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
);

interface LineProfileChartProps {
  samples: LineProfileSample[];
}

export function LineProfileChart({ samples }: LineProfileChartProps) {
  const labels = samples.map((s) => s.index.toString());

  const chartData = {
    labels,
    datasets: [
      {
        label: "Red",
        data: samples.map((s) => s.r),
        borderColor: "rgba(239,68,68,0.8)",
        pointRadius: 0,
        borderWidth: 1,
      },
      {
        label: "Green",
        data: samples.map((s) => s.g),
        borderColor: "rgba(34,197,94,0.8)",
        pointRadius: 0,
        borderWidth: 1,
      },
      {
        label: "Blue",
        data: samples.map((s) => s.b),
        borderColor: "rgba(59,130,246,0.8)",
        pointRadius: 0,
        borderWidth: 1,
      },
      {
        label: "Luminance",
        data: samples.map((s) => s.luminance),
        borderColor: "rgba(156,163,175,0.8)",
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

  return (
    <div className="h-40">
      <Line data={chartData} options={options} />
    </div>
  );
}
