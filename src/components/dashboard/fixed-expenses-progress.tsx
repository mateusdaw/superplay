import { Home, WalletCards, type LucideIcon } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatPercent, type Cents } from "@/lib/money";
import { cn } from "@/lib/utils";

interface FixedExpensesProgressProps {
  incomeCents: Cents;
  fixedExpensesCents: Cents;
  paidCents?: Cents;
  pendingCents?: Cents;
  count?: number;
  className?: string;
}

export function FixedExpensesProgress({
  incomeCents,
  fixedExpensesCents,
  paidCents = 0,
  pendingCents,
  count,
  className,
}: FixedExpensesProgressProps) {
  const incomeShare = incomeCents > 0 ? fixedExpensesCents / incomeCents : 0;
  const paidShare = fixedExpensesCents > 0 ? paidCents / fixedExpensesCents : 0;
  const resolvedPending = pendingCents ?? Math.max(0, fixedExpensesCents - paidCents);
  const level =
    incomeShare >= 0.7 ? "critical" : incomeShare >= 0.5 ? "warning" : "healthy";

  return (
    <section className={cn("glass-card p-5", className)} aria-label="Gastos fixos">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--muted)]">
            Gastos fixos vs renda
          </p>
          <h3 className="mt-2 text-3xl font-black tracking-tight text-[var(--foreground)]">
            {formatPercent(incomeShare)}
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {formatCurrency(fixedExpensesCents)} de {formatCurrency(incomeCents)}
          </p>
        </div>
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl border",
            level === "healthy" &&
              "border-[rgba(20,217,144,0.32)] bg-[rgba(20,217,144,0.12)] text-[#a8f7d8]",
            level === "warning" &&
              "border-[rgba(245,158,11,0.36)] bg-[rgba(245,158,11,0.12)] text-[#fde3a3]",
            level === "critical" &&
              "border-[rgba(255,90,111,0.36)] bg-[rgba(255,90,111,0.12)] text-[#ffc2ca]"
          )}
        >
          <Home className="size-6" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
            <span>Comprometimento da renda</span>
            <span>{formatPercent(Math.min(incomeShare, 1))}</span>
          </div>
          <Progress value={Math.min(100, Math.round(incomeShare * 100))} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
            <span>Fixos pagos no mês</span>
            <span>{formatPercent(Math.min(paidShare, 1))}</span>
          </div>
          <Progress value={Math.min(100, Math.round(paidShare * 100))} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniStat icon={WalletCards} label="Pagos" value={formatCurrency(paidCents)} />
        <MiniStat
          icon={WalletCards}
          label="Pendentes"
          value={formatCurrency(resolvedPending)}
        />
        <MiniStat
          icon={WalletCards}
          label="Recorrentes"
          value={typeof count === "number" ? String(count) : "--"}
        />
      </div>
    </section>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[rgba(8,13,36,0.42)] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        <Icon className="size-3.5 text-[var(--cyan)]" aria-hidden="true" />
        {label}
      </div>
      <p className="text-sm font-bold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

export default FixedExpensesProgress;
