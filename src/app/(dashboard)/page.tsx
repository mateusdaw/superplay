"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeDollarSign,
  CreditCard,
  Target,
  Wallet,
} from "lucide-react";
import type { ComponentType } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  expensesByCategory,
  savingsRate,
  sumByType,
  totalBalance,
  totalDebtBalance,
} from "@/lib/calculations";
import { formatCurrency, formatPercent } from "@/lib/money";
import { formatDate } from "@/lib/date";
import { useFinance } from "@/contexts/finance-context";

export default function DashboardOverviewPage() {
  const {
    accounts,
    categories,
    creditCards,
    debts,
    goals,
    selectedMonth,
    transactions,
  } = useFinance();

  const income = sumByType(transactions, "income", selectedMonth);
  const expenses = sumByType(transactions, "expense", selectedMonth);
  const balance = totalBalance(accounts);
  const debtsTotal = totalDebtBalance(debts);
  const rate = savingsRate(income, expenses);
  const topCategories = expensesByCategory(transactions, categories, selectedMonth).slice(
    0,
    5
  );
  const latestTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);
  const creditLimit = creditCards.reduce(
    (sum, card) => sum + card.credit_limit_cents,
    0
  );
  const availableCredit = creditCards.reduce(
    (sum, card) => sum + card.available_limit_cents,
    0
  );
  const goalSaved = goals.reduce((sum, goal) => sum + goal.current_amount_cents, 0);
  const goalTarget = goals.reduce((sum, goal) => sum + goal.target_amount_cents, 0);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Saldo em contas"
          value={formatCurrency(balance)}
          description="Disponível nas contas ativas"
          icon={Wallet}
        />
        <MetricCard
          title="Receitas do mês"
          value={formatCurrency(income)}
          description="Entradas confirmadas e previstas"
          icon={ArrowUpRight}
          tone="success"
        />
        <MetricCard
          title="Despesas do mês"
          value={formatCurrency(expenses)}
          description={`Economia estimada: ${formatPercent(rate)}`}
          icon={ArrowDownRight}
          tone="danger"
        />
        <MetricCard
          title="Dívidas em aberto"
          value={formatCurrency(debtsTotal)}
          description="Saldo de dívidas ativas"
          icon={BadgeDollarSign}
          tone="warning"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Panorama financeiro</CardTitle>
                <CardDescription>
                  Visão rápida de cartões, metas e concentração de gastos.
                </CardDescription>
              </div>
              <Badge variant="cyan">Demo premium</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-2">
            <ProgressBlock
              icon={CreditCard}
              label="Limite de cartões disponível"
              value={availableCredit}
              total={creditLimit}
            />
            <ProgressBlock
              icon={Target}
              label="Progresso das metas"
              value={goalSaved}
              total={goalTarget}
            />
            <div className="lg:col-span-2">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                Maiores categorias de gasto
              </h3>
              <div className="grid gap-3">
                {topCategories.map((category) => (
                  <div key={category.id} className="grid gap-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-bold text-white">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </span>
                      <span className="font-semibold text-[var(--muted)]">
                        {formatCurrency(category.value)}
                      </span>
                    </div>
                    <Progress
                      value={expenses > 0 ? (category.value / expenses) * 100 : 0}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas transações</CardTitle>
            <CardDescription>Movimentos recentes da sua carteira.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--card-border)] bg-white/[0.03] p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    {transaction.description}
                  </p>
                  <p className="text-xs font-semibold text-[var(--muted)]">
                    {formatDate(transaction.date)}
                  </p>
                </div>
                <span
                  className={
                    transaction.type === "income"
                      ? "font-black text-[#a8f7d8]"
                      : "font-black text-[#ffc2ca]"
                  }
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatCurrency(transaction.amount_cents)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "primary",
}: {
  title: string;
  value: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "primary" | "success" | "danger" | "warning";
}) {
  const toneClass = {
    primary: "text-[#8bbcff] bg-[rgba(20,115,255,0.16)]",
    success: "text-[#a8f7d8] bg-[rgba(20,217,144,0.16)]",
    danger: "text-[#ffc2ca] bg-[rgba(255,90,111,0.16)]",
    warning: "text-[#fde3a3] bg-[rgba(245,158,11,0.16)]",
  }[tone];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardDescription>{title}</CardDescription>
        <span className={`rounded-2xl p-3 ${toneClass}`}>
          <Icon className="size-5" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-black tracking-[-0.04em] text-white">{value}</p>
        <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function ProgressBlock({
  icon: Icon,
  label,
  value,
  total,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  total: number;
}) {
  const percentage = total > 0 ? Math.min(100, (value / total) * 100) : 0;

  return (
    <div className="rounded-3xl border border-[var(--card-border)] bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="rounded-2xl bg-[rgba(20,115,255,0.16)] p-3 text-[#8bbcff]">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-white">{label}</p>
          <p className="text-xs font-semibold text-[var(--muted)]">
            {formatCurrency(value)} de {formatCurrency(total)}
          </p>
        </div>
      </div>
      <Progress value={percentage} />
    </div>
  );
}
