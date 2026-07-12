import type { DebtStatus, TransactionStatus } from "@/types/database";

export type StatusTone =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "muted"
  | "cyan";

export interface StatusMeta {
  label: string;
  description: string;
  tone: StatusTone;
  className: string;
  dotClassName: string;
  color: string;
}

export const transactionStatusMeta: Record<TransactionStatus, StatusMeta> = {
  paid: {
    label: "Pago",
    description: "Transação quitada e conciliada.",
    tone: "success",
    className:
      "border-[rgba(20,217,144,0.42)] bg-[rgba(20,217,144,0.14)] text-[#a8f7d8]",
    dotClassName: "bg-[var(--success)]",
    color: "#14d990",
  },
  pending: {
    label: "Pendente",
    description: "Aguardando pagamento ou conciliação.",
    tone: "warning",
    className:
      "border-[rgba(245,158,11,0.42)] bg-[rgba(245,158,11,0.14)] text-[#fde3a3]",
    dotClassName: "bg-[var(--warning)]",
    color: "#f59e0b",
  },
  due_today: {
    label: "Vence hoje",
    description: "Pagamento previsto para hoje.",
    tone: "cyan",
    className:
      "border-[rgba(34,211,238,0.42)] bg-[rgba(34,211,238,0.14)] text-[#b6f3ff]",
    dotClassName: "bg-[var(--cyan)]",
    color: "#22d3ee",
  },
  overdue: {
    label: "Atrasado",
    description: "Pagamento vencido.",
    tone: "danger",
    className:
      "border-[rgba(255,90,111,0.42)] bg-[rgba(255,90,111,0.14)] text-[#ffc2ca]",
    dotClassName: "bg-[var(--danger)]",
    color: "#ff5a6f",
  },
  scheduled: {
    label: "Agendado",
    description: "Lancamento programado para uma data futura.",
    tone: "default",
    className:
      "border-[rgba(20,115,255,0.42)] bg-[rgba(20,115,255,0.16)] text-[#cfe2ff]",
    dotClassName: "bg-[var(--primary)]",
    color: "#1473ff",
  },
};

export const debtStatusMeta: Record<DebtStatus, StatusMeta> = {
  active: {
    label: "Ativa",
    description: "Divida em pagamento.",
    tone: "default",
    className:
      "border-[rgba(20,115,255,0.42)] bg-[rgba(20,115,255,0.16)] text-[#cfe2ff]",
    dotClassName: "bg-[var(--primary)]",
    color: "#1473ff",
  },
  paid: {
    label: "Quitada",
    description: "Saldo totalmente pago.",
    tone: "success",
    className:
      "border-[rgba(20,217,144,0.42)] bg-[rgba(20,217,144,0.14)] text-[#a8f7d8]",
    dotClassName: "bg-[var(--success)]",
    color: "#14d990",
  },
  overdue: {
    label: "Em atraso",
    description: "Parcela ou saldo vencido.",
    tone: "danger",
    className:
      "border-[rgba(255,90,111,0.42)] bg-[rgba(255,90,111,0.14)] text-[#ffc2ca]",
    dotClassName: "bg-[var(--danger)]",
    color: "#ff5a6f",
  },
  renegotiated: {
    label: "Renegociada",
    description: "Condicoes alteradas em acordo com o credor.",
    tone: "warning",
    className:
      "border-[rgba(245,158,11,0.42)] bg-[rgba(245,158,11,0.14)] text-[#fde3a3]",
    dotClassName: "bg-[var(--warning)]",
    color: "#f59e0b",
  },
};

export function getTransactionStatusMeta(status: TransactionStatus): StatusMeta {
  return transactionStatusMeta[status];
}

export function getDebtStatusMeta(status: DebtStatus): StatusMeta {
  return debtStatusMeta[status];
}

export function getTransactionStatusLabel(status: TransactionStatus): string {
  return transactionStatusMeta[status].label;
}

export function getDebtStatusLabel(status: DebtStatus): string {
  return debtStatusMeta[status].label;
}
