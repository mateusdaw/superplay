"use client";

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatCurrency, type Cents } from "@/lib/money";
import { cn } from "@/lib/utils";

type ValueUnit = "cents" | "reais";

export interface ExpenseDonutDatum {
  id?: string;
  name: string;
  value?: number;
  valueCents?: Cents;
  color?: string;
}

interface ExpenseDonutProps {
  data: ExpenseDonutDatum[];
  className?: string;
  title?: string;
  description?: string;
  valueUnit?: ValueUnit;
}

interface NormalizedExpenseDatum {
  id: string;
  name: string;
  value: Cents;
  color: string;
}

const FALLBACK_COLORS = [
  "#1473FF",
  "#22D3EE",
  "#FF5A6F",
  "#14D990",
  "#F59E0B",
  "#8B5CF6",
];

function normalizeData(data: ExpenseDonutDatum[], unit: ValueUnit) {
  return data
    .map((item, index): NormalizedExpenseDatum => ({
      id: item.id ?? `${item.name}-${index}`,
      name: item.name,
      value:
        item.valueCents ??
        (unit === "cents"
          ? Math.round(item.value ?? 0)
          : Math.round((item.value ?? 0) * 100)),
      color: item.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    }))
    .filter((item) => item.value > 0);
}

export function ExpenseDonut({
  data,
  className,
  title = "Despesas por categoria",
  description = "Distribuicao das despesas do periodo em reais.",
  valueUnit = "cents",
}: ExpenseDonutProps) {
  const titleId = React.useId();
  const descriptionId = React.useId();
  const chartData = React.useMemo(
    () => normalizeData(data, valueUnit),
    [data, valueUnit]
  );
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <figure
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={cn("glass-card p-5", className)}
    >
      <div className="mb-5">
        <h3
          id={titleId}
          className="text-lg font-bold tracking-tight text-[var(--foreground)]"
        >
          {title}
        </h3>
        <p id={descriptionId} className="mt-1 text-sm text-[var(--muted)]">
          {description}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
        <div className="relative h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart accessibilityLayer>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius="64%"
                outerRadius="86%"
                paddingAngle={3}
                cornerRadius={10}
                stroke="rgba(5,8,22,0.72)"
                strokeWidth={3}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.id} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(8,13,36,0.94)",
                  border: "1px solid rgba(100,130,255,0.22)",
                  borderRadius: "16px",
                  color: "#f8fafc",
                  boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
                }}
                formatter={(value, name) => [
                  formatCurrency(Number(value)),
                  String(name),
                ]}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Total
            </span>
            <strong className="mt-1 text-2xl font-black tracking-tight text-[var(--foreground)]">
              {formatCurrency(total)}
            </strong>
          </div>
        </div>

        <ul className="space-y-3" aria-label="Legenda de categorias">
          {chartData.map((item) => {
            const percent = total > 0 ? item.value / total : 0;
            return (
              <li key={item.id} className="flex items-center gap-3">
                <span
                  className="size-3 rounded-full shadow-[0_0_18px_currentColor]"
                  style={{ backgroundColor: item.color, color: item.color }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-semibold text-[var(--foreground)]">
                      {item.name}
                    </span>
                    <span className="text-[var(--muted)]">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "percent",
                        maximumFractionDigits: 1,
                      }).format(percent)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formatCurrency(item.value)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </figure>
  );
}

export default ExpenseDonut;
