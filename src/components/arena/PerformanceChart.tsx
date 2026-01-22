"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface DataPoint {
  tick_number: number;
  timestamp: string;
  realized_pnl: number;
  pnl_impact: number;
  balance: number;
  portfolio_value: number;
  action: string;
  asset?: string;
  size_usd?: number;
}

interface PerformanceChartProps {
  data: DataPoint[];
  initialBalance: number;
  agentName?: string;
  height?: number;
  showLabels?: boolean;
  className?: string;
}

export function PerformanceChart({
  data,
  initialBalance,
  agentName,
  height = 160,
  showLabels = true,
  className,
}: PerformanceChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  const chartData = useMemo(() => {
    // Use all ticks (including HOLD)
    const allTicks = data;
    const tradeData = data.filter((d) => d.action !== 'HOLD');

    if (allTicks.length === 0) {
      return {
        points: [],
        allTicks: [],
        tradeData: [],
        pathD: "",
        areaD: "",
        minPnl: 0,
        maxPnl: 0,
        currentValue: initialBalance,
        currentPnl: 0,
        totalReturn: 0,
        isPositive: true,
        zeroY: height / 2,
      };
    }

    // Use realized_pnl for Y-axis (profit/loss)
    const pnlValues = allTicks.map((d) => d.realized_pnl || 0);
    const minPnl = Math.min(...pnlValues);
    const maxPnl = Math.max(...pnlValues);

    // Make range symmetric around zero so zero line is centered
    const absMax = Math.max(Math.abs(minPnl), Math.abs(maxPnl), 100); // minimum range of $100
    const symmetricMin = -absMax;
    const symmetricMax = absMax;
    const range = symmetricMax - symmetricMin;

    const padding = { top: 15, bottom: 15, left: 10, right: 10 };
    const chartHeight = height - padding.top - padding.bottom;
    const viewBoxWidth = 400;
    const chartWidth = viewBoxWidth - padding.left - padding.right;

    // Zero line Y position (center)
    const zeroY = padding.top + chartHeight / 2;

    // Create points for ALL ticks
    const points = allTicks.map((d, i) => {
      const pnl = d.realized_pnl || 0;
      const x = padding.left + (i / Math.max(allTicks.length - 1, 1)) * chartWidth;

      // HOLD actions show on zero line, BUY/SELL show at their realized PnL
      const isHold = d.action === 'HOLD';
      const y = isHold
        ? zeroY
        : padding.top + chartHeight - ((pnl - symmetricMin) / range) * chartHeight;

      return { x, y, data: d, isHold };
    });

    // Create path only through non-HOLD points (trades)
    const tradePoints = points.filter(p => !p.isHold);
    const pathD = tradePoints.length > 1
      ? tradePoints.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(" ")
      : "";

    // Area fill from the line to zero
    const areaD = tradePoints.length > 1
      ? `${pathD} L ${tradePoints[tradePoints.length - 1].x},${zeroY} L ${tradePoints[0].x},${zeroY} Z`
      : "";

    const lastTick = allTicks[allTicks.length - 1];
    const currentPnl = lastTick?.realized_pnl || 0;
    const currentValue = lastTick?.portfolio_value || lastTick?.balance || initialBalance;
    const totalReturn = (currentPnl / initialBalance) * 100;

    return {
      points,
      allTicks,
      tradeData,
      pathD,
      areaD,
      minPnl: symmetricMin,
      maxPnl: symmetricMax,
      currentValue,
      currentPnl,
      totalReturn,
      isPositive: currentPnl >= 0,
      zeroY,
    };
  }, [data, initialBalance, height]);

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Buy = Green, Sell = Red
  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY_MARKET':
        return '#22c55e'; // Green for buy
      case 'SELL_MARKET':
        return '#ef4444'; // Red for sell
      default:
        return '#6b7280'; // Gray for hold
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGElement>, point: typeof chartData.points[0]) => {
    const svg = e.currentTarget.closest('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setHoverPosition({
      x: (point.x / 400) * rect.width,
      y: point.y * (rect.height / height),
    });
    setHoveredPoint(point.data);
  };

  return (
    <div className={cn("bg-gray-800 rounded-lg p-4", className)}>
      {showLabels && (
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-sm font-medium text-gray-400">
              {agentName || 'Agent'} Performance
            </h3>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-gray-500">Portfolio</p>
                <p className="text-lg font-bold">{formatValue(chartData.currentValue)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Realized P&L</p>
                <p className={cn(
                  "text-lg font-bold",
                  chartData.isPositive ? "text-green-400" : "text-red-400"
                )}>
                  {chartData.currentPnl >= 0 ? '+' : ''}{formatValue(chartData.currentPnl)}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "text-2xl font-bold",
                chartData.isPositive ? "text-green-400" : "text-red-400"
              )}
            >
              {formatPercent(chartData.totalReturn)}
            </p>
            <p className="text-xs text-gray-500">
              {chartData.tradeData.length} trade{chartData.tradeData.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      <div className="relative" style={{ height }}>
        <svg
          viewBox={`0 0 400 ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full"
          onMouseLeave={() => {
            setHoveredPoint(null);
            setHoverPosition(null);
          }}
        >
          {/* Zero line (breakeven) - centered */}
          {chartData.tradeData.length > 0 && (
            <line
              x1="10"
              y1={chartData.zeroY}
              x2="390"
              y2={chartData.zeroY}
              stroke="#374151"
              strokeWidth="1"
              strokeDasharray="4,4"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Area fill */}
          {chartData.tradeData.length > 1 && (
            <path
              d={chartData.areaD}
              fill={chartData.isPositive ? "rgba(34, 197, 94, 0.08)" : "rgba(239, 68, 68, 0.08)"}
            />
          )}

          {/* Main line connecting trades */}
          {chartData.tradeData.length > 1 && (
            <path
              d={chartData.pathD}
              fill="none"
              stroke={chartData.isPositive ? "#22c55e" : "#ef4444"}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Tick markers - BUY (green), SELL (red), HOLD (gray on zero line) */}
          {chartData.points.map((point, index) => {
            const isHovered = hoveredPoint === point.data;
            const isHold = point.isHold;

            return (
              <g key={index}>
                {/* Tick marker - green for buy, red for sell, gray for hold */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHold ? (isHovered ? 5 : 2) : (isHovered ? 6 : 4)}
                  fill={getActionColor(point.data.action)}
                  stroke={isHovered ? "#fff" : "none"}
                  strokeWidth={isHovered ? 1.5 : 0}
                  className="cursor-pointer"
                  onMouseMove={(e) => handleMouseMove(e, point)}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}

          {/* Last trade marker highlight - only for actual trades */}
          {(() => {
            const lastTradePoint = chartData.points.filter(p => !p.isHold).slice(-1)[0];
            if (!lastTradePoint) return null;
            return (
              <circle
                cx={lastTradePoint.x}
                cy={lastTradePoint.y}
                r="8"
                fill="none"
                stroke={chartData.isPositive ? "#22c55e" : "#ef4444"}
                strokeWidth="1.5"
                opacity="0.6"
                vectorEffect="non-scaling-stroke"
              />
            );
          })()}
        </svg>

        {/* Tooltip */}
        {hoveredPoint && hoverPosition && (() => {
          const isHold = hoveredPoint.action === 'HOLD';
          const tradeIndex = isHold ? -1 : chartData.tradeData.findIndex(d => d === hoveredPoint);
          const tickIndex = chartData.allTicks.findIndex(d => d === hoveredPoint);
          const portfolioValue = hoveredPoint.portfolio_value || hoveredPoint.balance || initialBalance;

          const getActionLabel = (action: string) => {
            switch (action) {
              case 'BUY_MARKET': return 'BUY';
              case 'SELL_MARKET': return 'SELL';
              default: return 'HOLD';
            }
          };

          const getActionBgColor = (action: string) => {
            switch (action) {
              case 'BUY_MARKET': return 'rgba(34, 197, 94, 0.2)';
              case 'SELL_MARKET': return 'rgba(239, 68, 68, 0.2)';
              default: return 'rgba(107, 114, 128, 0.2)';
            }
          };

          return (
            <div
              className="absolute z-10 bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs shadow-lg pointer-events-none min-w-[180px]"
              style={{
                left: Math.min(hoverPosition.x, 200),
                top: Math.max(hoverPosition.y - 100, 0),
                transform: hoverPosition.x > 150 ? 'translateX(-100%)' : 'none',
              }}
            >
              <div className="flex items-center justify-between mb-2 border-b border-gray-700 pb-1">
                <span className="font-medium text-gray-300">
                  {formatDateTime(hoveredPoint.timestamp)}
                </span>
                <span
                  className="px-2 py-0.5 rounded text-xs font-bold"
                  style={{
                    backgroundColor: getActionBgColor(hoveredPoint.action),
                    color: getActionColor(hoveredPoint.action)
                  }}
                >
                  {getActionLabel(hoveredPoint.action)}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Realized P&L:</span>
                  <span className={cn("font-bold", hoveredPoint.realized_pnl >= 0 ? "text-green-400" : "text-red-400")}>
                    {hoveredPoint.realized_pnl >= 0 ? '+' : ''}{formatValue(hoveredPoint.realized_pnl)}
                  </span>
                </div>
                {!isHold && hoveredPoint.pnl_impact !== 0 && (
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">This Trade:</span>
                    <span className={hoveredPoint.pnl_impact >= 0 ? "text-green-400" : "text-red-400"}>
                      {hoveredPoint.pnl_impact >= 0 ? '+' : ''}{formatValue(hoveredPoint.pnl_impact)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Portfolio:</span>
                  <span className="text-white">{formatValue(portfolioValue)}</span>
                </div>
                {!isHold && hoveredPoint.size_usd && hoveredPoint.size_usd > 0 && (
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Trade Size:</span>
                    <span className="text-gray-300">{formatValue(hoveredPoint.size_usd)}</span>
                  </div>
                )}
              </div>
              <div className="text-gray-500 text-[10px] mt-2 border-t border-gray-700 pt-1">
                {isHold
                  ? `Tick #${tickIndex + 1} of ${chartData.allTicks.length}`
                  : `Trade #${tradeIndex + 1} of ${chartData.tradeData.length}`
                }
              </div>
            </div>
          );
        })()}

        {chartData.tradeData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500 text-sm">No trades executed yet</p>
          </div>
        )}
      </div>

      {showLabels && chartData.tradeData.length > 0 && (
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{chartData.tradeData[0]?.timestamp ? formatDateTime(chartData.tradeData[0].timestamp) : "-"}</span>
          <div className="flex gap-3 items-center">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Buy
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Sell
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-500"></span>
              Hold
            </span>
          </div>
          <span>
            {chartData.tradeData[chartData.tradeData.length - 1]?.timestamp
              ? formatDateTime(chartData.tradeData[chartData.tradeData.length - 1].timestamp)
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

    // Use portfolio_value for Y-axis
    const values = data.map((d) => d.portfolio_value || d.balance || initialBalance);
    const minValue = Math.min(initialBalance, ...values);
    const maxValue = Math.max(initialBalance, ...values);
    const range = maxValue - minValue || 1;

    const pts = data
      .map((d, i) => {
        const value = d.portfolio_value || d.balance || initialBalance;
        const x = (i / (data.length - 1)) * width;
        const y = height - ((value - minValue) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");

    const currentValue = data[data.length - 1]?.portfolio_value || data[data.length - 1]?.balance || initialBalance;
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
