import Papa from "papaparse";

import type {
  PaymentMethod,
  TransactionStatus,
  TransactionType,
} from "@/types/database";

export interface TransactionCsvRow {
  descricao: string;
  valor: string;
  tipo: string;
  data: string;
  vencimento?: string;
  pagamento?: string;
  status?: string;
  categoria?: string;
  conta?: string;
  cartao?: string;
  metodo_pagamento?: string;
  observacoes?: string;
  tags?: string;
}

export interface ParsedCsvTransaction {
  description: string;
  amount_cents: number;
  type: TransactionType;
  date: string;
  due_date: string | null;
  payment_date: string | null;
  status: TransactionStatus;
  category_name: string | null;
  account_name: string | null;
  credit_card_name: string | null;
  payment_method: PaymentMethod | null;
  notes: string | null;
  tags: string[];
}

export interface CsvParseError {
  row: number;
  field?: string;
  message: string;
}

export interface ParseTransactionsCsvOptions {
  delimiter?: string;
}

export interface ParseTransactionsCsvResult {
  data: ParsedCsvTransaction[];
  errors: CsvParseError[];
}

export interface ExportableTransaction {
  description: string;
  amount_cents: number;
  type: TransactionType;
  date: string | Date;
  due_date?: string | Date | null;
  payment_date?: string | Date | null;
  status?: TransactionStatus | null;
  category_name?: string | null;
  account_name?: string | null;
  credit_card_name?: string | null;
  payment_method?: PaymentMethod | null;
  notes?: string | null;
  tags?: string[] | null;
}

const CSV_COLUMNS: Array<keyof TransactionCsvRow> = [
  "descricao",
  "valor",
  "tipo",
  "data",
  "vencimento",
  "pagamento",
  "status",
  "categoria",
  "conta",
  "cartao",
  "metodo_pagamento",
  "observacoes",
  "tags",
];

const HEADER_ALIASES: Record<string, keyof TransactionCsvRow> = {
  descricao: "descricao",
  descri_o: "descricao",
  description: "descricao",
  lancamento: "descricao",
  transacao: "descricao",
  valor: "valor",
  amount: "valor",
  tipo: "tipo",
  type: "tipo",
  data: "data",
  date: "data",
  vencimento: "vencimento",
  data_vencimento: "vencimento",
  due_date: "vencimento",
  pagamento: "pagamento",
  data_pagamento: "pagamento",
  payment_date: "pagamento",
  status: "status",
  situacao: "status",
  categoria: "categoria",
  category: "categoria",
  conta: "conta",
  account: "conta",
  cartao: "cartao",
  cartao_credito: "cartao",
  credit_card: "cartao",
  metodo_pagamento: "metodo_pagamento",
  forma_pagamento: "metodo_pagamento",
  payment_method: "metodo_pagamento",
  observacoes: "observacoes",
  notas: "observacoes",
  notes: "observacoes",
  tags: "tags",
  etiquetas: "tags",
};

const STATUS_BY_LABEL: Record<string, TransactionStatus> = {
  pago: "paid",
  paga: "paid",
  paid: "paid",
  quitado: "paid",
  pendente: "pending",
  pending: "pending",
  aberto: "pending",
  vence_hoje: "due_today",
  vencendo_hoje: "due_today",
  due_today: "due_today",
  atrasado: "overdue",
  atrasada: "overdue",
  vencido: "overdue",
  overdue: "overdue",
  agendado: "scheduled",
  agendada: "scheduled",
  scheduled: "scheduled",
};

const PAYMENT_METHOD_BY_LABEL: Record<string, PaymentMethod> = {
  pix: "pix",
  debito: "debit",
  debit: "debit",
  cartao_de_debito: "debit",
  credito: "credit",
  credit: "credit",
  cartao_de_credito: "credit",
  boleto: "boleto",
  transferencia: "transfer",
  transfer: "transfer",
  ted: "transfer",
  doc: "transfer",
  dinheiro: "cash",
  cash: "cash",
  outro: "other",
  outros: "other",
  other: "other",
};

