"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface DataPoint {
  timestamp: string;
  value: number;
  pnl: number;
}

interface PerformanceChartProps {
  data: DataPoint[];
  initialBalance: number;
  height?: number;
  showLabels?: boolean;
  className?: string;
}

export function PerformanceChart({
  data,
  initialBalance,
  height = 120,
  showLabels = true,
  className,
}: PerformanceChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) {
      return {
        points: `0,${height / 2}`,
        minValue: initialBalance,
        maxValue: initialBalance,
        currentValue: initialBalance,
        totalPnl: 0,
        returnPercent: 0,
        isPositive: true,
      };
    }

    const values = data.map((d) => d.value);
    const minValue = Math.min(...values, initialBalance);
    const maxValue = Math.max(...values, initialBalance);
    const range = maxValue - minValue || 1;

    const padding = 10;
    const chartHeight = height - padding * 2;
    const chartWidth = 100;

    const points = data
      .map((d, i) => {
        const x = (i / Math.max(data.length - 1, 1)) * chartWidth;
        const y = padding + chartHeight - ((d.value - minValue) / range) * chartHeight;
        return `${x},${y}`;
      })
      .join(" ");

    const currentValue = data[data.length - 1]?.value || initialBalance;
    const totalPnl = currentValue - initialBalance;
    const returnPercent = ((currentValue - initialBalance) / initialBalance) * 100;

    return {
      points,
      minValue,
      maxValue,
      currentValue,
      totalPnl,
      returnPercent,
      isPositive: totalPnl >= 0,
    };
  }, [data, initialBalance, height]);

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className={cn("bg-gray-800 rounded-lg p-4", className)}>
      {showLabels && (
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-sm font-medium text-gray-400">Portfolio Performance</h3>
            <p className="text-xl font-bold">{formatValue(chartData.currentValue)}</p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "text-lg font-semibold",
                chartData.isPositive ? "text-green-400" : "text-red-400"
              )}
            >
              {chartData.isPositive ? "+" : ""}
              {chartData.returnPercent.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-500">
              {chartData.isPositive ? "+" : ""}
              {formatValue(chartData.totalPnl)}
            </p>
          </div>
        </div>
      )}

      <div className="relative" style={{ height }}>
        <svg
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <line
            x1="0"
            y1={height / 2}
            x2="100"
            y2={height / 2}
            stroke="#374151"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />

          {data.length > 0 && (
            <line
              x1="0"
              y1={
                10 +
                (height - 20) -
                ((initialBalance - chartData.minValue) /
                  (chartData.maxValue - chartData.minValue || 1)) *
                  (height - 20)
              }
              x2="100"
              y2={
                10 +
                (height - 20) -
                ((initialBalance - chartData.minValue) /
                  (chartData.maxValue - chartData.minValue || 1)) *
                  (height - 20)
              }
              stroke="#6B7280"
              strokeWidth="0.5"
              strokeDasharray="4,4"
            />
          )}

          {data.length > 1 && (
            <polygon
              points={`0,${height} ${chartData.points} 100,${height}`}
              fill={chartData.isPositive ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)"}
            />
          )}

          {data.length > 1 && (
            <polyline
              points={chartData.points}
              fill="none"
              stroke={chartData.isPositive ? "#22c55e" : "#ef4444"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {data.length > 0 && (
            <circle
              cx="100"
              cy={chartData.points.split(" ").pop()?.split(",")[1] || height / 2}
              r="3"
              fill={chartData.isPositive ? "#22c55e" : "#ef4444"}
            />
          )}
        </svg>

        {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500 text-sm">No trading data yet</p>
          </div>
        )}
      </div>

      {showLabels && data.length > 0 && (
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{data[0]?.timestamp ? new Date(data[0].timestamp).toLocaleTimeString() : "-"}</span>
          <span>
            {data[data.length - 1]?.timestamp
              ? new Date(data[data.length - 1].timestamp).toLocaleTimeString()
              : "-"}
          </span>
        </div>
      )}
    </div>
  );
}

export function PerformanceSparkline({
  data,
  initialBalance,
  width = 80,
  height = 24,
}: {
  data: DataPoint[];
  initialBalance: number;
  width?: number;
  height?: number;
}) {
  const { points, isPositive } = useMemo(() => {
    if (data.length < 2) {
      return { points: "", isPositive: true };
    }

    const values = data.map((d) => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    const pts = data
      .map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d.value - minValue) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");

    const currentValue = data[data.length - 1]?.value || initialBalance;
    return {
      points: pts,
      isPositive: currentValue >= initialBalance,
    };
  }, [data, initialBalance, width, height]);

  if (data.length < 2) {
    return (
      <div
        className="bg-gray-700 rounded"
        style={{ width, height }}
      />
    );
  }

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={isPositive ? "#22c55e" : "#ef4444"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
