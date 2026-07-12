"use client";

import { useMemo } from "react";
import {
  CalendarClock,
  Landmark,
  PiggyBank,
  Scale,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { ExpenseDonut } from "@/components/charts/expense-donut";
import { DebtCard } from "@/components/dashboard/debt-card";
import { FixedExpensesProgress } from "@/components/dashboard/fixed-expenses-progress";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { UpcomingBills } from "@/components/dashboard/upcoming-bills";
import { GlobeBackground } from "@/components/globe/globe-background";
import { useFinance } from "@/contexts/finance-context";
import {
  availableUntilMonthEnd,
  cashFlowSeries,
  expensesByCategory,
  fixedExpensesSummary,
  monthComparison,
  netWorth,
  previousMonthTotals,
  sumByType,
  totalBalance,
  totalDebtBalance,
  totalSaved,
} from "@/lib/calculations";
import {
  computeStatusFromDates,
  daysUntil,
  formatMonthYear,
  getMonthRange,
  toISODate,
  nowInSaoPaulo,
} from "@/lib/date";
import { formatCurrency } from "@/lib/money";
import type { FinancialEvent } from "@/types/database";

export default function DashboardOverviewPage() {
  const {
    accounts,
    categories,
    debts,
    goals,
    recurringExpenses,
    selectedMonth,
    subscriptions,
    transactions,
    updateTransaction,
    creditCards,
  } = useFinance();

  const income = sumByType(transactions, "income", selectedMonth);
  const expenses = sumByType(transactions, "expense", selectedMonth);
  const prev = previousMonthTotals(transactions, selectedMonth);
  const incomeCmp = monthComparison(income, prev.income);
  const expenseCmp = monthComparison(expenses, prev.expense);
  const balance = totalBalance(accounts);
  const debtsTotal = totalDebtBalance(debts);
  const saved = totalSaved(goals);
  const worth = netWorth(accounts, debts, goals);
  const fixed = fixedExpensesSummary(recurringExpenses, transactions, selectedMonth, income);
  const available = availableUntilMonthEnd(accounts, income, expenses, fixed.pending);

  const range = getMonthRange(selectedMonth);
  const upcomingCount = transactions.filter(
    (t) =>
      t.type === "expense" &&
      t.status !== "paid" &&
      t.due_date &&
      t.due_date >= range.start &&
      t.due_date <= range.end
  ).length;

  const categoryData = expensesByCategory(transactions, categories, selectedMonth);
  const flowData = cashFlowSeries(transactions, 120);

  const sparkIncome = flowData.slice(-12).map((d) => ({ value: d.income }));
  const sparkExpense = flowData.slice(-12).map((d) => ({ value: d.expense }));
  const sparkBalance = flowData.slice(-12).map((d) => ({ value: d.balance }));

  const upcomingBills = useMemo(() => buildUpcomingBills({
    transactions,
    subscriptions,
    accounts,
  }), [accounts, subscriptions, transactions]);

  return (
    <div className="relative space-y-8">
      <section className="relative overflow-hidden rounded-[28px] border border-[var(--card-border)] bg-[rgba(8,13,36,0.55)] p-6 sm:p-8">
        <GlobeBackground className="pointer-events-none absolute -right-16 top-[-20%] h-[140%] w-[70%] opacity-60 sm:opacity-80" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[rgba(5,8,22,0.92)] via-[rgba(5,8,22,0.72)] to-transparent" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--cyan)]">
            Visão geral · {formatMonthYear(`${selectedMonth}-01`)}
          </p>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Seu controle financeiro em um só lugar
          </h1>
          <p className="max-w-xl text-base text-[var(--muted)]">
            Acompanhe saldo, fluxo de caixa, dívidas e próximos vencimentos com uma
            interface premium pensada para o dia a dia no Brasil.
          </p>
        </div>

        <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={Wallet}
            title="Saldo total"
            value={formatCurrency(balance)}
            percentChange={incomeCmp.change}
            sparklineData={sparkBalance}
            sparklineColor="#1473FF"
          />
          <SummaryCard
            icon={TrendingUp}
            title="Receitas do mês"
            value={formatCurrency(income)}
            percentChange={incomeCmp.change}
            positiveIsGood
            sparklineData={sparkIncome}
            sparklineColor="#14D990"
          />
          <SummaryCard
            icon={TrendingDown}
            title="Gastos do mês"
            value={formatCurrency(expenses)}
            percentChange={expenseCmp.change}
            positiveIsGood={false}
            sparklineData={sparkExpense}
            sparklineColor="#FF5A6F"
          />
          <SummaryCard
            icon={Landmark}
            title="Dívidas pendentes"
            value={formatCurrency(debtsTotal)}
            percentChange={monthComparison(debtsTotal, debtsTotal).change}
            positiveIsGood={false}
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={CalendarClock}
          title="Próximos vencimentos"
          value={String(upcomingCount)}
          previousLabel="neste mês"
        />
        <SummaryCard
          icon={Wallet}
          title="Disponível até o fim do mês"
          value={formatCurrency(available)}
          positiveIsGood={available >= 0}
        />
        <SummaryCard
          icon={PiggyBank}
          title="Total investido / poupado"
          value={formatCurrency(saved)}
          sparklineColor="#22D3EE"
        />
        <SummaryCard
          icon={Scale}
          title="Patrimônio líquido"
          value={formatCurrency(worth)}
          positiveIsGood={worth >= 0}
          sparklineColor="#1473FF"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <CashFlowChart
          data={flowData.map((d) => ({
            date: d.date,
            income: d.income,
            expense: d.expense,
            balance: d.balance,
          }))}
          valueUnit="reais"
          title="Fluxo de caixa"
          description="Receitas, despesas e saldo acumulado"
          defaultPeriod="30d"
        />
        <ExpenseDonut
          data={categoryData.map((c) => ({
            id: c.id,
            name: c.name,
            valueCents: c.value,
            color: c.color,
          }))}
          valueUnit="cents"
          title="Distribuição de gastos"
          description="Por categoria no mês selecionado"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <FixedExpensesProgress
          incomeCents={income}
          fixedExpensesCents={fixed.total}
          paidCents={fixed.paid}
          pendingCents={fixed.pending}
          count={fixed.count}
        />
        <UpcomingBills
          bills={upcomingBills}
          onMarkAsPaid={(bill) => {
            if (bill.type === "bill" || bill.type === "debt_installment") {
              updateTransaction(bill.source_id, {
                status: "paid",
                payment_date: toISODate(nowInSaoPaulo()),
              });
              toast.success("Marcado como pago");
            } else {
              toast.message("Pagamento registrado na origem correspondente");
            }
          }}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white">Dívidas</h2>
          <p className="text-sm text-[var(--muted)]">
            Acompanhe saldos, parcelas e status de pagamento.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {debts.map((debt) => (
            <DebtCard key={debt.id} debt={debt} />
          ))}
        </div>
      </section>

      <RecentTransactions
        transactions={transactions}
        categories={categories}
        accounts={accounts}
        creditCards={creditCards}
      />
    </div>
  );
}

function buildUpcomingBills({
  transactions,
  subscriptions,
  accounts,
}: {
  transactions: ReturnType<typeof useFinance>["transactions"];
  subscriptions: ReturnType<typeof useFinance>["subscriptions"];
  accounts: ReturnType<typeof useFinance>["accounts"];
}): FinancialEvent[] {
  const today = toISODate(nowInSaoPaulo());
  const accountLabel = (id: string | null) =>
    accounts.find((a) => a.id === id)?.name;

  const fromTx: FinancialEvent[] = transactions
    .filter((t) => t.type === "expense" && t.status !== "paid" && t.due_date)
    .map((t) => ({
      id: `tx-${t.id}`,
      type: "bill" as const,
      title: t.description,
      amount_cents: t.amount_cents,
      date: t.due_date as string,
      status: computeStatusFromDates(t.status, t.due_date, t.payment_date),
      category: undefined,
      account_name: accountLabel(t.account_id),
      source_id: t.id,
    }));

  const fromSubs: FinancialEvent[] = subscriptions
    .filter((s) => s.is_active)
    .map((s) => ({
      id: `sub-${s.id}`,
      type: "subscription" as const,
      title: s.name,
      amount_cents: s.amount_cents,
      date: s.next_billing_date,
      status: computeStatusFromDates(
        daysUntil(s.next_billing_date) < 0 ? "overdue" : "scheduled",
        s.next_billing_date,
        null
      ),
      account_name: accountLabel(s.account_id),
      source_id: s.id,
    }));

  return [...fromTx, ...fromSubs]
    .filter((b) => b.date >= today || b.status === "overdue")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);
}