const TYPE_BY_LABEL: Record<string, TransactionType> = {
  receita: "income",
  entrada: "income",
  income: "income",
  ganho: "income",
  despesa: "expense",
  saida: "expense",
  expense: "expense",
  gasto: "expense",
};

const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

export function normalizeCsvHeader(header: string): string {
  return normalizeKey(header);
}

export function parsePtBrAmountToCents(input: string | number): number {
  if (typeof input === "number") {
    return Math.round(input * 100);
  }

  const trimmed = input.trim();
  if (!trimmed) return 0;

  const isParenthesizedNegative = /^\(.*\)$/.test(trimmed);
  const hasNegativeSign = trimmed.includes("-");
  const normalized = trimmed
    .replace(/[R$\s]/g, "")
    .replace(/[()]/g, "")
    .replace(/-/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number.parseFloat(normalized);

  if (!Number.isFinite(parsed)) return 0;

  const cents = Math.round(parsed * 100);
  return isParenthesizedNegative || hasNegativeSign ? -cents : cents;
}

export function formatCentsAsPtBrAmount(cents: number): string {
  return BRL_FORMATTER.format(cents / 100);
}

export function parseTransactionsCsv(
  csv: string,
  options: ParseTransactionsCsvOptions = {}
): ParseTransactionsCsvResult {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    delimiter: options.delimiter,
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => {
      const normalized = normalizeKey(header);
      return HEADER_ALIASES[normalized] ?? normalized;
    },
  });

  const errors: CsvParseError[] = parsed.errors.map((error) => ({
    row: (error.row ?? 0) + 1,
    message: error.message,
  }));

  const data: ParsedCsvTransaction[] = [];

  parsed.data.forEach((row, index) => {
    const csvRow = row as Partial<Record<keyof TransactionCsvRow, string>>;
    const rowNumber = index + 2;
    const description = readString(csvRow.descricao);
    const rawAmount = readString(csvRow.valor);
    const rawDate = readString(csvRow.data);

    if (!description) {
      errors.push({
        row: rowNumber,
        field: "descricao",
        message: "Descricao obrigatoria.",
      });
    }

    if (!rawAmount) {
      errors.push({
        row: rowNumber,
        field: "valor",
        message: "Valor obrigatorio.",
      });
    }

    if (!rawDate) {
      errors.push({
        row: rowNumber,
        field: "data",
        message: "Data obrigatoria.",
      });
    }

    if (!description || !rawAmount || !rawDate) return;

    const signedAmountCents = parsePtBrAmountToCents(rawAmount);
    const amountCents = Math.abs(signedAmountCents);
    const type = parseTransactionType(csvRow.tipo, signedAmountCents);
    const date = parseDateToIso(rawDate);
    const dueDate = parseOptionalDate(csvRow.vencimento);
    const paymentDate = parseOptionalDate(csvRow.pagamento);

    if (!date) {
      errors.push({
        row: rowNumber,
        field: "data",
        message: "Data invalida. Use dd/MM/aaaa ou aaaa-MM-dd.",
      });
      return;
    }

    data.push({
      description,
      amount_cents: amountCents,
      type,
      date,
      due_date: dueDate,
      payment_date: paymentDate,
      status: parseStatus(csvRow.status, paymentDate),
      category_name: readNullable(csvRow.categoria),
      account_name: readNullable(csvRow.conta),
      credit_card_name: readNullable(csvRow.cartao),
      payment_method: parsePaymentMethod(csvRow.metodo_pagamento),
      notes: readNullable(csvRow.observacoes),
      tags: parseTags(csvRow.tags),
    });
  });

  return { data, errors };
}

