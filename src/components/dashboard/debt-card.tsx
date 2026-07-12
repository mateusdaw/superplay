import { AlertTriangle, CalendarDays, Landmark } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  debtProgress,
  remainingInstallments,
  totalInterestEstimate,
} from "@/lib/calculations";
import { formatDate, formatRelativeDue, isOverdueDate, toISODate } from "@/lib/date";
import { formatCurrency, formatPercent } from "@/lib/money";
import { getDebtStatusMeta } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { Debt } from "@/types/database";

interface DebtCardProps {
  debt: Debt;
  nextDueDate?: string;
  className?: string;
}

function nextDueFromDay(dueDay: number) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  let due = new Date(year, month, Math.min(dueDay, lastDay));

  if (due < new Date(year, month, today.getDate())) {
    const nextMonthLastDay = new Date(year, month + 2, 0).getDate();
    due = new Date(year, month + 1, Math.min(dueDay, nextMonthLastDay));
  }

  return toISODate(due);
}

export function DebtCard({ debt, nextDueDate, className }: DebtCardProps) {
  const status = getDebtStatusMeta(debt.status);
  const dueDate = nextDueDate ?? nextDueFromDay(debt.due_day);
  const overdue = debt.status === "overdue" || isOverdueDate(dueDate);
  const progress = debtProgress(debt);
  const remaining = remainingInstallments(debt);
  const interestEstimate = totalInterestEstimate(debt);

  return (
    <article
      className={cn(
        "glass-card relative overflow-hidden p-5",
        overdue &&
          "border-[rgba(255,90,111,0.38)] bg-[linear-gradient(135deg,rgba(255,90,111,0.16),rgba(13,20,50,0.74)_36%)]",
        className
      )}
    >
      {overdue ? (
        <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-[rgba(255,90,111,0.34)] bg-[rgba(255,90,111,0.12)] px-3 py-1 text-xs font-bold text-[#ffc2ca]">
          <AlertTriangle className="size-3.5" aria-hidden="true" />
          Atenção
        </div>
      ) : null}

      <div className="flex items-start gap-4 pr-24">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[rgba(20,115,255,0.28)] bg-[rgba(20,115,255,0.12)] text-[var(--cyan)]">
          <Landmark className="size-6" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black tracking-tight text-[var(--foreground)]">
            {debt.name}
          </h3>
          <p className="text-sm text-[var(--muted)]">{debt.creditor}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Metric label="Saldo atual" value={formatCurrency(debt.current_balance_cents)} />
        <Metric label="Valor original" value={formatCurrency(debt.original_amount_cents)} />
        <Metric label="Parcela" value={formatCurrency(debt.installment_amount_cents)} />
        <Metric label="Juros" value={`${formatPercent(debt.interest_rate_annual / 100)} a.a.`} />
        <Metric label="Parcelas restantes" value={`${remaining} de ${debt.total_installments}`} />
        <Metric label="Juros estimados" value={formatCurrency(interestEstimate)} />
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--card-border)] bg-[rgba(8,13,36,0.46)] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <CalendarDays className="size-4 text-[var(--cyan)]" aria-hidden="true" />
            <span>
              Proximo vencimento:{" "}
              <strong className="font-semibold text-[var(--foreground)]">
                {formatDate(dueDate)}
              </strong>
            </span>
          </div>
          <Badge className={status.className}>{status.label}</Badge>
        </div>
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
          <span>{formatRelativeDue(dueDate)}</span>
          <span>{formatPercent(progress)}</span>
        </div>
        <Progress value={Math.round(progress * 100)} />
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[rgba(8,13,36,0.42)] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

export default DebtCard;
