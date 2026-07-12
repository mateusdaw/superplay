"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";

export type SparklinePoint =
  | number
  | {
      label?: string;
      value: number;
    };

interface SparklineProps {
  data: SparklinePoint[];
  className?: string;
  color?: string;
  height?: number;
  ariaLabel?: string;
  currencyTooltip?: boolean;
}

interface NormalizedSparklinePoint {
  label: string;
  value: number;
}

function normalizeData(data: SparklinePoint[]): NormalizedSparklinePoint[] {
  return data.map((point, index) =>
    typeof point === "number"
      ? { label: String(index + 1), value: point }
      : { label: point.label ?? String(index + 1), value: point.value }
  );
}

export function Sparkline({
  data,
  className,
  color = "#22D3EE",
  height = 54,
  ariaLabel = "Tendencia do indicador",
  currencyTooltip = false,
}: SparklineProps) {
  const gradientId = React.useId().replace(/:/g, "");
  const chartData = React.useMemo(() => normalizeData(data), [data]);

  return (
    <div
      className={cn("w-full", className)}
      style={{ height }}
      role="img"
      aria-label={ariaLabel}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
          accessibilityLayer
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Tooltip
            cursor={false}
            contentStyle={{
              background: "rgba(8,13,36,0.94)",
              border: "1px solid rgba(100,130,255,0.22)",
              borderRadius: "12px",
              color: "#f8fafc",
              padding: "6px 10px",
            }}
            formatter={(value) =>
              currencyTooltip ? formatCurrency(Number(value)) : Number(value)
            }
            labelFormatter={(label) => String(label)}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 3, fill: color, stroke: "#f8fafc" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Sparkline;