export function exportTransactionsCsv(
  transactions: ExportableTransaction[],
  options: { delimiter?: string; includeBom?: boolean } = {}
): string {
  const rows: TransactionCsvRow[] = transactions.map((transaction) => ({
    descricao: transaction.description,
    valor: formatCentsAsPtBrAmount(transaction.amount_cents),
    tipo: transaction.type === "income" ? "Receita" : "Despesa",
    data: formatDateForCsv(transaction.date),
    vencimento: formatOptionalDateForCsv(transaction.due_date),
    pagamento: formatOptionalDateForCsv(transaction.payment_date),
    status: formatStatus(transaction.status),
    categoria: transaction.category_name ?? "",
    conta: transaction.account_name ?? "",
    cartao: transaction.credit_card_name ?? "",
    metodo_pagamento: formatPaymentMethod(transaction.payment_method),
    observacoes: transaction.notes ?? "",
    tags: transaction.tags?.join(", ") ?? "",
  }));

  const csv = Papa.unparse(rows, {
    columns: CSV_COLUMNS,
    delimiter: options.delimiter ?? ";",
    header: true,
  });

  return options.includeBom ? `\uFEFF${csv}` : csv;
}

function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function readString(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function readNullable(value: string | undefined): string | null {
  const normalized = readString(value);
  return normalized.length > 0 ? normalized : null;
}

function parseTransactionType(
  value: string | undefined,
  signedAmountCents: number
): TransactionType {
  const normalized = normalizeKey(readString(value));
  return TYPE_BY_LABEL[normalized] ?? (signedAmountCents < 0 ? "expense" : "income");
}

function parseStatus(
  value: string | undefined,
  paymentDate: string | null
): TransactionStatus {
  const normalized = normalizeKey(readString(value));
  if (normalized && STATUS_BY_LABEL[normalized]) {
    return STATUS_BY_LABEL[normalized];
  }
  return paymentDate ? "paid" : "pending";
}

function parsePaymentMethod(value: string | undefined): PaymentMethod | null {
  const normalized = normalizeKey(readString(value));
  return normalized ? PAYMENT_METHOD_BY_LABEL[normalized] ?? "other" : null;
}

function parseTags(value: string | undefined): string[] {
  return readString(value)
    .split(/[;,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseOptionalDate(value: string | undefined): string | null {
  const parsed = parseDateToIso(readString(value));
  return parsed || null;
}

function parseDateToIso(value: string): string | null {
  if (!value) return null;

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (isoMatch) {
    return isValidDateParts(isoMatch[1], isoMatch[2], isoMatch[3])
      ? value
      : null;
  }

  const ptBrMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  if (!ptBrMatch) return null;

  const [, day, month, year] = ptBrMatch;
  if (!isValidDateParts(year, month, day)) return null;

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function isValidDateParts(year: string, month: string, day: string): boolean {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  const date = new Date(Date.UTC(y, m - 1, d));

  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

function formatDateForCsv(value: string | Date): string {
  const date = typeof value === "string" ? parseDateToIso(value) : null;
  if (date) {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }

  const asDate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(asDate.getTime())) return "";

  const day = String(asDate.getUTCDate()).padStart(2, "0");
  const month = String(asDate.getUTCMonth() + 1).padStart(2, "0");
  const year = String(asDate.getUTCFullYear());
  return `${day}/${month}/${year}`;
}

function formatOptionalDateForCsv(value: string | Date | null | undefined): string {
  return value ? formatDateForCsv(value) : "";
}

function formatStatus(status: TransactionStatus | null | undefined): string {
  const labels: Record<TransactionStatus, string> = {
    paid: "Pago",
    pending: "Pendente",
    due_today: "Vence hoje",
    overdue: "Atrasado",
    scheduled: "Agendado",
  };
  return status ? labels[status] : "";
}

function formatPaymentMethod(method: PaymentMethod | null | undefined): string {
  const labels: Record<PaymentMethod, string> = {
    pix: "Pix",
    debit: "Debito",
    credit: "Credito",
    boleto: "Boleto",
    transfer: "Transferencia",
    cash: "Dinheiro",
    other: "Outro",
  };
  return method ? labels[method] : "";
}
