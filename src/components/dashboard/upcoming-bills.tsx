"use client";

import * as React from "react";
import { CalendarClock, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatRelativeDue } from "@/lib/date";
import { financialEventTypeLabels } from "@/lib/labels";
import { formatCurrency } from "@/lib/money";
import { getTransactionStatusMeta } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { FinancialEvent } from "@/types/database";

interface UpcomingBillsProps {
  bills: FinancialEvent[];
  className?: string;
  title?: string;
  description?: string;
  onMarkAsPaid?: (bill: FinancialEvent) => void | Promise<void>;
}

export function UpcomingBills({
  bills,
  className,
  title = "Próximas contas",
  description = "Linha do tempo dos compromissos financeiros.",
  onMarkAsPaid,
}: UpcomingBillsProps) {
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const sortedBills = React.useMemo(
    () => [...bills].sort((a, b) => a.date.localeCompare(b.date)),
    [bills]
  );

  async function handleMarkAsPaid(bill: FinancialEvent) {
    if (!onMarkAsPaid) return;
    setPendingId(bill.id);
    try {
      await onMarkAsPaid(bill);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className={cn("glass-card p-5", className)} aria-label={title}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
            {title}
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
        </div>
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[rgba(34,211,238,0.28)] bg-[rgba(34,211,238,0.1)] text-[var(--cyan)]">
          <CalendarClock className="size-5" aria-hidden="true" />
        </div>
      </div>

      {sortedBills.length ? (
        <ol className="relative space-y-4 before:absolute before:left-4 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-[var(--card-border)]">
          {sortedBills.map((bill) => {
            const status = getTransactionStatusMeta(bill.status);
            const canMarkPaid = Boolean(onMarkAsPaid) && bill.status !== "paid";

            return (
              <li key={bill.id} className="relative grid grid-cols-[2rem_1fr] gap-3">
                <span
                  className={cn(
                    "relative z-10 mt-1 flex size-8 items-center justify-center rounded-full border bg-[rgba(8,13,36,0.92)]",
                    status.className
                  )}
                  aria-hidden="true"
                >
                  <span className={cn("size-2.5 rounded-full", status.dotClassName)} />
                </span>

                <div className="rounded-2xl border border-[var(--card-border)] bg-[rgba(8,13,36,0.46)] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate font-bold text-[var(--foreground)]">
                          {bill.title}
                        </h4>
                        <Badge className={status.className}>{status.label}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {financialEventTypeLabels[bill.type]} - {formatDate(bill.date)} -{" "}
                        {formatRelativeDue(bill.date)}
                      </p>
                      {bill.category || bill.account_name ? (
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          {[bill.category, bill.account_name].filter(Boolean).join(" / ")}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-base font-black text-[var(--foreground)]">
                        {formatCurrency(bill.amount_cents)}
                      </span>
                      {canMarkPaid ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="success"
                          disabled={pendingId === bill.id}
                          onClick={() => void handleMarkAsPaid(bill)}
                        >
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                          {pendingId === bill.id ? "Salvando" : "Pagar"}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--card-border)] p-8 text-center text-sm text-[var(--muted)]">
          Nenhuma conta futura encontrada.
        </div>
      )}
    </section>
  );
}

export default UpcomingBills;
