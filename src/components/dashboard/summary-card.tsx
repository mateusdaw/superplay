"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";

import { Sparkline, type SparklinePoint } from "@/components/charts/sparkline";
import { formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  icon: LucideIcon;
  title: string;
  value: React.ReactNode;
  percentChange?: number;
  previousLabel?: string;
  positiveIsGood?: boolean;
  sparklineData?: SparklinePoint[];
  sparklineColor?: string;
  className?: string;
}

export function SummaryCard({
  icon: Icon,
  title,
  value,
  percentChange,
  previousLabel = "vs. mes anterior",
  positiveIsGood = true,
  sparklineData,
  sparklineColor = "#22D3EE",
  className,
}: SummaryCardProps) {
  const hasTrend = typeof percentChange === "number" && Number.isFinite(percentChange);
  const isNeutral = !hasTrend || percentChange === 0;
  const isUp = hasTrend && percentChange > 0;
  const isGood = isNeutral ? true : positiveIsGood ? isUp : !isUp;
  const TrendIcon = isNeutral ? Minus : isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={cn("glass-card overflow-hidden p-5", className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--muted)]">{title}</p>
          <div className="mt-3 text-3xl font-black tracking-tight text-[var(--foreground)]">
            {value}
          </div>
        </div>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[rgba(20,115,255,0.28)] bg-[rgba(20,115,255,0.12)] text-[var(--cyan)] shadow-[0_0_30px_rgba(20,115,255,0.18)]">
          <Icon className="size-6" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
            isGood
              ? "border-[rgba(20,217,144,0.36)] bg-[rgba(20,217,144,0.12)] text-[#a8f7d8]"
              : "border-[rgba(255,90,111,0.36)] bg-[rgba(255,90,111,0.12)] text-[#ffc2ca]"
          )}
        >
          <TrendIcon className="size-3.5" aria-hidden="true" />
          {hasTrend ? formatPercent(Math.abs(percentChange)) : "Sem comparativo"}
          <span className="font-medium opacity-80">{previousLabel}</span>
        </div>

        {sparklineData?.length ? (
          <Sparkline
            data={sparklineData}
            color={sparklineColor}
            className="max-w-[120px]"
            height={46}
            ariaLabel={`Tendencia de ${title}`}
          />
        ) : null}
      </div>
    </motion.div>
  );
}

export default SummaryCard;
