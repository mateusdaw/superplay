"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/date";
import { paymentMethodLabels, transactionTypeLabels } from "@/lib/labels";
import { formatCurrency } from "@/lib/money";
import { getTransactionStatusMeta } from "@/lib/status";
import { cn } from "@/lib/utils";
import type {
  Account,
  Category,
  CreditCard,
  Transaction,
  TransactionStatus,
  TransactionType,
} from "@/types/database";

type TransactionTypeFilter = "all" | TransactionType;
type TransactionStatusFilter = "all" | TransactionStatus;

interface RecentTransactionsProps {
  transactions: Transaction[];
  categories?: Pick<Category, "id" | "name" | "color">[];
  accounts?: Pick<Account, "id" | "name">[];
  creditCards?: Pick<CreditCard, "id" | "name">[];
  maxRows?: number;
  className?: string;
}

export function RecentTransactions({
  transactions,
  categories = [],
  accounts = [],
  creditCards = [],
  maxRows = 8,
  className,
}: RecentTransactionsProps) {
  const [query, setQuery] = React.useState("");
  const [type, setType] = React.useState<TransactionTypeFilter>("all");
  const [status, setStatus] = React.useState<TransactionStatusFilter>("all");

  const categoryMap = React.useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );
  const accountMap = React.useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name])),
    [accounts]
  );
  const cardMap = React.useMemo(
    () => new Map(creditCards.map((card) => [card.id, card.name])),
    [creditCards]
  );

  const filtered = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((transaction) => {
        if (type !== "all" && transaction.type !== type) return false;
        if (status !== "all" && transaction.status !== status) return false;

        if (!normalizedQuery) return true;

        const category = transaction.category_id
          ? categoryMap.get(transaction.category_id)?.name
          : undefined;
        const account = transaction.account_id
          ? accountMap.get(transaction.account_id)
          : undefined;
        const card = transaction.credit_card_id
          ? cardMap.get(transaction.credit_card_id)
          : undefined;

        return [transaction.description, category, account, card, transaction.notes]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));
      })
      .slice(0, maxRows);
  }, [accountMap, cardMap, categoryMap, maxRows, query, status, transactions, type]);

  return (
    <section className={cn("glass-card p-5", className)} aria-label="Transações recentes">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
            Transações recentes
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Busque por descrição, categoria, conta ou cartão.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-[minmax(0,220px)_130px_150px]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar"
              className="h-10 rounded-xl pl-9"
            />
          </div>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as TransactionTypeFilter)}
            className="h-10 rounded-xl border border-[var(--card-border)] bg-[rgba(8,13,36,0.82)] px-3 text-sm font-medium text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[rgba(20,115,255,0.28)]"
            aria-label="Filtrar por tipo"
          >
            <option value="all">Todos</option>
            <option value="income">{transactionTypeLabels.income}</option>
            <option value="expense">{transactionTypeLabels.expense}</option>
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as TransactionStatusFilter)}
            className="h-10 rounded-xl border border-[var(--card-border)] bg-[rgba(8,13,36,0.82)] px-3 text-sm font-medium text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[rgba(20,115,255,0.28)]"
            aria-label="Filtrar por status"
          >
            <option value="all">Status</option>
            <option value="paid">Pago</option>
            <option value="pending">Pendente</option>
            <option value="due_today">Vence hoje</option>
            <option value="overdue">Atrasado</option>
            <option value="scheduled">Agendado</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--card-border)] text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              <th className="pb-3 font-semibold">Descrição</th>
              <th className="pb-3 font-semibold">Categoria</th>
              <th className="pb-3 font-semibold">Data</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 text-right font-semibold">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)]">
            {filtered.map((transaction) => {
              const statusMeta = getTransactionStatusMeta(transaction.status);
              const category = transaction.category_id
                ? categoryMap.get(transaction.category_id)
                : undefined;
              const source =
                (transaction.account_id && accountMap.get(transaction.account_id)) ||
                (transaction.credit_card_id && cardMap.get(transaction.credit_card_id));

              return (
                <tr key={transaction.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="py-3 pr-4">
                    <div className="font-semibold text-[var(--foreground)]">
                      {transaction.description}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--muted)]">
                      {source ?? "Sem conta"}{" "}
                      {transaction.payment_method
                        ? `- ${paymentMethodLabels[transaction.payment_method]}`
                        : ""}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-2 text-[var(--muted)]">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: category?.color ?? "#64748b" }}
                        aria-hidden="true"
                      />
                      {category?.name ?? "Outros"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[var(--muted)]">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
                  </td>
                  <td
                    className={cn(
                      "py-3 text-right font-black",
                      transaction.type === "income"
                        ? "text-[#a8f7d8]"
                        : "text-[var(--foreground)]"
                    )}
                  >
                    {transaction.type === "expense" ? "-" : "+"}
                    {formatCurrency(transaction.amount_cents)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!filtered.length ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--card-border)] p-8 text-center text-sm text-[var(--muted)]">
          Nenhuma transação encontrada para os filtros atuais.
        </div>
      ) : null}
    </section>
  );
}

export default RecentTransactions;
