import type {
  Account,
  Budget,
  CreditCard,
  Debt,
  Goal,
  RecurringExpense,
  Transaction,
} from "@/types/database";
import { absCents, addCents, formatPercentChange, subtractCents, type Cents } from "@/lib/money";
import { estimatePayoffDate, getMonthRange, previousMonth } from "@/lib/date";

export function sumByType(
  transactions: Transaction[],
  type: "income" | "expense",
  month?: string
): Cents {
  const range = month ? getMonthRange(month) : null;
  return transactions
    .filter((t) => {
      if (t.type !== type) return false;
      if (!range) return true;
      return t.date >= range.start && t.date <= range.end;
    })
    .reduce((sum, t) => sum + t.amount_cents, 0);
}

export function totalBalance(accounts: Account[]): Cents {
  return accounts
    .filter((a) => a.is_active)
    .reduce((sum, a) => sum + a.current_balance_cents, 0);
}

export function totalDebtBalance(debts: Debt[]): Cents {
  return debts
    .filter((d) => d.status === "active" || d.status === "overdue")
    .reduce((sum, d) => sum + d.current_balance_cents, 0);
}

export function totalSaved(goals: Goal[]): Cents {
  return goals.reduce((sum, g) => sum + g.current_amount_cents, 0);
}

export function netWorth(accounts: Account[], debts: Debt[], goals: Goal[]): Cents {
  return subtractCents(
    addCents(totalBalance(accounts), totalSaved(goals)),
    totalDebtBalance(debts)
  );
}

export function availableUntilMonthEnd(
  accounts: Account[],
  monthIncome: Cents,
  monthExpenses: Cents,
  pendingFixed: Cents
): Cents {
  return subtractCents(
    addCents(totalBalance(accounts), monthIncome),
    addCents(monthExpenses, pendingFixed)
  );
}

export function savingsRate(income: Cents, expenses: Cents): number {
  if (income <= 0) return 0;
  return (income - expenses) / income;
}

export function debtToIncomeRatio(monthlyDebtCommitment: Cents, monthlyIncome: Cents): number {
  if (monthlyIncome <= 0) return 0;
  return monthlyDebtCommitment / monthlyIncome;
}

export function monthlyDebtCommitment(debts: Debt[]): Cents {
  return debts
    .filter((d) => d.status === "active" || d.status === "overdue")
    .reduce((sum, d) => sum + d.installment_amount_cents, 0);
}

export function debtProgress(debt: Debt): number {
  if (debt.original_amount_cents <= 0) return 0;
  const paid = subtractCents(debt.original_amount_cents, debt.current_balance_cents);
  return Math.min(1, Math.max(0, paid / debt.original_amount_cents));
}

export function remainingInstallments(debt: Debt): number {
  return Math.max(0, debt.total_installments - debt.paid_installments);
}

export function estimatedPayoff(debt: Debt): string {
  return estimatePayoffDate(remainingInstallments(debt), debt.due_day);
}

export function totalInterestEstimate(debt: Debt): Cents {
  const remaining = remainingInstallments(debt);
  const totalToPay = debt.installment_amount_cents * remaining;
  return Math.max(0, totalToPay - debt.current_balance_cents);
}

/** Simple amortization simulation for early payoff savings. */
export function simulateEarlyPayoff(
  debt: Debt,
  extraMonthlyCents: Cents
): {
  monthsSaved: number;
  interestSavedCents: Cents;
  newPayoffMonths: number;
} {
  const rate = debt.interest_rate_annual / 100 / 12;
  let balance = debt.current_balance_cents;
  let months = 0;
  let interestPaid = 0;
  const payment = debt.installment_amount_cents + extraMonthlyCents;

  const baseline = simulatePayoff(debt.current_balance_cents, debt.installment_amount_cents, rate);

  while (balance > 0 && months < 600) {
    const interest = Math.round(balance * rate);
    interestPaid += interest;
    balance = balance + interest - payment;
    months += 1;
    if (balance < 0) balance = 0;
  }

  return {
    monthsSaved: Math.max(0, baseline.months - months),
    interestSavedCents: Math.max(0, baseline.interest - interestPaid),
    newPayoffMonths: months,
  };
}

function simulatePayoff(balance: number, payment: number, monthlyRate: number) {
  let b = balance;
  let months = 0;
  let interest = 0;
  while (b > 0 && months < 600) {
    const i = Math.round(b * monthlyRate);
    interest += i;
    b = b + i - payment;
    months += 1;
    if (b < 0) b = 0;
  }
  return { months, interest };
}

