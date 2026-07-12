"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BadgeDollarSign,
  CalendarRange,
  Download,
  Landmark,
  PiggyBank,
  Scale,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { ExpenseDonut } from "@/components/charts/expense-donut";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useFinance } from "@/contexts/finance-context";
import {
  budgetProgress,
  cardUsage,
  debtProgress,
  debtToIncomeRatio,
  estimatedPayoff,
  fixedExpensesSummary,
  monthlyDebtCommitment,
  netWorth,
  remainingInstallments,
  savingsRate,
  sumByType,
  totalBalance,
  totalDebtBalance,
  totalSaved,
} from "@/lib/calculations";
import {
  formatDate,
  formatMonthYear,
  getMonthRange,
  shiftMonth,
} from "@/lib/date";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatPercent,
  type Cents,
} from "@/lib/money";
import { cn } from "@/lib/utils";

type CsvValue = string | number | boolean | null | undefined;
type CsvRow = Record<string, CsvValue>;

export default function ReportsPage() {
  const {
    accounts,
    budgets,
    categories,
    creditCards,
    debts,
    goals,
    recurringExpenses,
    selectedMonth,
    transactions,
  } = useFinance();
  const initialRange = getMonthRange(selectedMonth);
  const [reportMonth, setReportMonth] = useState(selectedMonth);
  const [dateFrom, setDateFrom] = useState(initialRange.start);
  const [dateTo, setDateTo] = useState(initialRange.end);

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const rangeTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.date >= dateFrom && transaction.date <= dateTo
      ),
    [dateFrom, dateTo, transactions]
  );

  const income = sumByType(rangeTransactions, "income");
  const expenses = sumByType(rangeTransactions, "expense");
  const result = income - expenses;
  const fixed = fixedExpensesSummary(
    recurringExpenses,
    transactions,
    reportMonth,
    income
  );
  const activeDebts = debts.filter(
    (debt) => debt.status === "active" || debt.status === "overdue"
  );
  const debtCommitment = monthlyDebtCommitment(debts);
  const savingsRatio = savingsRate(income, expenses);
  const commitmentRatio = debtToIncomeRatio(debtCommitment, income);
  const balance = totalBalance(accounts);
  const saved = totalSaved(goals);
  const debtTotal = totalDebtBalance(debts);
  const worth = netWorth(accounts, debts, goals);

  const categoryData = useMemo(() => {
    const totals = new Map<string, Cents>();
    for (const transaction of rangeTransactions) {
      if (transaction.type !== "expense") continue;
      const key = transaction.category_id ?? "outros";
      totals.set(key, (totals.get(key) ?? 0) + transaction.amount_cents);
    }

    return [...totals.entries()]
      .map(([id, value], index) => {
        const category = categoryById.get(id);
        return {
          id,
          name: category?.name ?? "Outros",
          valueCents: value,
          color: category?.color ?? fallbackColors[index % fallbackColors.length],
        };
      })
      .sort((a, b) => b.valueCents - a.valueCents);
  }, [categoryById, rangeTransactions]);

  const monthlyEvolution = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => {
        const month = shiftMonth(reportMonth, index - 5);
        const monthIncome = sumByType(transactions, "income", month);
        const monthExpenses = sumByType(transactions, "expense", month);
        return {
          month,
          label: formatMonthShort(month),
          receitas: monthIncome,
          despesas: monthExpenses,
          saldo: monthIncome - monthExpenses,
        };
      }),
    [reportMonth, transactions]
  );

  const fixedVariableData = [
    { name: "Fixas recorrentes", amount: fixed.total },
    { name: "Variáveis", amount: Math.max(0, expenses - fixed.total) },
  ];

  const monthBudgets = budgets.filter((budget) => budget.month === reportMonth);
  const budgetRows = monthBudgets.map((budget) => {
    const progress = budgetProgress(budget, transactions);
    return {
      budget,
      progress,
      category: categoryById.get(budget.category_id)?.name ?? "Categoria",
    };
  });
  const budgetLimit = monthBudgets.reduce(
    (sum, budget) => sum + budget.limit_cents,
    0
  );
  const budgetSpent = budgetRows.reduce(
    (sum, row) => sum + row.progress.spentCents,
    0
  );

  const handleMonthChange = (month: string) => {
    setReportMonth(month);
    const range = getMonthRange(month);
    setDateFrom(range.start);
    setDateTo(range.end);
  };

  return (
    <div className="space-y-8">
      <section className="glass-card overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge variant="cyan" className="w-fit">
              Relatórios financeiros
            </Badge>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Leitura completa de receitas, gastos e patrimônio
            </h1>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Filtre por mês ou intervalo, acompanhe os principais indicadores
              e exporte os blocos em CSV para análises externas.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
            <div className="space-y-2">
              <Label htmlFor="report-month">Mês</Label>
              <Input
                id="report-month"
                type="month"
                value={reportMonth}
                onChange={(event) => handleMonthChange(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-from">De</Label>
              <Input
                id="report-from"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-to">Até</Label>
              <Input
                id="report-to"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportMetric
          icon={TrendingUp}
          label="Receitas no período"
          value={formatCurrency(income)}
          tone="success"
        />
        <ReportMetric
          icon={TrendingDown}
          label="Despesas no período"
          value={formatCurrency(expenses)}
          tone="danger"
        />
        <ReportMetric
          icon={Wallet}
          label="Resultado"
          value={formatCurrency(result)}
          tone={result >= 0 ? "success" : "danger"}
        />
        <ReportMetric
          icon={PiggyBank}
          label="Taxa de poupança"
          value={formatPercent(savingsRatio)}
          tone={savingsRatio >= 0.15 ? "success" : "warning"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="glass-card p-5">
          <SectionHeader
            title="Receitas vs despesas"
            description={`${formatDate(dateFrom)} a ${formatDate(dateTo)}`}
            rows={[
              {
                indicador: "Receitas",
                valor_centavos: income,
                valor: formatCurrency(income),
              },
              {
                indicador: "Despesas",
                valor_centavos: expenses,
                valor: formatCurrency(expenses),
              },
              {
                indicador: "Resultado",
                valor_centavos: result,
                valor: formatCurrency(result),
              },
            ]}
            filename={`finanse-receitas-despesas-${dateFrom}-${dateTo}.csv`}
          />

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <MiniStat label="Receitas" value={formatCurrency(income)} />
            <MiniStat label="Despesas" value={formatCurrency(expenses)} />
            <MiniStat label="Saldo" value={formatCurrency(result)} />
          </div>
        </div>

        <ExpenseDonut
          data={categoryData}
          valueUnit="cents"
          title="Despesas por categoria"
          description="Distribuição das despesas no intervalo filtrado."
        />
      </section>

      <section className="glass-card p-5">
        <SectionHeader
          title="Evolução mensal"
          description={`Últimos 6 meses até ${formatMonthYear(`${reportMonth}-01`)}`}
          rows={monthlyEvolution.map((row) => ({
            mes: row.month,
            receitas_centavos: row.receitas,
            despesas_centavos: row.despesas,
            saldo_centavos: row.saldo,
            receitas: formatCurrency(row.receitas),
            despesas: formatCurrency(row.despesas),
            saldo: formatCurrency(row.saldo),
          }))}
          filename={`finanse-evolucao-mensal-${reportMonth}.csv`}
        />
        <div className="mt-6 h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyEvolution} margin={{ left: 4, right: 8 }}>
              <CartesianGrid
                stroke="rgba(148,163,184,0.14)"
                strokeDasharray="4 8"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(value) => formatCurrencyCompact(Number(value))}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={78}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [
                  formatCurrency(Number(value)),
                  chartLabels[String(name)] ?? String(name),
                ]}
              />
              <Legend />
              <Bar dataKey="receitas" fill="#14D990" radius={[10, 10, 0, 0]} />
              <Bar dataKey="despesas" fill="#FF5A6F" radius={[10, 10, 0, 0]} />
              <Line
                type="monotone"
                dataKey="saldo"
                stroke="#22D3EE"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="glass-card p-5">
          <SectionHeader
            title="Fixas vs variáveis"
            description="Recorrentes cadastradas comparadas ao restante dos gastos."
            rows={fixedVariableData.map((row) => ({
              tipo: row.name,
              valor_centavos: row.amount,
              valor: formatCurrency(row.amount),
            }))}
            filename={`finanse-fixas-variaveis-${reportMonth}.csv`}
          />
          <div className="mt-6 space-y-5">
            {fixedVariableData.map((item) => {
              const ratio = expenses > 0 ? item.amount / expenses : 0;
              return (
                <div key={item.name}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-white">{item.name}</span>
                    <span className="text-[var(--muted)]">
                      {formatCurrency(item.amount)} · {formatPercent(ratio)}
                    </span>
                  </div>
                  <Progress value={Math.min(100, ratio * 100)} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-5">
          <SectionHeader
            title="Dívidas"
            description="Saldo, compromisso mensal e progresso de quitação."
            rows={activeDebts.map((debt) => ({
              divida: debt.name,
              credor: debt.creditor,
              saldo_centavos: debt.current_balance_cents,
              parcela_centavos: debt.installment_amount_cents,
              parcelas_restantes: remainingInstallments(debt),
              previsao_quitacao: estimatedPayoff(debt),
              progresso: formatPercent(debtProgress(debt)),
            }))}
            filename={`finanse-dividas-${reportMonth}.csv`}
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <MiniStat label="Saldo devedor" value={formatCurrency(debtTotal)} />
            <MiniStat
              label="Compromisso mensal"
              value={formatCurrency(debtCommitment)}
            />
            <MiniStat
              label="Renda comprometida"
              value={formatPercent(commitmentRatio)}
            />
          </div>
          <div className="mt-6 space-y-4">
            {activeDebts.map((debt) => (
              <div key={debt.id} className="rounded-2xl border border-[var(--card-border)] p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">{debt.name}</p>
                    <p className="text-xs text-[var(--muted)]">{debt.creditor}</p>
                  </div>
                  <Badge variant={debt.status === "overdue" ? "danger" : "muted"}>
                    {debt.status === "overdue" ? "Atrasada" : "Ativa"}
                  </Badge>
                </div>
                <Progress value={debtProgress(debt) * 100} />
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {formatCurrency(debt.current_balance_cents)} restantes ·{" "}
                  {remainingInstallments(debt)} parcelas
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="glass-card p-5">
          <SectionHeader
            title="Uso de cartões"
            description="Limite utilizado por cartão ativo."
            rows={creditCards.map((card) => {
              const usage = cardUsage(card);
              return {
                cartao: card.name,
                banco: card.bank,
                final: card.last_four,
                limite_centavos: card.credit_limit_cents,
                usado_centavos: usage.usedCents,
                disponivel_centavos: card.available_limit_cents,
                uso: formatPercent(usage.usageRatio),
              };
            })}
            filename={`finanse-cartoes-${reportMonth}.csv`}
          />
          <div className="mt-6 space-y-4">
            {creditCards.map((card) => {
              const usage = cardUsage(card);
              return (
                <div key={card.id} className="rounded-2xl border border-[var(--card-border)] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: card.color }}
                      />
                      <div>
                        <p className="font-bold text-white">{card.name}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {card.bank} · final {card.last_four}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {formatPercent(usage.usageRatio)}
                    </span>
                  </div>
                  <Progress value={usage.usageRatio * 100} />
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {formatCurrency(usage.usedCents)} usados de{" "}
                    {formatCurrency(card.credit_limit_cents)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-5">
          <SectionHeader
            title="Orçamentos"
            description="Performance por categoria no mês selecionado."
            rows={budgetRows.map((row) => ({
              categoria: row.category,
              limite_centavos: row.budget.limit_cents,
              gasto_centavos: row.progress.spentCents,
              restante_centavos: row.progress.remainingCents,
              uso: formatPercent(row.progress.usageRatio),
              nivel: row.progress.level,
            }))}
            filename={`finanse-orcamentos-${reportMonth}.csv`}
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <MiniStat label="Limite planejado" value={formatCurrency(budgetLimit)} />
            <MiniStat label="Gasto realizado" value={formatCurrency(budgetSpent)} />
          </div>
          <div className="mt-6 space-y-4">
            {budgetRows.map((row) => (
              <div key={row.budget.id}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-white">{row.category}</span>
                  <span className="text-[var(--muted)]">
                    {formatCurrency(row.progress.spentCents)} /{" "}
                    {formatCurrency(row.budget.limit_cents)}
                  </span>
                </div>
                <Progress value={Math.min(100, row.progress.usageRatio * 100)} />
              </div>
            ))}
            {budgetRows.length === 0 && (
              <p className="rounded-2xl border border-dashed border-[var(--card-border)] p-4 text-sm text-[var(--muted)]">
                Nenhum orçamento cadastrado para este mês.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-card p-5">
          <SectionHeader
            title="Patrimônio líquido"
            description="Contas, reservas/metas e dívidas consolidadas."
            rows={[
              { indicador: "Saldo em contas", valor_centavos: balance, valor: formatCurrency(balance) },
              { indicador: "Metas e reservas", valor_centavos: saved, valor: formatCurrency(saved) },
              { indicador: "Dívidas", valor_centavos: debtTotal, valor: formatCurrency(debtTotal) },
              { indicador: "Patrimônio líquido", valor_centavos: worth, valor: formatCurrency(worth) },
            ]}
            filename={`finanse-patrimonio-${reportMonth}.csv`}
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <MiniStat label="Saldo em contas" value={formatCurrency(balance)} />
            <MiniStat label="Metas e reservas" value={formatCurrency(saved)} />
            <MiniStat label="Dívidas" value={formatCurrency(debtTotal)} />
            <MiniStat label="Patrimônio líquido" value={formatCurrency(worth)} />
          </div>
        </div>

        <div className="glass-card p-5">
          <SectionHeader
            title="Comprometimento e poupança"
            description="Indicadores para acompanhar folga financeira."
            rows={[
              {
                indicador: "Comprometimento com dívidas",
                taxa: formatPercent(commitmentRatio),
                valor_base: formatCurrency(debtCommitment),
              },
              {
                indicador: "Taxa de poupança",
                taxa: formatPercent(savingsRatio),
                valor_base: formatCurrency(result),
              },
            ]}
            filename={`finanse-indicadores-${reportMonth}.csv`}
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <IndicatorCard
              icon={BadgeDollarSign}
              title="Comprometimento"
              value={formatPercent(commitmentRatio)}
              description={`${formatCurrency(debtCommitment)} em parcelas mensais`}
              good={commitmentRatio <= 0.3}
            />
            <IndicatorCard
              icon={Scale}
              title="Taxa de poupança"
              value={formatPercent(savingsRatio)}
              description={`${formatCurrency(result)} de resultado no período`}
              good={savingsRatio >= 0.15}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  rows,
  filename,
}: {
  title: string;
  description: string;
  rows: CsvRow[];
  filename: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => downloadCsv(filename, rows)}
      >
        <Download className="size-4" />
        Exportar CSV
      </Button>
    </div>
  );
}

function ReportMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  tone: "success" | "danger" | "warning";
}) {
  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-2xl border",
            tone === "success" &&
              "border-[rgba(20,217,144,0.35)] bg-[rgba(20,217,144,0.12)] text-[#a8f7d8]",
            tone === "danger" &&
              "border-[rgba(255,90,111,0.35)] bg-[rgba(255,90,111,0.12)] text-[#ffc2ca]",
            tone === "warning" &&
              "border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.12)] text-[#fde3a3]"
          )}
        >
          <Icon className="size-5" />
        </span>
        <CalendarRange className="size-4 text-[var(--muted-foreground)]" />
      </div>
      <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[rgba(255,255,255,0.03)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-lg font-black tracking-tight text-white">{value}</p>
    </div>
  );
}

function IndicatorCard({
  icon: Icon,
  title,
  value,
  description,
  good,
}: {
  icon: typeof Landmark;
  title: string;
  value: string;
  description: string;
  good: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--card-border)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <Icon className={cn("size-6", good ? "text-[var(--success)]" : "text-[var(--warning)]")} />
        <Badge variant={good ? "success" : "warning"}>{good ? "Saudável" : "Atenção"}</Badge>
      </div>
      <p className="text-sm font-semibold text-[var(--muted)]">{title}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
    </div>
  );
}

function formatMonthShort(month: string) {
  const date = new Date(`${month}-01T00:00:00`);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function downloadCsv(filename: string, rows: CsvRow[]) {
  if (rows.length === 0) {
    rows = [{ mensagem: "Sem dados para o período selecionado" }];
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: CsvValue) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

const fallbackColors = [
  "#1473FF",
  "#22D3EE",
  "#FF5A6F",
  "#14D990",
  "#F59E0B",
  "#8B5CF6",
];

const chartLabels: Record<string, string> = {
  receitas: "Receitas",
  despesas: "Despesas",
  saldo: "Saldo",
};

const tooltipStyle = {
  background: "rgba(8,13,36,0.94)",
  border: "1px solid rgba(100,130,255,0.22)",
  borderRadius: "16px",
  color: "#f8fafc",
  boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
};
