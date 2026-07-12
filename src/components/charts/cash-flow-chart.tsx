"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  formatCurrency,
  formatCurrencyCompact,
  type Cents,
} from "@/lib/money";
import { cn } from "@/lib/utils";

type Period = "7d" | "30d" | "3m" | "6m" | "12m";
type ValueUnit = "cents" | "reais";

export interface CashFlowDatum {
  date: string;
  income?: number;
  expenses?: number;
  expense?: number;
  balance?: number;
  incomeCents?: Cents;
  expensesCents?: Cents;
  expenseCents?: Cents;
  balanceCents?: Cents;
}

interface CashFlowChartProps {
  data: CashFlowDatum[];
  className?: string;
  title?: string;
  description?: string;
  defaultPeriod?: Period;
  valueUnit?: ValueUnit;
}

interface NormalizedCashFlowDatum {
  date: string;
  income: Cents;
  expenses: Cents;
  balance: Cents;
}

const PERIODS: { value: Period; label: string; days: number }[] = [
  { value: "7d", label: "7d", days: 7 },
  { value: "30d", label: "30d", days: 30 },
  { value: "3m", label: "3m", days: 90 },
  { value: "6m", label: "6m", days: 180 },
  { value: "12m", label: "12m", days: 365 },
];

const SERIES_LABELS = {
  income: "Receitas",
  expenses: "Despesas",
  balance: "Saldo",
} satisfies Record<keyof Omit<NormalizedCashFlowDatum, "date">, string>;

function toCents(value: number | undefined, unit: ValueUnit): Cents {
  if (!value) return 0;
  return unit === "cents" ? Math.round(value) : Math.round(value * 100);
}

function normalizeDatum(
  datum: CashFlowDatum,
  valueUnit: ValueUnit
): NormalizedCashFlowDatum {
  return {
    date: datum.date,
    income: datum.incomeCents ?? toCents(datum.income, valueUnit),
    expenses:
      datum.expensesCents ??
      datum.expenseCents ??
      toCents(datum.expenses ?? datum.expense, valueUnit),
    balance: datum.balanceCents ?? toCents(datum.balance, valueUnit),
  };
}

function formatDateTick(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function filterByPeriod(data: NormalizedCashFlowDatum[], period: Period) {
  const option = PERIODS.find((item) => item.value === period) ?? PERIODS[1];
  const latest = data
    .map((item) => new Date(`${item.date}T00:00:00`).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0];

  if (!latest) return data.slice(-option.days);

  const cutoff = latest - (option.days - 1) * 86_400_000;
  return data.filter((item) => {
    const time = new Date(`${item.date}T00:00:00`).getTime();
    return Number.isFinite(time) ? time >= cutoff : true;
  });
}

export function CashFlowChart({
  data,
  className,
  title = "Fluxo de caixa",
  description = "Grafico de receitas, despesas e saldo por periodo.",
  defaultPeriod = "30d",
  valueUnit = "cents",
}: CashFlowChartProps) {
  const titleId = React.useId();
  const descriptionId = React.useId();
  const gradientId = React.useId().replace(/:/g, "");
  const [period, setPeriod] = React.useState<Period>(defaultPeriod);
  const normalized = React.useMemo(
    () => data.map((item) => normalizeDatum(item, valueUnit)),
    [data, valueUnit]
  );
  const chartData = React.useMemo(
    () => filterByPeriod(normalized, period),
    [normalized, period]
  );

  return (
    <figure
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={cn("glass-card p-5", className)}
    >
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
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
        <div className="flex flex-wrap gap-2" aria-label="Filtrar periodo">
          {PERIODS.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={period === item.value ? "default" : "ghost"}
              onClick={() => setPeriod(item.value)}
              aria-pressed={period === item.value}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <p className="sr-only">
        O grafico compara receitas em azul, despesas em vermelho e saldo em
        ciano. Use os botoes de periodo para mudar o intervalo exibido.
      </p>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 12, right: 8, bottom: 0, left: 0 }}
            accessibilityLayer
          >
            <defs>
              <linearGradient
                id={`cash-flow-income-${gradientId}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#1473FF" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#1473FF" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient
                id={`cash-flow-expenses-${gradientId}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#FF5A6F" stopOpacity={0.32} />
                <stop offset="95%" stopColor="#FF5A6F" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="rgba(148,163,184,0.14)"
              strokeDasharray="4 8"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateTick}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              minTickGap={28}
            />
            <YAxis
              tickFormatter={(value) => formatCurrencyCompact(Number(value))}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              width={74}
            />
            <Tooltip
              cursor={{
                stroke: "rgba(34,211,238,0.28)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
              contentStyle={{
                background: "rgba(8,13,36,0.94)",
                border: "1px solid rgba(100,130,255,0.22)",
                borderRadius: "16px",
                color: "#f8fafc",
                boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
              }}
              labelFormatter={(label) => formatDateTick(String(label))}
              formatter={(value, name) => [
                formatCurrency(Number(value)),
                SERIES_LABELS[name as keyof typeof SERIES_LABELS] ?? name,
              ]}
            />
            <Area
              type="monotone"
              dataKey="income"
              name="income"
              stroke="#1473FF"
              strokeWidth={2.5}
              fill={`url(#cash-flow-income-${gradientId})`}
              activeDot={{ r: 4, fill: "#1473FF", stroke: "#dbeafe" }}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="expenses"
              stroke="#FF5A6F"
              strokeWidth={2}
              fill={`url(#cash-flow-expenses-${gradientId})`}
              activeDot={{ r: 4, fill: "#FF5A6F", stroke: "#ffe4e8" }}
            />
            <Line
              type="monotone"
              dataKey="balance"
              name="balance"
              stroke="#22D3EE"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: "#22D3EE", stroke: "#cffafe" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

export default CashFlowChart;
