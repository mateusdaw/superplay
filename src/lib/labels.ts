import type {
  AccountType,
  CardBrand,
  DebtStatus,
  FinancialEventType,
  GoalPriority,
  PaymentMethod,
  Recurrence,
  TransactionStatus,
  TransactionType,
} from "@/types/database";

type Option<T extends string> = {
  value: T;
  label: string;
};

export const accountTypeLabels = {
  checking: "Conta corrente",
  savings: "Poupança",
  wallet: "Carteira digital",
  cash: "Dinheiro",
  investment: "Investimentos",
} satisfies Record<AccountType, string>;

export const transactionTypeLabels = {
  income: "Receita",
  expense: "Despesa",
} satisfies Record<TransactionType, string>;

export const paymentMethodLabels = {
  pix: "Pix",
  debit: "Débito",
  credit: "Crédito",
  boleto: "Boleto",
  transfer: "Transferência",
  cash: "Dinheiro",
  other: "Outro",
} satisfies Record<PaymentMethod, string>;

export const cardBrandLabels = {
  visa: "Visa",
  mastercard: "Mastercard",
  elo: "Elo",
  amex: "American Express",
  hipercard: "Hipercard",
  other: "Outra",
} satisfies Record<CardBrand, string>;

export const recurrenceLabels = {
  monthly: "Mensal",
  weekly: "Semanal",
  yearly: "Anual",
  biweekly: "Quinzenal",
  custom: "Personalizada",
} satisfies Record<Recurrence, string>;

export const transactionStatusLabels = {
  paid: "Pago",
  pending: "Pendente",
  due_today: "Vence hoje",
  overdue: "Atrasado",
  scheduled: "Agendado",
} satisfies Record<TransactionStatus, string>;

export const debtStatusLabels = {
  active: "Ativa",
  paid: "Quitada",
  overdue: "Atrasada",
  renegotiated: "Renegociada",
} satisfies Record<DebtStatus, string>;

export const goalPriorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
} satisfies Record<GoalPriority, string>;

export const financialEventTypeLabels = {
  bill: "Conta",
  debt_installment: "Parcela de dívida",
  subscription: "Assinatura",
  income: "Receita",
  card_closing: "Fechamento do cartão",
  card_due: "Vencimento do cartão",
  goal_contribution: "Aporte em meta",
} satisfies Record<FinancialEventType, string>;

export const categoryTypeLabels = {
  income: "Receita",
  expense: "Despesa",
  both: "Receita e despesa",
} satisfies Record<TransactionType | "both", string>;

export const accountTypeOptions = toOptions(accountTypeLabels);
export const transactionTypeOptions = toOptions(transactionTypeLabels);
export const paymentMethodOptions = toOptions(paymentMethodLabels);
export const cardBrandOptions = toOptions(cardBrandLabels);
export const recurrenceOptions = toOptions(recurrenceLabels);
export const transactionStatusOptions = toOptions(transactionStatusLabels);
export const debtStatusOptions = toOptions(debtStatusLabels);
export const goalPriorityOptions = toOptions(goalPriorityLabels);
export const financialEventTypeOptions = toOptions(financialEventTypeLabels);
export const categoryTypeOptions = toOptions(categoryTypeLabels);

export function labelFor<T extends string>(
  labels: Record<T, string>,
  value: T | null | undefined,
  fallback = "Não informado"
): string {
  if (!value) return fallback;
  return labels[value] ?? fallback;
}

function toOptions<T extends string>(labels: Record<T, string>): Option<T>[] {
  return (Object.entries(labels) as [T, string][]).map(([value, label]) => ({
    value: value as T,
    label,
  }));
}