export function cardUsage(card: CreditCard): {
  usedCents: Cents;
  usageRatio: number;
} {
  const used = subtractCents(card.credit_limit_cents, card.available_limit_cents);
  return {
    usedCents: used,
    usageRatio: card.credit_limit_cents > 0 ? used / card.credit_limit_cents : 0,
  };
}

export function budgetProgress(
  budget: Budget,
  transactions: Transaction[]
): {
  spentCents: Cents;
  remainingCents: Cents;
  usageRatio: number;
  level: "ok" | "warning" | "critical";
} {
  const range = getMonthRange(budget.month);
  const spent = transactions
    .filter(
      (t) =>
        t.type === "expense" &&
        t.category_id === budget.category_id &&
        t.date >= range.start &&
        t.date <= range.end &&
        t.status !== "scheduled"
    )
    .reduce((sum, t) => sum + t.amount_cents, 0);

  const remaining = subtractCents(budget.limit_cents, spent);
  const usage = budget.limit_cents > 0 ? spent / budget.limit_cents : 0;
  let level: "ok" | "warning" | "critical" = "ok";
  if (usage >= 1) level = "critical";
  else if (usage >= 0.8) level = "warning";

  return { spentCents: spent, remainingCents: remaining, usageRatio: usage, level };
}

export function fixedExpensesSummary(
  recurring: RecurringExpense[],
  transactions: Transaction[],
  month: string,
  monthlyIncome: Cents
) {
  const active = recurring.filter((r) => r.is_active);
  const total = active.reduce((sum, r) => sum + r.amount_cents, 0);
  const range = getMonthRange(month);
  const names = new Set(active.map((r) => r.name.toLowerCase()));

  const paid = transactions
    .filter(
      (t) =>
        t.type === "expense" &&
        t.status === "paid" &&
        t.date >= range.start &&
        t.date <= range.end &&
        names.has(t.description.toLowerCase())
    )
    .reduce((sum, t) => sum + t.amount_cents, 0);

  const pending = Math.max(0, total - paid);
  const incomeShare = monthlyIncome > 0 ? total / monthlyIncome : 0;

  return { total, paid, pending, incomeShare, count: active.length };
}

export function goalOnTrack(goal: Goal, today = new Date()): {
  progress: number;
  projectedCents: Cents;
  onTrack: boolean;
  monthsRemaining: number;
} {
  const progress =
    goal.target_amount_cents > 0 ? goal.current_amount_cents / goal.target_amount_cents : 0;
  const target = new Date(goal.target_date);
  const monthsRemaining = Math.max(
    0,
    (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth())
  );
  const projected =
    goal.current_amount_cents + goal.monthly_contribution_cents * monthsRemaining;
  return {
    progress,
    projectedCents: projected,
    onTrack: projected >= goal.target_amount_cents,
    monthsRemaining,
  };
}

export function monthComparison(
  current: Cents,
  previous: Cents
): { change: number; isPositive: boolean } {
  const change = formatPercentChange(current, previous);
  return { change, isPositive: change >= 0 };
}

export function expensesByCategory(
  transactions: Transaction[],
  categories: { id: string; name: string; color: string }[],
  month: string
) {
  const range = getMonthRange(month);
  const map = new Map<string, number>();

  for (const t of transactions) {
    if (t.type !== "expense") continue;
    if (t.date < range.start || t.date > range.end) continue;
    const key = t.category_id ?? "other";
    map.set(key, (map.get(key) ?? 0) + t.amount_cents);
  }

  return categories
    .map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      value: map.get(c.id) ?? 0,
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function cashFlowSeries(
  transactions: Transaction[],
  days: number
): { date: string; income: number; expense: number; balance: number }[] {
  const result: { date: string; income: number; expense: number; balance: number }[] = [];
  const today = new Date();
  let running = 0;

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayTx = transactions.filter((t) => t.date === key);
    const income = dayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount_cents, 0);
    const expense = dayTx
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount_cents, 0);
    running += income - expense;
    result.push({
      date: key,
      income: income / 100,
      expense: expense / 100,
      balance: running / 100,
    });
  }
  return result;
}

export const absMoney = absCents;

export function previousMonthTotals(transactions: Transaction[], month: string) {
  const prev = previousMonth(month);
  return {
    income: sumByType(transactions, "income", prev),
    expense: sumByType(transactions, "expense", prev),
  };
}
